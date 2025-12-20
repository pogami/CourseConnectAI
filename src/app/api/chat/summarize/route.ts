import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const { messages, chatTitle } = body || {};
    
    if (!messages || typeof messages !== 'string' || messages.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'No messages provided' }, { status: 400 });
    }

    const prompt = `Summarize this conversation. Focus on main topics, key questions/answers, important concepts, and action items. Use clear paragraphs with bullets.

${messages}

Summary:`;

    let result: any = null;
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
        error: 'AI service unavailable'
      }, { status: 500 });
    }

    if (!result || !result.answer) {
      return NextResponse.json({ 
        success: false,
        error: 'No summary generated'
      }, { status: 500 });
    }

    const summary = String(result.answer || '').trim();

    return NextResponse.json({ 
      success: true,
      summary: summary || 'Summary generated successfully.'
    });
  } catch (error: any) {
    console.error('Summarize route error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate summary'
    }, { status: 500 });
  }
}

