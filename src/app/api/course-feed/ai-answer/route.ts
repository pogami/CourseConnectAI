/* COURSE FEED AI ANSWER API - COMMENTED OUT
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client-simple";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  runTransaction
} from "firebase/firestore";

export const runtime = 'nodejs';
export const maxDuration = 90;

/**
 * Question classifier - categorizes questions into types
 */
function classifyQuestion(question: string): 'conceptual' | 'exam_prep' | 'missed_class' | 'homework_specific' {
  const lowerQuestion = question.toLowerCase();
  
  const homeworkKeywords = ['homework', 'hw', 'assignment', 'problem', 'solve this', 'find the answer', 'calculate', 'compute', 'question #', 'problem #', 'exercise', 'due', 'submit', 'problem set', 'pset'];
  const examKeywords = ['exam', 'test', 'midterm', 'final', 'quiz', 'study for', 'prepare for', 'what will be on', 'exam topics', 'test topics', 'exam prep'];
  const missedClassKeywords = ['missed class', 'wasn\'t in class', 'absent', 'what did we cover', 'what happened in class', 'notes from', 'lecture notes', 'missed lecture'];
  
  if (homeworkKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    if (!examKeywords.some(keyword => lowerQuestion.includes(keyword)) &&
        !lowerQuestion.includes('concept') && !lowerQuestion.includes('explain') &&
        !lowerQuestion.includes('how does') && !lowerQuestion.includes('what is')) {
      return 'homework_specific';
    }
  }
  
  if (examKeywords.some(keyword => lowerQuestion.includes(keyword))) return 'exam_prep';
  if (missedClassKeywords.some(keyword => lowerQuestion.includes(keyword))) return 'missed_class';
  
  return 'conceptual';
}

/**
 * Generate AI answer using GPT-4o mini as a Trusted Utility Layer
 */
async function generateAIAnswerForFeed(question: string, courseData: any): Promise<{ text: string; questionType: string; sourceQuote?: string; confidence: 'high' | 'low'; lastUpdated: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'demo-key') {
    throw new Error('OpenAI API key not configured');
  }

  const questionType = classifyQuestion(question);

  const inferCurrentTopic = (courseData: any): string => {
    if (!courseData) return '';
    const today = new Date();
    const { topics, assignments } = courseData;
    if (topics && Array.isArray(topics) && topics.length > 0) {
      const topicIndex = Math.min(Math.floor(topics.length / 2), topics.length - 1);
      return topics[topicIndex] || '';
    }
    if (assignments && assignments.length > 0) {
      const upcoming = assignments
        .filter((a: any) => a.dueDate && new Date(a.dueDate) >= today)
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      if (upcoming.length > 0) return upcoming[0].name || '';
    }
    return '';
  };

  let courseContext = '';
  let currentTopicHint = '';
  if (courseData) {
    const { courseName, courseCode, professor, topics, assignments, exams } = courseData;
    if (questionType === 'missed_class') currentTopicHint = inferCurrentTopic(courseData);
    
    courseContext = `You are a trusted utility layer for ${courseName}${courseCode ? ` (${courseCode})` : ''}.
COURSE DATA:
${professor ? `Professor: ${professor}` : ''}
${topics ? `Topics: ${topics.join(', ')}` : ''}
${assignments ? `Assignments: ${assignments.map((a: any) => `${a.name} (Due: ${a.dueDate})`).join(', ')}` : ''}
${exams ? `Exams: ${exams.map((e: any) => `${e.name} (Date: ${e.date})`).join(', ')}` : ''}`;
  }

  const syllabusSection = courseData?.syllabusText ? `\n\n📚 SYLLABUS TEXT:\n${courseData.syllabusText.substring(0, 150000)}` : '';

  const systemPrompt = `You are CourseConnect AI, a trusted utility layer. Your role is strictly to provide facts from the syllabus.

🚨 HYBRID GOVERNANCE:
1. ONLY answer based on facts found in the syllabus/course data provided. Humans lead discussion; you are for utility.
2. If the answer is not in the syllabus, set confidence to "low" and explain that the information is missing.
3. You MUST provide a "sourceQuote" - an exact snippets from the syllabus supporting your answer.
4. Keep answers brief (under 100 words).
5. Tone: Factual classmate. No robotic preamble.

🚨 OUTPUT FORMAT (JSON):
Return a valid JSON object:
{
  "answer": "Concise factual answer",
  "sourceQuote": "Exact quote from the syllabus/data",
  "confidence": "high" | "low"
}

1. QUESTION TYPE: ${questionType.toUpperCase()}
${questionType === 'missed_class' && currentTopicHint ? `HINT: Likely covering ${currentTopicHint}` : ''}`;

  const userMessage = `${courseContext}${syllabusSection}\n\nStudent Question: ${question}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      })
    });

    if (!response.ok) throw new Error(`OpenAI API failed: ${response.status}`);

    const data = await response.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    return {
      text: content.answer || "I couldn't find a factual answer in your syllabus.",
      questionType: questionType,
      sourceQuote: content.sourceQuote,
      confidence: content.confidence || 'low',
      lastUpdated: Date.now()
    };
  } catch (error: any) {
    console.error('❌ OpenAI API error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, questionId, userId } = body;

    if (!courseId || !questionId || !userId) {
      return NextResponse.json({ error: "courseId, questionId, and userId are required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const courseFeedRef = collection(db, "courseFeeds");
    const q = query(courseFeedRef, where("courseId", "==", courseId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Course feed not found" }, { status: 404 });
    }

    const feedDoc = querySnapshot.docs[0];
    const feedData = feedDoc.data();
    const questions = feedData.questions || [];
    const question = questions.find((q: any) => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Rate limiting: check if answer was generated very recently (e.g. within 10 seconds)
    if (question.aiAnswer && (Date.now() - (question.aiAnswer.generatedAt || 0) < 10000)) {
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        message: "Please wait a moment before re-generating an answer." 
      }, { status: 429 });
    }

    let courseData = null;
    try {
      const chatDocRef = doc(db, "chats", courseId);
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        courseData = chatDocSnap.data().courseData;
      } else {
        const chatsRef = collection(db, "chats");
        const chatsQuery = query(chatsRef, where("courseData.courseCode", "==", courseId.split('-')[0]?.trim()));
        const chatsSnapshot = await getDocs(chatsQuery);
        if (!chatsSnapshot.empty) {
          courseData = chatsSnapshot.docs[0].data().courseData;
        }
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }

    const aiResponse = await generateAIAnswerForFeed(question.text, courseData);

    await runTransaction(db, async (transaction) => {
      const freshFeedSnap = await transaction.get(feedDoc.ref);
      if (!freshFeedSnap.exists()) throw new Error("Feed document vanished");
      
      const freshQuestions = freshFeedSnap.data().questions || [];
      const updatedQuestions = freshQuestions.map((q: any) => 
        q.id === questionId 
          ? { 
              ...q, 
              aiAnswer: { 
                text: aiResponse.text, 
                generatedAt: aiResponse.lastUpdated, 
                sourceQuote: aiResponse.sourceQuote,
                confidence: aiResponse.confidence,
                questionType: aiResponse.questionType
              } 
            }
          : q
      );

      transaction.update(feedDoc.ref, {
        questions: updatedQuestions,
        updatedAt: Date.now(),
      });
    });

    return NextResponse.json({ 
      answer: { 
        text: aiResponse.text, 
        generatedAt: aiResponse.lastUpdated, 
        sourceQuote: aiResponse.sourceQuote,
        confidence: aiResponse.confidence,
        questionType: aiResponse.questionType
      } 
    });
  } catch (error: any) {
    console.error("Error generating AI answer:", error);
    return NextResponse.json({ error: "Failed to generate AI answer", details: error.message }, { status: 500 });
  }
}
/* END OF COURSE FEED AI ANSWER API - COMMENTED OUT */
