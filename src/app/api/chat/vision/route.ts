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
    
    const { message, image, mimeType, courseData } = await request.json();
    console.log('Request data:', { 
      hasMessage: !!message, 
      hasImage: !!image, 
      imageLength: image?.length || 0,
      mimeType,
      hasCourseData: !!courseData
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
        const validationResponse = await openai.chat.completions.create({
          model: "gpt-4o",
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
          max_tokens: 200,
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
    
    // Enhanced system prompt for better formatting
           const systemPrompt = `You are a helpful academic assistant analyzing images for students.

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
   - Be CONCISE and direct
   - Skip unnecessary introductions like "This image shows..."
   - Get straight to the solution/explanation
   - Use **bold** for key terms (sparingly)
   - DO NOT use asterisks for formatting
   - Use numbered lists ONLY when showing multiple steps

3. When solving math problems:
   - Show the problem first in LaTeX
   - Show solution steps (if needed)
   - Give final answer clearly
   - Keep explanations brief and focused

4. For diagrams/concepts:
   - Explain what's shown concisely
   - Highlight key points
   - Skip obvious details

5. Overall tone: Clear, concise, academic, helpful`;

    // Check if user has a specific question or just uploaded without asking
    const hasSpecificQuestion = prompt && 
      prompt.trim().length > 0 && 
      !prompt.toLowerCase().includes('i see you uploaded') &&
      !prompt.toLowerCase().includes('what do you need help with');

    // Enhanced prompt for image-only analysis
    let enhancedPrompt = prompt;
    let finalSystemPrompt = systemPrompt;
    
    if (!hasSpecificQuestion || prompt.trim() === 'Describe this image and extract relevant info.') {
      // If no specific question, briefly acknowledge what the image is about (1 sentence) and ask what they need
      finalSystemPrompt = `You are a helpful academic assistant. When a user uploads an image without a specific question, you should:
1. Briefly identify what the image shows (ONE sentence)
2. Ask what they need help with

BAD response:
"This image shows a calculus problem involving derivatives. The problem asks you to find the derivative of f(x) = x^2 + 3x. Here's how to solve it: [long solution]..."

GOOD response:
"I see you uploaded an image showing a calculus problem about derivatives. What do you need help with - solving the problem, understanding the concept, or something else?"

Format ALL math using $...$ for inline and $$...$$ for display. NEVER use \\( or \\).`;
      enhancedPrompt = 'Briefly identify what this image shows in ONE sentence, then ask what the user needs help with. Do not analyze or solve anything yet.';
    }

    const userPrompt = `${enhancedPrompt}

CRITICAL: Format ALL math using $...$ for inline and $$...$$ for display. NEVER use \\( or \\). Examples: $k = 3$, $x^2 + 4x + 1$, $$\\frac{a}{b}$$`;
    
    // Use GPT-4o with vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 1500,
    });
    
    const text = response.choices[0]?.message?.content || 'No response';
    
    console.log(`✅ SUCCESS with GPT-4o!`);
    console.log(`📄 Response length: ${text.length} characters`);
    
    return NextResponse.json({ 
      response: text, 
      model: "gpt-4o",
      provider: "OpenAI"
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

