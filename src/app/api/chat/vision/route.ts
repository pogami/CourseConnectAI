import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🎯 OpenAI Vision API called');
  
  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('OpenAI API Key configured:', !!apiKey);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    const { message, image, mimeType, courseData, conversationHistory } = await request.json();
    console.log('Request data:', { 
      hasMessage: !!message, 
      hasImage: !!image, 
      imageLength: image?.length || 0,
      mimeType,
      hasCourseData: !!courseData,
      hasConversationHistory: !!conversationHistory,
      conversationHistoryLength: conversationHistory?.length || 0
    });
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }
    
    const prompt = message || "What's in this image? Describe it in detail.";
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📸 Sending to GPT-4o Vision...`);
    
    // If courseData exists, first validate if image is related to the course
    if (courseData && courseData.courseName) {
      const courseName = courseData.courseName;
      const courseCode = courseData.courseCode || '';
      
      const validationPrompt = `You are analyzing an image uploaded in a class chat for "${courseName}"${courseCode ? ` (${courseCode})` : ''}.

CRITICAL: You must be VERY STRICT. Analyze what's in this image and determine if it's related to ${courseName} or not.

If the image contains ANY of the following, it is NOT_RELATED:
- Programming code (Python, Java, JavaScript, C++, etc.)
- Computer science concepts, software development, or coding
- Math problems that are NOT related to ${courseName} topics
- Content from a completely different academic subject
- Random photos, memes, or unrelated images
- Screenshots of code editors, terminals, or programming tools
- Any technical content unrelated to ${courseName}

The course "${courseName}" is about: ${courseName.toLowerCase().includes('biology') ? 'biological concepts, cells, organisms, life sciences' : courseName.toLowerCase().includes('chemistry') ? 'chemical reactions, molecules, compounds' : courseName.toLowerCase().includes('physics') ? 'physical laws, forces, energy' : courseName.toLowerCase().includes('math') ? 'mathematical concepts and problems' : 'the subject matter of this course'}.

If the image IS clearly related to ${courseName} topics, respond with: "RELATED: [brief description]"
If the image is NOT related (including code, unrelated subjects, etc.), respond with: "NOT_RELATED: [brief description of what it is]"

Be VERY strict - only mark as RELATED if it's clearly and directly relevant to ${courseName}.`;

      try {
        const validationModel = "gpt-4o";
        const validationResponse = await openai.chat.completions.create({
          model: validationModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: validationPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${image}`,
                    detail: "low" // Use low detail for faster validation
                  },
                },
              ],
            },
          ],
          // Use max_completion_tokens for newer models (o1, o3), max_tokens for older models
          ...(validationModel.startsWith('o1') || validationModel.startsWith('o3') 
            ? { max_completion_tokens: 200 }
            : { max_tokens: 200 }
          ),
        });
        
        const validationText = validationResponse.choices[0]?.message?.content || '';
        console.log('🔍 Validation response:', validationText);
        
        if (validationText.startsWith('NOT_RELATED:')) {
          const detectedContent = validationText.replace('NOT_RELATED:', '').trim();
          const courseName = courseData.courseName || 'this class';
          
          return NextResponse.json({
            response: `❌ **Image Not Allowed**\n\nThis image appears to be about ${detectedContent}, which is not related to ${courseName}.\n\n**To upload this image, please go to [General Chat](/dashboard/chat?tab=private-general-chat) where you can get help with any topic.**\n\nOr upload content related to ${courseName} here.`,
            isNotRelated: true,
            detectedContent: detectedContent,
            model: "gpt-4o",
            provider: "OpenAI"
          });
        }
      } catch (validationError) {
        console.error('Validation error, proceeding with normal analysis:', validationError);
        // Continue with normal analysis if validation fails
      }
    }
    
    // Enhanced system prompt that uses conversation context
    const conversationContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nCONVERSATION CONTEXT - You are in the middle of an ongoing conversation:
${conversationHistory.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'You'}: ${msg.content}`).join('\n')}

CRITICAL INSTRUCTIONS FOR CONTEXTUAL RESPONSES:
- Continue the conversation naturally based on what you see in the image
- If the student was asking about something specific, relate the image to that topic
- If you see specific text, numbers, colors, or details in the image, mention them naturally (e.g., "I see it says 'black' on it...", "I notice you've written 'Area = 12' in red marker...")
- Don't just describe the image - continue the conversation flow
- Be conversational and contextual, not robotic or generic
- If the conversation was about a specific topic, connect the image to that topic
- Reference specific details from the image to show you're paying attention
- Don't ask "What do you need help with?" if the context makes it clear
- Build on previous messages naturally

`
      : '';

    const systemPrompt = `You are a helpful academic assistant analyzing images for students.

${conversationContext}

FORMATTING RULES:
1. For ALL mathematical expressions, equations, or formulas:
   - Use LaTeX format enclosed in $...$ for inline math
   - Use LaTeX format enclosed in $$...$$ for display/block math
   - NEVER use \\( or \\) - ONLY use $ and $$
   - Examples: 
     * Inline: The equation is $x^2 + y^2 = r^2$
     * Display: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
   - For variables: $k$, $x$, $y$, etc.
   - For equations: $f(x) = x^2 + 3x + 2$
   - For fractions: $\\frac{a}{b}$ or $$\\frac{a}{b}$$

2. Response style:
   - Continue the conversation naturally
   - If you see specific text/numbers/colors in the image, mention them (e.g., "I see it says 'black'...", "I notice 'Area = 12' written in red...")
   - Be conversational and contextual
   - Use **bold** for key terms (sparingly)
   - DO NOT use asterisks for formatting
   - Use numbered lists ONLY when showing multiple steps
   - Skip generic introductions if context exists
   - ACTUALLY SOLVE problems - don't just describe them
   - Be helpful and proactive - offer solutions, not just descriptions

3. When solving math problems:
   - ACTUALLY SOLVE the problems shown in the image
   - Show the problem first in LaTeX
   - Show solution steps clearly but concisely
   - Give final answer clearly
   - If multiple problems, solve each one
   - Don't just list what problems are there - solve them!
   - For multiple-choice questions: solve it, then clearly state which option is correct
   - Be thorough but concise - don't over-explain

4. For multiple-choice questions specifically:
   - Identify the question and options
   - Solve/analyze the problem
   - Clearly state which answer is correct (e.g., "The correct answer is A")
   - Briefly explain why (1-2 sentences)
   - Don't go through every wrong option unless asked

5. For diagrams/concepts:
   - Explain what's shown concisely
   - Highlight key points
   - Reference specific details you see (colors, labels, annotations)
   - Skip obvious details

6. Overall tone: Conversational, contextual, helpful, natural, concise`;

    // Check if user has a specific question or just uploaded without asking
    const hasSpecificQuestion = prompt && 
      prompt.trim().length > 0 && 
      !prompt.toLowerCase().includes('i see you uploaded') &&
      !prompt.toLowerCase().includes('what do you need help with');

    // Enhanced prompt for image-only analysis
    let enhancedPrompt = prompt;
    let finalSystemPrompt = systemPrompt;
    
    // If there's conversation history, always use contextual mode
    // If no history and no specific question, use acknowledgment mode
    if (!hasSpecificQuestion && (!conversationHistory || conversationHistory.length === 0)) {
      // If no specific question and no conversation history, briefly acknowledge and ask
      finalSystemPrompt = `You are a helpful academic assistant. When a user uploads an image without a specific question or prior context, you should:
1. Briefly identify what the image shows (ONE sentence), mentioning specific details you see
2. Ask what they need help with

BAD response:
"This image shows a calculus problem involving derivatives. The problem asks you to find the derivative of f(x) = x^2 + 3x. Here's how to solve it: [long solution]..."

GOOD response:
"I see you uploaded an image showing a calculus problem about derivatives. I can see the equation $f(x) = x^2 + 3x$ written in black ink. What do you need help with - solving the problem, understanding the concept, or something else?"

Format ALL math using $...$ for inline and $$...$$ for display. NEVER use \\( or \\).`;
      enhancedPrompt = 'Briefly identify what this image shows in ONE sentence, mentioning specific details you see (colors, text, numbers, etc.), then ask what the user needs help with. Do not analyze or solve anything yet.';
    } else if (!hasSpecificQuestion && conversationHistory && conversationHistory.length > 0) {
      // If there's conversation history but no specific question, continue the conversation naturally
      enhancedPrompt = 'Continue the conversation naturally based on what you see in this image. Reference specific details from the image (text, numbers, colors, annotations) and connect it to our previous discussion. If the image contains problems or questions, ACTUALLY SOLVE THEM - don\'t just describe them. Be helpful, proactive, and conversational.';
    } else if (hasSpecificQuestion) {
      // If there's a specific question, make sure to actually solve problems if they're shown
      enhancedPrompt = `${enhancedPrompt}\n\nIMPORTANT: If the image contains problems, questions, or exercises, ACTUALLY SOLVE THEM. Don't just describe what problems are there - solve each one step by step. Be thorough and helpful.`;
    }

    const userPrompt = `${enhancedPrompt}

CRITICAL: Format ALL math using $...$ for inline and $$...$$ for display. NEVER use \\( or \\). Examples: $k = 3$, $x^2 + 4x + 1$, $$\\frac{a}{b}$$`;
    
    // Use GPT-4o with vision - enable streaming
    const visionModel = "gpt-4o";
    const response = await openai.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "system",
          content: finalSystemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${image}`,
                detail: "high"
              },
            },
          ],
        },
      ],
      stream: true, // Enable streaming
      // Use max_completion_tokens for newer models (o1, o3), max_tokens for older models
      ...(visionModel.startsWith('o1') || visionModel.startsWith('o3') 
        ? { max_completion_tokens: 2000 }
        : { max_tokens: 2000 }
      ),
    });
    
    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAnswer = '';
        
        try {
          // Send initial chunk to establish connection
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'status',
            message: 'Analyzing image...'
          }) + '\n'));
          
          // Process streaming response
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullAnswer += content;
              
              // Split into words for word-by-word streaming
              const words = content.split(/(\s+)/).filter((w: string) => w.length > 0);
              
              // Send each word individually
              for (const word of words) {
                if (word) {
                  try {
                    const chunkData = encoder.encode(JSON.stringify({
                      type: 'content',
                      content: word
                    }) + '\n');
                    
                    controller.enqueue(chunkData);
                    await new Promise(resolve => setTimeout(resolve, 0));
                  } catch (enqueueError) {
                    console.warn('Stream controller closed:', enqueueError);
                    break;
                  }
                }
              }
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done',
            fullResponse: fullAnswer.trim()
          }) + '\n'));
          
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to stream response'
          }) + '\n'));
          controller.close();
        }
      }
    });
    
    console.log(`✅ Streaming response with GPT-4o!`);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
    
  } catch (error: any) {
    console.error('🚨 OpenAI Vision API error:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze image',
        details: 'Make sure your OPENAI_API_KEY is valid and has access to GPT-4o',
        provider: 'OpenAI'
      },
      { status: 500 }
    );
  }
}

