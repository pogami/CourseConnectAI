import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import { filterContent, generateFilterResponse } from '@/lib/content-filter';
import { createAIResponseNotification } from '@/lib/notifications/server';
import {
  generateDeadlineContext,
  detectQuestionComplexity,
  getAdaptiveInstructions,
  isQuizRequest,
  extractQuizTopic,
  detectConfusion,
  isStudyPlanRequest,
  generateStudyPlan,
  isAssignmentHelpRequest,
  findRelevantAssignment,
  extractTopics,
  calculateDaysUntil,
  isPracticeExamRequest,
  isResourceRequest,
  generateMemoryContext,
  generatePracticeExamInstructions
} from '@/lib/ai-intelligence-utils';
import { extractSourcesFromCourseData, parseCitationsFromResponse } from '@/lib/syllabus-source-extractor';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { 
      question, 
      context, 
      conversationHistory, 
      shouldCallAI = true, 
      courseData,
      chatId,
      metadata,
      userId 
    } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Clean @ mentions from the question if present
    const cleanedQuestion = question.replace(/@ai\s*/gi, '').trim();
    const lowerQuestion = cleanedQuestion.toLowerCase();

    // Content filtering for safety
    const filterResult = filterContent(cleanedQuestion);
    if (!filterResult.isSafe) {
      console.log(`Content filtered: ${filterResult.category} (confidence: ${filterResult.confidence})`);
      return NextResponse.json({
        success: true,
        answer: generateFilterResponse(filterResult),
        provider: 'safety-filter',
        shouldRespond: true,
        timestamp: new Date().toISOString(),
        sources: [],
        crisisResources: filterResult.crisisResources
      });
    }

    // Detect question characteristics
    const questionComplexity = detectQuestionComplexity(cleanedQuestion);
    const isQuiz = isQuizRequest(cleanedQuestion);
    const isConfused = detectConfusion(cleanedQuestion);
    const wantsStudyPlan = isStudyPlanRequest(cleanedQuestion);
    const needsAssignmentHelp = isAssignmentHelpRequest(cleanedQuestion);
    const wantsPracticeExam = isPracticeExamRequest(cleanedQuestion);
    const wantsResources = isResourceRequest(cleanedQuestion);

    console.log('Class Chat API called with:', { 
      question: cleanedQuestion, 
      context, 
      conversationHistory: conversationHistory?.length || 0, 
      shouldCallAI,
      questionCharacteristics: {
        complexity: questionComplexity,
        isQuiz,
        isConfused,
        wantsStudyPlan,
        needsAssignmentHelp,
        wantsPracticeExam,
        wantsResources
      },
      courseData: courseData ? {
        courseName: courseData.courseName,
        courseCode: courseData.courseCode,
        topicsCount: courseData.topics?.length || 0,
        assignmentsCount: courseData.assignments?.length || 0,
        examsCount: courseData.exams?.length || 0
      } : null,
      chatId,
      timestamp: new Date().toISOString()
    });

    // Build course-specific context with intelligent features
    let courseContext = '';
    let specialInstructions = '';
    
    if (courseData) {
      const { courseName, courseCode, professor, university, semester, year, classTime, topics, assignments, exams } = courseData;

      const respondWith = (answer: string) => NextResponse.json({
        success: true,
        answer,
        provider: 'syllabus-direct',
        shouldRespond: true,
        timestamp: new Date().toISOString()
      });

      const wantsProfessor = lowerQuestion.includes('who is my professor') ||
        lowerQuestion.includes('professor') ||
        lowerQuestion.includes('teacher');

      const wantsClassTime = lowerQuestion.includes('what time is class') ||
        lowerQuestion.includes('when does class meet') ||
        lowerQuestion.includes('class time') ||
        lowerQuestion.includes('schedule');

      const wantsUniversity = lowerQuestion.includes('what school') ||
        lowerQuestion.includes('what university') ||
        lowerQuestion.includes('which campus');

      const wantsCourseName = lowerQuestion.includes('what class is this') ||
        lowerQuestion.includes('what course is this') ||
        lowerQuestion.includes('which class is this') ||
        lowerQuestion.includes('what course am i in');

      if (wantsProfessor && professor) {
        return respondWith(`Your professor for ${courseName || courseCode || 'this course'} is ${professor}.`);
      }

      if (wantsClassTime && classTime) {
        return respondWith(`${courseName || courseCode || 'This class'} meets ${classTime}.`);
      }

      if (wantsUniversity && university) {
        return respondWith(`${courseName || courseCode || 'This course'} is part of ${university}.`);
      }

      if (wantsCourseName && (courseName || courseCode)) {
        const details = [
          courseName ? `Course: ${courseName}` : null,
          courseCode ? `Course Code: ${courseCode}` : null,
          professor ? `Professor: ${professor}` : null,
          classTime ? `Class Time: ${classTime}` : null
        ].filter(Boolean).join(' — ');
        return respondWith(details);
      }

      // Add deadline awareness
      const deadlineContext = generateDeadlineContext(courseData);
      
      // Add adaptive complexity instructions
      const adaptiveInstructions = getAdaptiveInstructions(questionComplexity);
      
      // Add memory context (persistent learning)
      const memoryContext = generateMemoryContext(metadata);
      
      // Handle special request types
      if (wantsPracticeExam && topics && topics.length > 0) {
        const nextExam = exams?.find((exam: any) => calculateDaysUntil(exam.date || '') >= 0);
        specialInstructions = `\n\n📝 PRACTICE EXAM MODE - INTERACTIVE:
Generate a comprehensive practice exam${nextExam?.name ? ` for ${nextExam.name}` : ''}.

CRITICAL: You MUST output the exam in this EXACT format:

First, write a brief introduction (1-2 sentences).

Then on a new line, output:
EXAM_DATA: {"topic":"${nextExam?.name || courseName}","timeLimit":30,"questions":[{"question":"Your question here","options":["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],"answer":"A","explanation":"Why this is correct"},{"question":"Next question","options":["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],"answer":"B","explanation":"Explanation"}]}

Requirements:
- 20 questions total covering: ${topics.join(', ')}
- All must be multiple choice with 4 options (A, B, C, D)
- Answer must be just the letter (A, B, C, or D)
- Include brief explanation for each
- Difficulty progression (easier → harder)
- Cover topics evenly

The JSON must be valid and on ONE line after EXAM_DATA:`;
      } else if (wantsResources) {
        const topicForResources = extractTopics(cleanedQuestion, topics || []).join(', ') || courseName;
        specialInstructions = `\n\n📚 RESOURCE RECOMMENDATION REQUEST:
The student wants learning resources for: ${topicForResources}

Provide 3-5 high-quality resources with clickable blue links:
- YouTube videos (use https://youtube.com/results?search_query= format)
- Khan Academy articles (if relevant)
- Educational websites

Format each as: [Resource Title](actual_working_url)

Example:
"Here are some great resources for ${topicForResources}:

[Introduction to ${topicForResources} - YouTube](https://youtube.com/results?search_query=${encodeURIComponent(topicForResources + ' tutorial')})

[${topicForResources} Explained - Khan Academy](https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(topicForResources)})

Make sure URLs are actual working links, not placeholders!"`;
      } else if (isQuiz && topics && topics.length > 0) {
        const quizTopic = extractQuizTopic(cleanedQuestion, topics) || 'the course material';
        specialInstructions = `\n\n🎯 QUIZ MODE ACTIVATED - INTERACTIVE:
The student wants to be quizzed on: ${quizTopic}

CRITICAL: You MUST output the quiz in this EXACT format:

First, write a brief encouraging message (1 sentence).

Then on a new line, output:
QUIZ_DATA: {"topic":"${quizTopic}","questions":[{"question":"Your question here","options":["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],"answer":"A","explanation":"Brief explanation"},{"question":"Next question","options":["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],"answer":"B","explanation":"Explanation"}]}

Requirements:
- 5 questions total about ${quizTopic}
- All must be multiple choice with 4 options (A, B, C, D)
- Answer must be just the letter (A, B, C, or D)
- Include brief explanation for each
- Cover different aspects (definitions, applications, connections)

The JSON must be valid and on ONE line after QUIZ_DATA:`;
      } else if (wantsStudyPlan && exams && exams.length > 0) {
        const nextExam = exams
          .map((exam: any) => ({ ...exam, daysUntil: calculateDaysUntil(exam.date || '') }))
          .filter((exam: any) => exam.daysUntil >= 0)
          .sort((a: any, b: any) => a.daysUntil - b.daysUntil)[0];
          
        if (nextExam && nextExam.date) {
          const studyPlan = generateStudyPlan(nextExam.name, nextExam.date, topics || []);
          specialInstructions = `\n\n📅 STUDY PLAN REQUEST:
The student wants help preparing for ${nextExam.name}.
Here's a study plan you should present:

${studyPlan}

Present this naturally and offer to help with any specific topics.`;
        }
      } else if (needsAssignmentHelp && assignments && assignments.length > 0) {
        const relevantAssignment = findRelevantAssignment(cleanedQuestion, assignments);
        if (relevantAssignment) {
          specialInstructions = `\n\n📝 ASSIGNMENT HELP REQUEST:
The student needs help with: ${relevantAssignment.name}
${relevantAssignment.dueDate ? `Due: ${relevantAssignment.dueDate}` : ''}
${relevantAssignment.description ? `Description: ${relevantAssignment.description}` : ''}

Provide specific, actionable guidance for this assignment:
- Break down what they need to do
- Give concrete steps or approach
- Connect to course topics
- Offer to help with specific parts`;
        }
      } else if (isConfused) {
        specialInstructions = `\n\n💡 CONFUSION DETECTED:
The student is struggling with this concept.
- Break it down step-by-step
- Use simple language
- Provide multiple examples
- Check understanding before moving forward
- Be extra patient and encouraging`;
      }
      
      // Get current date for context awareness
      const today = new Date();
      const currentDate = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Categorize exams as upcoming or past
      const upcomingExams = exams?.filter((exam: any) => calculateDaysUntil(exam.date || '') >= 0) || [];
      const pastExams = exams?.filter((exam: any) => calculateDaysUntil(exam.date || '') < 0) || [];

      courseContext = `\n\nCOURSE CONTEXT - You are the AI assistant for ${courseName}${courseCode ? ` (${courseCode})` : ''}:

📅 TODAY'S DATE: ${currentDate}

${professor ? `👨‍🏫 PROFESSOR: ${professor} (IMPORTANT: Use this name when answering questions about the course or professor)` : '⚠️ No professor name found in syllabus'}
${classTime ? `🕐 CLASS TIME: ${classTime} (IMPORTANT: Use this when answering questions about when class meets)` : '⚠️ No class time found in syllabus'}
${university ? `🏫 University: ${university}` : ''}
${semester && year ? `📅 Semester: ${semester} ${year}` : ''}

📚 Course Topics (${topics?.length || 0} topics):
${topics && topics.length > 0 ? topics.map((topic: string) => `- ${topic}`).join('\n') : 'No topics listed'}

📝 Assignments (${assignments?.length || 0} assignments):
${assignments && assignments.length > 0 ? assignments.map((assignment: any) => {
  const daysUntil = assignment.dueDate ? calculateDaysUntil(assignment.dueDate) : null;
  const isPast = daysUntil !== null && daysUntil < 0;
  return `- ${assignment.name}${assignment.dueDate ? ` (Due: ${assignment.dueDate})` : ''}${isPast ? ' [PAST DUE]' : ''}${assignment.description ? ` - ${assignment.description}` : ''}`;
}).join('\n') : 'No assignments listed'}

📅 Upcoming Exams (${upcomingExams.length} exams):
${upcomingExams.length > 0 ? upcomingExams.map((exam: any) => {
  const daysUntil = calculateDaysUntil(exam.date || '');
  return `- ${exam.name}${exam.date ? ` (Date: ${exam.date}, ${daysUntil} days from now)` : ''}`;
}).join('\n') : 'No upcoming exams'}

📋 Past Exams (${pastExams.length} exams):
${pastExams.length > 0 ? pastExams.map((exam: any) => 
  `- ${exam.name}${exam.date ? ` (Was on: ${exam.date})` : ''} [COMPLETED]`
).join('\n') : 'No past exams yet'}
${deadlineContext}

You have access to this course's syllabus information and can help with:
- Questions about course topics and concepts
- Assignment help and due date reminders
- Exam preparation and study strategies
- Course-specific academic guidance
- Clarifying course requirements and policies
${adaptiveInstructions}
${memoryContext}
${specialInstructions}

CRITICAL - USE COURSE DETAILS:
- You MUST use the professor name when it's provided above (e.g., "According to ${professor || 'your professor'}" or "As ${professor || 'your professor'} mentioned...")
- You MUST use the class time when it's provided above (e.g., "Your class meets ${classTime || 'at the scheduled time'}")
- NEVER say you don't have access to professor name, class time, or other course details if they're listed in the course context above
- Reference specific course details: professor name, class time, course code, topics, assignments, exam dates
- If the student asks "who is my professor" and the professor name is in the context above, tell them directly (e.g., "Your professor is ${professor}")
- If the student asks "what time is class" or "when does class meet" and classTime is in the context above, tell them directly (e.g., "Class meets ${classTime}")
- Use the actual course information provided - don't say you don't have access to it

IMPORTANT: 
- You have full access to the syllabus and course details above
- Be proactive and encouraging - start helping immediately without asking what they want
- Use specific details from the syllabus to show you know the course
- Be enthusiastic and supportive, like a knowledgeable study buddy
- Don't ask "what would you like to know?" - instead, offer specific help based on the context`;
    }

    // Build conversation context with file information
    const convoContext = conversationHistory?.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg: any) => {
          let content = msg.content || '';
          // Add file information if present
          if (msg.files && msg.files.length > 0) {
            const fileInfo = msg.files.map((f: any) => `${f.name} (${f.type})`).join(', ');
            content += ` [Attached files: ${fileInfo}]`;
          } else if (msg.file) {
            content += ` [Attached file: ${msg.file.name} (${msg.file.type})]`;
          }
          return `${msg.role === 'assistant' ? 'AI' : 'User'}: ${content}`;
        }).join('\n')}\n\n`
      : '';

    // Create course-aware prompt
    const prompt = `You are CourseConnect AI, an enthusiastic and knowledgeable academic tutor for this specific course.

🚨 CRITICAL INSTRUCTIONS - READ THIS FIRST:
- You have COMPLETE ACCESS to the syllabus data below
- If the student asks "who is my professor" and a professor name is listed below, answer DIRECTLY with that name (e.g., "Your professor is [NAME]")
- If the student asks "what time is class" or "when does class meet" and class time is listed below, answer DIRECTLY (e.g., "Class meets [TIME]")
- If the student asks about ANYTHING in the syllabus (school, topics, assignments, exams), use the EXACT information from below
- NEVER say "I don't have access" or "check your syllabus" - you HAVE the syllabus data right here
- The course information below is REAL and ACCURATE - use it directly in your answers

${courseContext}

Your personality and approach:
- Talk like a friendly, knowledgeable study buddy - casual but smart
- NO markdown formatting (no ###, no numbered lists)
- Avoid bold (**text**) and italics (*text*) - only use them very sparingly for critical emphasis (1-2 times per response max)
- Write naturally like you're texting or chatting, not writing a document
- Use simple paragraphs and natural line breaks
- Be encouraging and positive - help them build confidence
- Get straight to the point, no fluff or formal structure
- Vary your approach: sometimes explain deeply, sometimes ask questions, sometimes test understanding

Response guidelines:
- For "what is this course" questions: Give an enthusiastic overview using SPECIFIC details from the syllabus (course topics, professor, assignments, exams). Show that you know the actual course!
- For vague requests: Jump right into explaining relevant course topics with specific examples from the syllabus
- For specific questions: Give clear, detailed explanations in a conversational tone
- For confusion: Break down complex concepts step-by-step in simple language
- Always reference actual course information from the syllabus (specific topics, assignment names, exam dates)
- Keep it conversational - write like you're talking to them in person
- Use emojis very sparingly (1-2 max per response)
- Reference specific course details naturally in conversation
- Connect topics to real-world applications when it makes sense
- When discussing the course, ALWAYS use the actual syllabus details provided, not generic information
- NO formal formatting - just natural paragraphs and conversational flow

CRITICAL - DATE AWARENESS:
- You know TODAY'S DATE (provided above)
- For PAST exams/assignments: Ask how they did! Be encouraging and supportive. Say things like "How did that exam go?" or "How are you feeling about how it went?"
- For UPCOMING exams/assignments: Remind them and help them prepare. Say "You have X days until the exam - let's make sure you're ready!"
- NEVER say an exam is "coming up" if it already happened - check the dates!
- Show you care about their progress by asking about past deadlines

CRITICAL - QUIZ RESULTS FEEDBACK:
- When student shares quiz results, immediately acknowledge their effort and score
- For scores: Be encouraging regardless of score! Focus on growth and learning
- If they got questions wrong: Address EACH wrong question topic specifically with helpful explanations
- Structure your response like: "Great job on the quiz! I see you got X/Y. Let's tackle those questions you missed..."
- Then for each wrong question, explain the concept clearly and ask if they have follow-up questions
- Make them feel supported and motivated to improve
- Show enthusiasm about helping them master the material

CRITICAL - FILE ATTACHMENT MEMORY:
- ALWAYS remember when students attach files/images in previous messages
- If they ask about "what I attached" or reference "the image/file", refer to the specific files they shared
- When you see [Attached file: filename] in conversation history, remember that file was shared
- If they ask follow-up questions about attached content, acknowledge the specific file they shared
- NEVER say "you didn't attach anything" if the conversation history shows file attachments

CRITICAL - CITATION REQUIREMENTS:
- When you reference ANY information from the syllabus, you MUST cite the source
- Use this exact citation format: [Source: filename, Page X, Line Y]
- Include citations inline with your answer, not at the end
- If you reference multiple pieces of information, cite each one separately
- Be specific about page and line numbers when available
- The syllabus filename is: ${courseData?.fileName || 'Syllabus'}

Example citation format:
"The course meets on Mondays and Wednesdays [Source: ${courseData?.fileName || 'Syllabus'}, Page 1, Line 15] and the final exam is on December 15th [Source: ${courseData?.fileName || 'Syllabus'}, Page 3, Line 42]."

${convoContext}Student: ${cleanedQuestion}

CourseConnect AI:`;

    // Use OpenAI as primary for class chat (better contextual responses)
    let aiResponse: string;
    let selectedModel: string;
    
    try {
      console.log('Using OpenAI for class chat (better context understanding)');
      
      // Try OpenAI first with gpt-4o-mini
      if (process.env.OPENAI_API_KEY) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are CourseConnect AI, a supportive and engaging academic tutor. Be conversational and genuinely helpful like a caring tutor. Adapt your response style based on the student\'s input: sometimes explain deeply, sometimes ask questions, sometimes test understanding. Use course context to provide relevant examples. Be encouraging and positive. Avoid generic responses - just start helping immediately. Vary your endings: sometimes ask questions, sometimes offer to continue, sometimes test understanding, sometimes just explain more.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1500,
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log('OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || 'No response generated';
          selectedModel = 'openai-gpt4o';
          
          console.log(`Class chat AI response from OpenAI (gpt-4o-mini): ${aiResponse.substring(0, 100)}...`);
          
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          throw openaiError;
        }
      } else {
        throw new Error('No OpenAI API key');
      }
      
    } catch (error) {
      // Fallback to Google AI if OpenAI fails
      try {
        if (process.env.GOOGLE_AI_API_KEY) {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log('Google AI API error:', response.status, errorText);
            throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
          selectedModel = 'google-gemini';
          
          console.log(`Class chat AI response from Google AI: ${aiResponse.substring(0, 100)}...`);
          
        } else {
          throw new Error('No Google AI API key');
        }
        
      } catch (googleError) {
        console.log('AI service failed for class chat, using fallback response');
        
        // Enhanced fallback responses that are proactive and helpful
        const lowerQuestion = cleanedQuestion.toLowerCase();
        
        if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
          aiResponse = `Hello! I'm your AI assistant for ${courseData?.courseName || 'this course'}. I'm excited to help you succeed! 

I can assist you with:
• Understanding course concepts and topics
• Assignment guidance and study strategies  
• Exam preparation and review
• Clarifying course requirements

What would you like to dive into first?`;
        } else if (lowerQuestion.includes('help') || lowerQuestion.includes('can you help')) {
          if (courseData) {
            const topics = courseData.topics?.slice(0, 3).join(', ') || 'various topics';
            const assignmentCount = courseData.assignments?.length || 0;
            const examCount = courseData.exams?.length || 0;
            
            aiResponse = `Of course! I'm excited to help you with ${courseData.courseName}. 

Let me dive right in - this course covers some really interesting topics like ${topics}${courseData.topics?.length > 3 ? ' and more' : ''}. ${assignmentCount > 0 ? `You've got ${assignmentCount} assignments coming up, ` : ''}${examCount > 0 ? `and ${examCount} exams to prepare for. ` : ''}

What's been challenging for you? Are you struggling with understanding any particular concepts, or do you need help with study strategies? I'm here to break things down and help you feel more confident about the material!`;
          } else {
            aiResponse = `Absolutely! I'm here to help you succeed. 

I can help you understand course concepts, work through assignments, prepare for exams, and develop effective study strategies. 

What's on your mind? What topic or concept would you like to dive into together?`;
          }
        } else if (lowerQuestion.includes('what is this course') || lowerQuestion.includes('tell me about this course')) {
          if (courseData) {
            const topics = courseData.topics?.slice(0, 3).join(', ') || 'various topics';
            aiResponse = `Great question! ${courseData.courseName}${courseData.courseCode ? ` (${courseData.courseCode})` : ''} is an exciting course that covers ${topics}${courseData.topics?.length > 3 ? ' and more' : ''}.

${courseData.professor ? `👨‍🏫 **Professor**: ${courseData.professor}` : ''}
📚 **Topics**: ${courseData.topics?.length || 0} key concepts to master
📝 **Assignments**: ${courseData.assignments?.length || 0} assignments to complete
📅 **Exams**: ${courseData.exams?.length || 0} exams to prepare for

This course will help you develop important skills and knowledge. What aspect interests you most?`;
          } else {
            aiResponse = "I'm having some trouble right now, but don't worry! 🤔\n\n**Here's what you can do:**\n\n📚 Check your syllabus details in the sidebar\n📝 Review upcoming assignments and exam dates\n🔍 Browse through your course topics\n⏰ Try asking me again in a moment\n\nI'll be back soon!";
          }
        } else if (lowerQuestion.includes('assignment') || lowerQuestion.includes('homework')) {
          const assignmentCount = courseData?.assignments?.length || 0;
          aiResponse = `I'd love to help with assignments! ${assignmentCount > 0 ? `I see you have ${assignmentCount} assignments in this course. ` : ''}

Let's tackle this together! I can help you break down the requirements, understand the concepts, and structure your work effectively. 

What assignment are you working on? What's the main challenge you're facing - is it understanding the topic, organizing your thoughts, or something else?`;
        } else if (lowerQuestion.includes('exam') || lowerQuestion.includes('test')) {
          const examCount = courseData?.exams?.length || 0;
          aiResponse = `Exam preparation is one of my specialties! ${examCount > 0 ? `I can help you prepare for your ${examCount} exams. ` : ''}

Let's create a solid study plan together! I can help you review key concepts, practice with sample questions, and develop effective study strategies that work for you.

What exam are you preparing for? Which topics are you feeling less confident about?`;
        } else {
          if (courseData) {
            aiResponse = `That's a great question about ${courseData.courseName}! I'm here to help you succeed.

I can help you understand course concepts, work through assignments, prepare for exams, and develop effective study strategies. 

What's on your mind? What topic or concept would you like to explore together?`;
          } else {
            aiResponse = `That's a great question! I'm here to help you succeed academically.

I can help you understand complex concepts, work through assignments, prepare for exams, and develop effective study strategies.

What would you like to dive into? What's challenging you right now?`;
          }
        }
        selectedModel = 'fallback';
      }
    }

    // Final sanitation: limit emoji usage
    const sanitizeEmojis = (text: string): string => {
      try {
        return (text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
      } catch {
        return (text || '').replace(/[\x80-\uFFFF]/g, '');
      }
    };

    aiResponse = sanitizeEmojis(aiResponse);

    // Extract topics mentioned in the conversation for tracking
    const mentionedTopics = courseData?.topics 
      ? extractTopics(cleanedQuestion, courseData.topics)
      : [];

    // Extract sources from syllabus text based on the question
    let syllabusSources: Array<{ fileName: string; page?: number; line?: number; excerpt: string }> = [];
    if (courseData) {
      try {
        const extractedSources = extractSourcesFromCourseData(cleanedQuestion, courseData);
        syllabusSources = extractedSources.map(s => ({
          fileName: s.fileName,
          page: s.page,
          line: s.line,
          excerpt: s.excerpt,
        }));
        
        // Also parse citations from the AI response
        const parsedCitations = parseCitationsFromResponse(aiResponse, courseData);
        // Merge and deduplicate
        const allSources = [...syllabusSources, ...parsedCitations];
        const uniqueSources = allSources.filter((source, index, self) =>
          index === self.findIndex(s => 
            s.fileName === source.fileName && 
            s.page === source.page && 
            s.line === source.line
          )
        );
        syllabusSources = uniqueSources.slice(0, 5); // Limit to top 5
      } catch (error) {
        console.warn('Failed to extract sources:', error);
      }
    }

    console.log('Class Chat API result:', { 
      model: selectedModel || 'fallback', 
      answerLength: aiResponse?.length || 0,
      chatId,
      mentionedTopics,
      questionComplexity,
      sourcesCount: syllabusSources.length,
      timestamp: new Date().toISOString()
    });

    // Create notification for AI response (only if user is authenticated)
    if (userId && chatId) {
      try {
        // Check if user is currently active in this chat (not away)
        const isUserActive = request.headers.get('user-active') === 'true';
        
        // Only create notification if user is not actively in the chat
        if (!isUserActive) {
          const chatTitle = courseData 
            ? `${courseData.courseName} (${courseData.courseCode})`
            : context;
          
          await createAIResponseNotification(
            userId,
            aiResponse,
            chatId,
            chatTitle
          );
          console.log(`✅ Notification created for user ${userId} in ${chatTitle} (user was away)`);
        } else {
          console.log(`ℹ️ No notification created - user is actively in class chat ${chatId}`);
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the request if notification creation fails
      }
    }

    // Format sources for the UI
    const sources = syllabusSources.map(s => ({
      title: s.fileName,
      url: '#', // Will be handled by frontend to open file
      snippet: s.excerpt,
      page: s.page,
      line: s.line,
      fileName: s.fileName,
    }));

    return NextResponse.json({
      success: true,
      answer: aiResponse,
      provider: selectedModel || 'fallback',
      shouldRespond: true,
      timestamp: new Date().toISOString(),
      sources: sources, // Added sources
      courseContext: courseData ? {
        courseName: courseData.courseName,
        courseCode: courseData.courseCode
      } : null,
      // Metadata for intelligent tracking
      metadata: {
        topicsCovered: mentionedTopics,
        questionComplexity,
        isQuiz,
        isConfused,
        wantsStudyPlan,
        needsAssignmentHelp,
        wantsPracticeExam,
        wantsResources
      }
    });
    
  } catch (error: any) {
    console.error('Class Chat API error:', error);
    
    return NextResponse.json({
      error: 'Failed to process class chat message',
      details: error.message 
    }, { status: 500 });
  }
}
