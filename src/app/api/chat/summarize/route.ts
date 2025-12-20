import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatTitle, courseData } = await request.json();
    
    if (!messages || (typeof messages === 'string' && messages.trim().length === 0)) {
      return NextResponse.json({ success: false, error: 'No messages' }, { status: 400 });
    }

    const prompt = `Summarize this conversation. Focus on main topics, key questions/answers, important concepts, and action items. Use clear paragraphs with bullets.

${messages}

Summary:`;

    const result = await provideStudyAssistanceWithFallback({
      question: prompt,
      context: chatTitle || 'General Chat',
      conversationHistory: []
    });

    const summary = result?.answer?.trim() || 'Unable to generate summary at this time.';

    return NextResponse.json({ 
      success: true,
      summary: summary
    });
  } catch (error: any) {
    console.error('Summarize API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error?.message || 'Failed to generate summary'
    }, { status: 500 });
  }
}

