import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { 
      chatId,
      chatTitle,
      messages,
      courseData,
      chatType
    } = await request.json();
    
    if (!messages || (typeof messages === 'string' && messages.trim().length === 0)) {
      return NextResponse.json({ 
        success: false,
        error: 'No messages provided' 
      }, { status: 400 });
    }

    const summaryPrompt = `Summarize this conversation concisely. Focus on main topics, key questions and answers, important concepts, and any action items. Use clear paragraphs with bullet points.

Conversation:
${messages}

${courseData ? `Context: ${chatTitle || 'a course'}` : ''}

Summary:`;

    const aiResponse = await provideStudyAssistanceWithFallback({
      question: summaryPrompt,
      context: chatTitle || 'General Chat',
      conversationHistory: []
    });

    const summary = aiResponse?.answer?.trim() || 'Unable to generate summary.';

    return NextResponse.json({ 
      success: true,
      summary: summary
    });
  } catch (error: any) {
    console.error('Summarize error:', error);
    return NextResponse.json({ 
      success: false,
      error: error?.message || 'Failed to generate summary'
    }, { status: 500 });
  }
}

