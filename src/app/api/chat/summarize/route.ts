import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages, chatTitle, courseData } = body;
    
    if (!messages || (typeof messages === 'string' && messages.trim().length === 0)) {
      return NextResponse.json({ success: false, error: 'No messages' }, { status: 400 });
    }

    const prompt = `Summarize this conversation. Focus on main topics, key questions/answers, important concepts, and action items. Use clear paragraphs with bullets.

${messages}

Summary:`;

    let result;
    try {
      result = await provideStudyAssistanceWithFallback({
        question: prompt,
        context: chatTitle || 'General Chat',
        conversationHistory: []
      });
    } catch (aiError: any) {
      console.error('AI service error:', aiError);
      return NextResponse.json({ 
        success: false,
        error: 'AI service error. Please try again.'
      }, { status: 500 });
    }

    const summary = result?.answer?.trim() || 'Summary generated successfully.';

    return NextResponse.json({ 
      success: true,
      summary: summary
    });
  } catch (error: any) {
    console.error('Summarize API error:', error);
    return NextResponse.json({ 
      success: false,
      error: String(error?.message || 'Failed to generate summary')
    }, { status: 500 });
  }
}

