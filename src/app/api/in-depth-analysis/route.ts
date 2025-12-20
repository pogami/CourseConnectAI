import { NextRequest, NextResponse } from 'next/server';
import { OllamaModelManager } from '@/lib/ollama-model-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('In-depth analysis API called');
    const { question, conversationHistory } = await request.json();
    console.log('Question:', question);

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build conversation history for context
    const conversationContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n')}`
      : '';

    // Prompt for detailed analysis
    const prompt = `You are CourseConnect AI providing detailed step-by-step analysis. Be thorough, clear, and helpful.

CRITICAL FORMATTING RULES:
1. NEVER use markdown formatting like **bold** or *italic* or # headers
2. NEVER use asterisks (*) or hash symbols (#) for formatting
3. Write in plain text only - no special formatting characters
4. Use KaTeX delimiters $...$ and $$...$$ for math expressions only
5. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
6. Write words OUTSIDE math delimiters, symbols INSIDE math delimiters
7. NEVER use \\text{} commands - keep ALL words OUTSIDE math delimiters
8. Only put mathematical symbols, numbers, and equations INSIDE $...$ delimiters

DETAILED ANALYSIS RULES:
1. Provide COMPLETE step-by-step solutions with detailed explanations
2. Show every calculation and reasoning step
3. Explain the concepts and methods used
4. Use LaTeX for all math notation:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
5. CRITICAL: Write ALL words OUTSIDE of math delimiters
6. CRITICAL: Use proper spacing between words - never concatenate words together
7. CRITICAL: Each step should be clearly separated and readable
8. CRITICAL: Never use \\text{} commands - keep all text outside math delimiters

Example format:
"DETAILED SOLUTION:

Step 1: Identify the problem type
This is a basic arithmetic addition problem.

Step 2: Write the expression
$1 + 2 = ?$

Step 3: Perform the addition
Add the first number (1) to the second number (2):
$1+ 2 = 3$

Step 4: Verify the answer
$1 + 2 = 3$ ✓

Answer: $\\boxed{3}$"

Question: ${question}${conversationContext}`;

    // Use Ollama for analysis
    const selectedModel = OllamaModelManager.getBestGeneralModel();
    if (!selectedModel) {
      return NextResponse.json({ 
        analysis: "I apologize, but detailed analysis is not available right now.",
        provider: 'fallback'
      });
    }

    console.log(`Using Ollama model for analysis: ${selectedModel}`);

    // Add timeout to prevent slow responses
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Ollama timeout')), 20000); // 20 second timeout for in-depth analysis
    });

    const ollamaPromise = fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_tokens: 1500, // Longer responses for detailed analysis
          num_ctx: 4096,
          top_p: 0.9,
          top_k: 20,
          num_batch: 1,
          num_thread: 4
        }
      })
    });

    const ollamaResponse = await Promise.race([ollamaPromise, timeoutPromise]) as Response;

    if (ollamaResponse.ok) {
      const ollamaResult = await ollamaResponse.json();
      const analysis = ollamaResult.response || 'I apologize, but I couldn\'t generate a detailed analysis.';
      
      return NextResponse.json({ 
        analysis: analysis.trim(),
        provider: selectedModel
      });
    } else {
      throw new Error('Ollama analysis failed');
    }

  } catch (error) {
    console.error('In-depth analysis error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      analysis: "I apologize, but I'm having trouble generating detailed analysis right now. Please try again or ask a simpler version of your question.",
      provider: 'fallback'
    });
  }
}