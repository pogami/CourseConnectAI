import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/ai/flows/generate-flashcards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { className, chatHistory, syllabusData, topic, context } = body;

    // Validate input
    if (!className && !topic && !context) {
      return NextResponse.json(
        { error: 'At least one of className, topic, or context is required' },
        { status: 400 }
      );
    }

    console.log('Generating flashcards with:', { className, topic, hasChatHistory: !!chatHistory, hasSyllabusData: !!syllabusData, hasContext: !!context });

    // Call the AI flow
    const result = await generateFlashcards({
      className,
      chatHistory,
      syllabusData,
      topic,
      context
    });

    return NextResponse.json({
      success: true,
      flashcards: result.flashcards
    });

  } catch (error) {
    console.error('Flashcard generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
