import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request body' 
      }, { status: 400 });
    }

    const { 
      chatId,
      chatTitle,
      messages,
      courseData,
      chatType
    } = body || {};
    
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

    let aiResponse;
    try {
      aiResponse = await provideStudyAssistanceWithFallback({
        question: summaryPrompt,
        context: chatTitle || 'General Chat',
        conversationHistory: []
      });
    } catch (aiError: any) {
      console.error('AI service error:', aiError);
      return NextResponse.json({ 
        success: false,
        error: 'AI service unavailable. Please try again later.'
      }, { status: 500 });
    }

    if (!aiResponse || !aiResponse.answer) {
      return NextResponse.json({ 
        success: false,
        error: 'AI service returned empty response'
      }, { status: 500 });
    }

    const summary = aiResponse.answer.trim();

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

