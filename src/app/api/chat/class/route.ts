import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import { extractUserNameFromMessages, extractUserNameFromMessage } from '@/lib/extract-user-name';
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
      userId,
      userName
    } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Clean @ mentions from the question if present
    const cleanedQuestion = question.replace(/@ai\s*/gi, '').trim();
    const lowerQuestion = cleanedQuestion.toLowerCase();
    
    // Extract user name from conversation history or current message as fallback
    let extractedName: string | null = null;
    try {
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        const messages = conversationHistory.map((msg: any) => ({
          sender: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content || ''
        }));
        extractedName = extractUserNameFromMessages(messages);
      }
      if (!extractedName) {
        extractedName = extractUserNameFromMessage(cleanedQuestion);
      }
    } catch (error) {
      console.warn('Error extracting user name:', error);
    }
    
    // Use extracted name if found, otherwise use provided userName
    const finalUserName = extractedName || userName;

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
    
    // Detect "missed class" questions
    const missedClassPattern = /missed.*class|wasn't.*there|absent|skipped.*class|didn't.*attend|what.*did.*i.*miss/i;
    const wantsMissedClassInfo = missedClassPattern.test(lowerQuestion);
    
    // Extract day/date from question
    const dayMatch = lowerQuestion.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
    const dateMatch = lowerQuestion.match(/(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})/i);

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
        wantsResources,
        wantsMissedClassInfo
      },
      courseData: courseData ? {
        courseName: courseData.courseName,
        courseCode: courseData.courseCode,
        topicsCount: courseData.topics?.length || 0,
        assignmentsCount: courseData.assignments?.length || 0,
        examsCount: courseData.exams?.length || 0,
        hasSyllabusText: !!courseData.syllabusText,
        syllabusTextLength: courseData.syllabusText?.length || 0
      } : null,
      chatId,
      timestamp: new Date().toISOString()
    });

    // Get current date for context awareness (needed for prompt generation)
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dateFormatted = currentDate; // For use in prompt generation

    // Build course-specific context with intelligent features
    let courseContext = '';
    let specialInstructions = '';
    
    if (courseData) {
      const { courseName, courseCode, professor, university, semester, year, classTime, location, topics, assignments, exams, syllabusText, pdfUrl } = courseData;
      
      // Log syllabus text availability for debugging
      console.log('Syllabus text available:', {
        hasSyllabusText: !!syllabusText,
        syllabusTextLength: syllabusText?.length || 0,
        syllabusTextPreview: syllabusText ? syllabusText.substring(0, 200) : 'N/A'
      });
      
      // Add "What did I miss?" special instructions
      if (wantsMissedClassInfo) {
        // Find matching schedule item if day is mentioned
        const schedule = (courseData as any)?.schedule || [];
        let matchingSchedule = null;
        let inferredTopic = null;
        
        if (dayMatch) {
          const missedDay = dayMatch[1]?.toLowerCase();
          matchingSchedule = schedule.find((item: any) => {
            const itemDay = item.day?.toLowerCase() || '';
            return itemDay.includes(missedDay) || 
                   itemDay.includes(missedDay?.substring(0, 3)) ||
                   (missedDay === 'tue' && itemDay.includes('tuesday')) ||
                   (missedDay === 'thu' && itemDay.includes('thursday')) ||
                   (missedDay === 'wed' && itemDay.includes('wednesday'));
          });
          
          if (matchingSchedule) {
            inferredTopic = matchingSchedule.description || matchingSchedule.type;
          }
        }
        
        // Get next class info
        const nextClassSchedule = schedule.find((item: any, index: number) => {
          if (matchingSchedule) {
            const currentIndex = schedule.indexOf(matchingSchedule);
            return index > currentIndex && item.type === 'lecture';
          }
          return item.type === 'lecture';
        });
        
        specialInstructions = `
CRITICAL: The student missed class. Provide a comprehensive catch-up guide with the following structure:

1. **📚 What You Missed: [Topic Name]**
   - Use the schedule description or inferred topic: ${inferredTopic || 'based on syllabus schedule'}
   - If a specific day was mentioned (${dayMatch?.[1] || 'not specified'}), reference that class session

2. **📋 Summary:**
   - What was covered in that class session (based on schedule description and syllabus)
   - Key concepts, definitions, or topics discussed
   - Important announcements or assignments given

3. **📖 What to Review:**
   - Specific topics, readings, or concepts they need to catch up on
   - Chapter/section numbers if available from syllabus
   - Practice problems or exercises mentioned
   - Any required readings or materials

4. **💪 Practice Suggestions:**
   - Exercises, problems, or activities to reinforce the missed material
   - Specific practice problems from textbook if mentioned in syllabus
   - Online resources or supplementary materials
   - Step-by-step examples to work through

5. **🔮 What's Coming Next:**
   ${nextClassSchedule ? `- Next class: ${nextClassSchedule.day} - ${nextClassSchedule.description || nextClassSchedule.type}` : '- Check the syllabus schedule for upcoming topics'}
   - What will be covered in the next class(es) so they're prepared
   - Any prerequisites they need to understand before the next class
   - Upcoming assignments or exams related to the missed material

Be specific, actionable, and encouraging. Reference the syllabus schedule, topics array, and assignments when available. If the student mentioned a specific day, make sure to address that day's content specifically.
`;
      }

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

      const wantsLocation = lowerQuestion.includes('where is class') ||
        lowerQuestion.includes('class location') ||
        lowerQuestion.includes('where does class meet') ||
        lowerQuestion.includes('what room') ||
        lowerQuestion.includes('which building');

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
        const locationInfo = location ? ` at ${location}` : '';
        return respondWith(`${courseName || courseCode || 'This class'} meets ${classTime}${locationInfo}.`);
      }

      if (wantsLocation && location) {
        return respondWith(`${courseName || courseCode || 'This class'} meets ${location}.`);
      }

      if (wantsUniversity && university) {
        return respondWith(`${courseName || courseCode || 'This course'} is part of ${university}.`);
      }

      if (wantsCourseName && (courseName || courseCode)) {
        const details = [
          courseName ? `Course: ${courseName}` : null,
          courseCode ? `Course Code: ${courseCode}` : null,
          professor ? `Professor: ${professor}` : null,
          classTime ? `Class Time: ${classTime}` : null,
          location ? `Location: ${location}` : null
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

      // Categorize exams as upcoming or past
      const upcomingExams = exams?.filter((exam: any) => calculateDaysUntil(exam.date || '') >= 0) || [];
      const pastExams = exams?.filter((exam: any) => calculateDaysUntil(exam.date || '') < 0) || [];

      courseContext = `\n\nCOURSE CONTEXT - You are the AI assistant for ${courseName}${courseCode ? ` (${courseCode})` : ''}:

📅 TODAY'S DATE: ${currentDate}

${professor ? `👨‍🏫 PROFESSOR: ${professor} (IMPORTANT: Use this name when answering questions about the course or professor)` : '⚠️ No professor name found in syllabus'}
${classTime ? `🕐 CLASS TIME: ${classTime} (IMPORTANT: Use this when answering questions about when class meets)` : '⚠️ No class time found in syllabus'}
${location ? `📍 LOCATION: ${location} (IMPORTANT: Use this when answering questions about where class meets)` : '⚠️ No location found in syllabus'}
${(courseData as any)?.schedule && (courseData as any).schedule.length > 0 ? `\n📅 CLASS SCHEDULE:
${(courseData as any).schedule.map((item: any) => `- ${item.day || 'N/A'}: ${item.time || 'N/A'} (${item.type || 'N/A'})${item.description ? ` - ${item.description}` : ''}${item.location ? ` - Location: ${item.location}` : ''}`).join('\n')}` : ''}
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

🚨🚨🚨 FULL SYLLABUS TEXT - COMPLETE ACCESS 🚨🚨🚨
${syllabusText && syllabusText.trim().length > 0 
  ? `You have COMPLETE ACCESS to the FULL syllabus text below. This contains ALL course information: policies, deadlines, office hours, grading, attendance, calculator rules, withdrawal dates, academic integrity, etc.

FULL SYLLABUS TEXT:
${syllabusText.length > 200000 ? syllabusText.substring(0, 200000) : syllabusText}

[END OF FULL SYLLABUS TEXT]

CRITICAL: When answering questions about ANYTHING in the syllabus (policies, deadlines, office hours, grading, attendance, etc.), use the EXACT information from the FULL SYLLABUS TEXT above. NEVER say "I don't have access" or "check your syllabus" - you HAVE the full syllabus text right here.`
  : pdfUrl 
    ? `⚠️ Syllabus PDF available at: ${pdfUrl} (text extraction may be incomplete)`
    : 'No full syllabus text available - using extracted course data only.'}

You can help with:
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
- NEVER say you don't have access to professor name, class time, location, or other course details if they're listed in the course context above
- Reference specific course details: professor name, class time, location, course code, topics, assignments, exam dates
- If the student asks "who is my professor" and the professor name is in the context above, tell them directly (e.g., "Your professor is ${professor}")
- If the student asks "what time is class" or "when does class meet" and classTime is in the context above, tell them directly (e.g., "Class meets ${classTime}")
- If the student asks "where is class" or "what room" and location is in the context above, tell them directly (e.g., "Class meets at ${location}")
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

    // Detect frustration and emotional state
    const { detectFrustration, generateEmpatheticPrefix } = await import('@/lib/emotional-intelligence');
    const frustration = detectFrustration(cleanedQuestion, conversationHistory);
    const empatheticPrefix = generateEmpatheticPrefix(frustration);

    // Create course-aware prompt with emotional intelligence
    // Put syllabus text FIRST and MOST PROMINENT - before everything else
    const syllabusSection = courseData?.syllabusText && courseData.syllabusText.trim().length > 0
      ? `🚨🚨🚨🚨🚨 THE COMPLETE SYLLABUS TEXT IS BELOW - YOU MUST USE IT 🚨🚨🚨🚨🚨

THE ENTIRE SYLLABUS FOR THIS COURSE:
${courseData.syllabusText.length > 200000 ? courseData.syllabusText.substring(0, 200000) : courseData.syllabusText}

[END OF SYLLABUS TEXT]

🚨🚨🚨 CRITICAL RULES - READ THESE CAREFULLY 🚨🚨🚨
1. When asked about ANYTHING (syllabus, office hours, policies, deadlines, grading, attendance, professor name, class time, TOPICS, etc.), you MUST search the syllabus text above
2. If the information is in the syllabus text above, extract it and answer DIRECTLY (e.g., "Office hours are Monday 2-4pm" or "Your professor is Dr. Smith")
3. When asked about course topics, list ALL topics from the syllabus text above - extract and list EVERYTHING, don't say "and more" or "as outlined in the syllabus"
4. NEVER say "check your syllabus", "you can find it in the syllabus", "reach out to your professor", "typically set by", "can typically be found", "distributed by your professor", "and more as outlined in the course syllabus", or any variation
5. NEVER give generic answers - if it's in the syllabus text above, extract and state it directly
6. NEVER say "and more" when listing topics - you HAVE the full syllabus, so list everything that's in it
7. If asked "where is the syllabus" or "what is the syllabus", explain that you have the full syllabus text above and can answer questions about it
8. If the information is NOT in the syllabus text above, say: "I don't have that information in your syllabus"
9. The syllabus text above is REAL and COMPLETE - use it directly in ALL your answers, not generic descriptions

`
      : '';

    // Build frustration guidance
    const frustrationGuidance = frustration.isFrustrated 
      ? `🚨 EMOTIONAL INTELLIGENCE - FRUSTRATION DETECTED:
The student is showing signs of frustration (${frustration.level} level). Reasons: ${frustration.reasons.join(', ')}.
${frustration.suggestedApproach === 'analogy' ? 'IMPORTANT: Use a real-world analogy or sports example instead of formulas/math. Step away from technical language and make it relatable.' : ''}
${frustration.suggestedApproach === 'step-by-step' ? 'IMPORTANT: Break this down into very small, clear steps. Go slowly and check understanding at each step.' : ''}
${frustration.suggestedApproach === 'example' ? 'IMPORTANT: Use concrete examples to illustrate the concept. Show, do not just tell.' : ''}
${frustration.suggestedApproach === 'break' ? 'IMPORTANT: Break this into the smallest possible pieces. Tackle one tiny piece at a time.' : ''}
Start your response with empathy and understanding. Acknowledge their frustration, then pivot to a different approach. Be patient and encouraging.`
      : '';

    // Build additional context for class-specific rules
    const additionalContext = `CRITICAL - DATE AWARENESS:
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
"The course meets on Mondays and Wednesdays [Source: ${courseData?.fileName || 'Syllabus'}, Page 1, Line 15] and the final exam is on December 15th [Source: ${courseData?.fileName || 'Syllabus'}, Page 3, Line 42]."`;

    // Get full syllabus text for context
    const fullSyllabusText = courseData?.syllabusText && courseData.syllabusText.trim().length > 0
      ? (courseData.syllabusText.length > 200000 ? courseData.syllabusText.substring(0, 200000) : courseData.syllabusText)
      : undefined;

    // Build enriched context with course information (similar to general chat)
    // Include course context and syllabus text so the AI can reference it naturally
    let enrichedContext = courseContext || 'Class Chat';
    if (fullSyllabusText) {
      enrichedContext = `${courseContext}\n\nFULL SYLLABUS TEXT:\n${fullSyllabusText.substring(0, 100000)}`; // Limit syllabus text length
    }

    // Use the same dual AI service as general chat for consistent conversational style
    let aiResponse: string;
    let selectedModel: string;
    
    try {
      console.log('Using dual AI service for class chat (same as general chat)');
      
      // Use provideStudyAssistanceWithFallback for natural, conversational responses
      const aiResult = await provideStudyAssistanceWithFallback({
        question: cleanedQuestion,
        context: enrichedContext,
        conversationHistory: conversationHistory || [],
        isSearchRequest: false,
                    userName: finalUserName || undefined,
        userId: userId || undefined
      });

      if (!aiResult || !aiResult.answer) {
        throw new Error('AI service returned invalid response');
      }

      aiResponse = aiResult.answer;
      selectedModel = aiResult.provider || 'unknown';
      
      console.log(`Class chat AI response from ${selectedModel}: ${aiResponse.substring(0, 100)}...`);
      
    } catch (error) {
      console.log('AI service failed for class chat:', error);
      // Just throw the error - let the natural AI handle it or show error
      throw error;
    }

    // Prepend empathetic prefix if frustration detected
    if (frustration.isFrustrated && empatheticPrefix) {
      aiResponse = empatheticPrefix + aiResponse;
    }

    // Note: Frustration guidance is already included in the prompt, so no need to prepend
    // The AI will naturally incorporate empathetic responses based on the prompt instructions

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
