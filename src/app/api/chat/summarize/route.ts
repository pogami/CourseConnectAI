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
    
    if (!messages || messages.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No messages provided for summarization' 
      }, { status: 400 });
    }

    console.log('📝 Summarize API called:', { 
      chatId, 
      chatTitle, 
      messageLength: messages.length,
      chatType 
    });

    // Create a summary prompt
    const summaryPrompt = `Please provide a concise, well-structured summary of the following conversation. 

Focus on:
1. Main topics discussed
2. Key questions asked and answers provided
3. Important concepts or information shared
4. Any action items or follow-ups mentioned

Format the summary in clear paragraphs with bullet points for key takeaways.

Conversation:
${messages}

${courseData ? `\nContext: This conversation is about ${chatTitle || 'a course'}.` : ''}

Please provide a comprehensive but concise summary:`;

    // Use the AI service to generate the summary
    const aiResponse = await provideStudyAssistanceWithFallback({
      question: summaryPrompt,
      context: chatTitle || 'General Chat',
      conversationHistory: []
    });

    if (!aiResponse || !aiResponse.answer) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to generate summary' 
      }, { status: 500 });
    }

    const summary = aiResponse.answer.trim();

    console.log('✅ Summary generated successfully, length:', summary.length);

    return NextResponse.json({ 
      success: true,
      summary: summary
    });
  } catch (error: any) {
    console.error('🚨 Summarize API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate summary' 
      },
      { status: 500 }
    );
  }
}

