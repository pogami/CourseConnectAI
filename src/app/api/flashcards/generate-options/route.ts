import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer } = await request.json();

    if (!question || !correctAnswer) {
      return NextResponse.json(
        { error: 'Question and correctAnswer are required' },
        { status: 400 }
      );
    }

    const prompt = `You are creating multiple choice question options for a test. Generate 3 realistic, grammatically correct wrong answers (distractors) for the following question and correct answer.

Question: ${question}
Correct Answer: ${correctAnswer}

Requirements:
1. Create 3 wrong answers that are:
   - Grammatically correct and well-written
   - Plausible and could seem correct to someone who doesn't know the answer
   - Related to the topic but factually incorrect
   - Similar in length and style to the correct answer
   - NOT obviously wrong (avoid "Not X", "Alternative to X", etc.)

2. Return ONLY a JSON array with exactly 4 options total: [correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3]
3. The correct answer should be first in the array
4. Shuffle the order randomly so the correct answer is not always first

Example format:
["Correct answer here", "Plausible wrong answer 1", "Plausible wrong answer 2", "Plausible wrong answer 3"]

Return ONLY the JSON array, nothing else.`;

    const model = 'gpt-4o-mini';
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating realistic multiple choice question options for educational tests. Always return valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      // Use max_completion_tokens for newer models (o1, o3), max_tokens for older models
      ...(model.startsWith('o1') || model.startsWith('o3') 
        ? { max_completion_tokens: 500 }
        : { max_tokens: 500 }
      ),
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Try to parse the JSON array
    let options: string[] = [];
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      options = JSON.parse(cleanContent);
      
      if (!Array.isArray(options) || options.length !== 4) {
        throw new Error('Invalid format');
      }
      
      // Ensure all options are strings
      options = options.map(opt => String(opt));
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: return the correct answer plus placeholder options
      options = [
        correctAnswer,
        'Option B',
        'Option C',
        'Option D',
      ];
    }

    return NextResponse.json({
      options,
    });

  } catch (error) {
    console.error('Error generating options:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




