import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Handle both FormData (from chat) and JSON (from smart-document-analysis service)
    const contentType = request.headers.get('content-type') || '';
    
    let extractedText: string;
    let fileName: string;
    let fileType: string;
    let userPrompt: string | undefined;
    let courseData: any = null;
    let conversationHistory: any[] = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData from chat upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const prompt = formData.get('prompt') as string | null;
      const courseDataStr = formData.get('courseData') as string | null;
      const conversationHistoryStr = formData.get('conversationHistory') as string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      fileName = file.name || 'document';
      fileType = file.type || '';
      userPrompt = prompt || undefined;
      
      if (courseDataStr) {
        try {
          courseData = JSON.parse(courseDataStr);
        } catch (e) {
          console.warn('Failed to parse courseData:', e);
        }
      }
      
      if (conversationHistoryStr) {
        try {
          conversationHistory = JSON.parse(conversationHistoryStr);
        } catch (e) {
          console.warn('Failed to parse conversationHistory:', e);
        }
      }

      // Extract text from file
      if (fileType.startsWith('image/')) {
        // For images, we'd need OCR - but this should be handled by the client
        // For now, return an error suggesting to use the vision API
        return NextResponse.json(
          { error: 'Image analysis should use /api/chat/vision endpoint' },
          { status: 400 }
        );
      } else if (fileType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
        // Use pdf-parse for server-side PDF extraction
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const data = await pdfParse(buffer);
          extractedText = data.text || '';
          
          if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json(
              { error: 'No text content found in the PDF. This might be a scanned PDF (image-based).' },
              { status: 400 }
            );
          }
        } catch (error: any) {
          console.error('PDF parsing error:', error);
          return NextResponse.json(
            { error: `Failed to parse PDF: ${error.message || 'Unknown error'}` },
            { status: 400 }
          );
        }
      } else if (fileType.includes('word') || fileType.includes('document') || (fileName && fileName.toLowerCase().endsWith('.docx'))) {
        // Use mammoth for Word documents
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value.trim();
          
          if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json(
              { error: 'No text content found in the Word document.' },
              { status: 400 }
            );
          }
        } catch (error: any) {
          console.error('Word document parsing error:', error);
          return NextResponse.json(
            { error: `Failed to parse Word document: ${error.message || 'Unknown error'}` },
            { status: 400 }
          );
        }
      } else if (fileType === 'text/plain') {
        extractedText = await file.text();
      } else {
        return NextResponse.json(
          { error: `Unsupported file type: ${fileType}` },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON from smart-document-analysis service
      const body = await request.json();
      extractedText = body.extractedText || '';
      fileName = body.fileName || 'document';
      fileType = body.fileType || 'unknown';
      userPrompt = body.userPrompt;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content extracted from document' },
        { status: 400 }
      );
    }

    // Build context for AI analysis
    const documentContext = courseData
      ? `Course: ${courseData.courseName || courseData.courseCode || 'Unknown'}\n`
      : '';

    // Build conversation context for prompts
    const conversationContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nCONVERSATION CONTEXT - You are in the middle of an ongoing conversation:
${conversationHistory.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'You'}: ${msg.content}`).join('\n')}

CRITICAL INSTRUCTIONS FOR CONTEXTUAL RESPONSES:
- Continue the conversation naturally based on the document content
- If the student was asking about something specific, relate the document to that topic
- Reference specific details from the document naturally
- Don't just describe the document - continue the conversation flow
- Be conversational and contextual, not robotic or generic
- If the conversation was about a specific topic, connect the document to that topic
- Don't ask "What do you need help with?" if the context makes it clear

`
      : '';

    // Check if user has a specific question or just uploaded without asking
    const hasSpecificQuestion = userPrompt && 
      userPrompt.trim().length > 0 && 
      !userPrompt.toLowerCase().includes('analyze this') &&
      !userPrompt.toLowerCase().includes('provide insights') &&
      !userPrompt.toLowerCase().includes('analyze the document');

    // If no specific question, just acknowledge and ask what they need
    if (!hasSpecificQuestion) {
      // Quick scan to identify document type/topic (1 sentence acknowledgment)
      const quickScanPrompt = `You are analyzing a document that a user uploaded. Read the document and provide a ONE SENTENCE acknowledgment of what it's about. Then ask what they need help with.

${conversationContext}

CRITICAL INSTRUCTIONS:
- Read the document to understand its topic/subject
- ${conversationHistory && conversationHistory.length > 0 ? 'Continue the conversation naturally. If the student was discussing something specific, relate the document to that topic. ' : ''}Give ONE sentence acknowledging what the document is about (e.g., "I see you uploaded an essay about Copland's three planes of listening" or "I see you uploaded a resume highlighting your software engineering experience")
- DO NOT analyze, summarize, or provide feedback
- DO NOT list strengths, weaknesses, or suggestions
- ${conversationHistory && conversationHistory.length > 0 ? 'Continue the conversation flow naturally based on previous messages. ' : ''}Simply acknowledge what it is, then ask: "What do you need help with - understanding the concepts, revising your essay, or something else?"

BAD response:
"The document you've shared is an analysis of Copland's three planes of listening. The essay discusses the sensuous plane, expressive plane, and sheerly musical plane in detail. Your writing demonstrates strong understanding of the concepts, though you could strengthen the conclusion. The structure is clear and well-organized..."

GOOD response:
${conversationHistory && conversationHistory.length > 0 
  ? '"Perfect! I can see you\'ve uploaded the essay we were discussing. It covers Copland\'s three planes of listening. What would you like help with - understanding the concepts, revising your essay, or something else?"'
  : '"I see you uploaded an essay about Copland\'s three planes of listening. What do you need help with - understanding the concepts, revising your essay, or something else?"'}

Now read the document and respond:`;

      const quickScanResult = await provideStudyAssistanceWithFallback({
        question: quickScanPrompt,
        context: `${documentContext}Document: ${fileName} (${fileType})`,
        fileContext: {
          fileName,
          fileType,
          fileContent: extractedText.substring(0, 50000) // Just enough to identify topic
        },
        conversationHistory: conversationHistory,
        isSearchRequest: false
      });

      if (quickScanResult && quickScanResult.answer) {
        return NextResponse.json({
          success: true,
          analysis: quickScanResult.answer,
          provider: quickScanResult.provider,
          fileName,
          fileType,
          extractedTextLength: extractedText.length
        });
      }
    }

    // Create a comprehensive prompt for document analysis (when user has a specific question)
    const contextualUserPrompt = userPrompt 
      ? `${userPrompt}${conversationContext ? `\n\n${conversationContext}` : ''}`
      : '';
    
    const analysisPrompt = contextualUserPrompt || `You are an expert document analyst providing detailed, actionable feedback. Analyze this document thoroughly and provide:

${conversationContext}

**CRITICAL - PERSPECTIVE DETECTION (READ THIS FIRST):**
The user has uploaded this document themselves. This means it is almost certainly THEIR OWN WORK. 

**ALWAYS use second person ("you/your") when giving feedback:**
- Say "Your cover letter" NOT "Adam's cover letter" or "The cover letter"
- Say "You demonstrate" NOT "He demonstrates" or "Adam demonstrates"
- Say "Your experience" NOT "His experience" or "The applicant's experience"
- Say "You should consider" NOT "He should consider"

**ONLY use third person if:**
- The user explicitly asks "What do you think of this person's resume?" (clearly someone else)
- The document is clearly a third-party document the user is reviewing
- The user explicitly states it's not their work

**Default rule: Since the user uploaded it, it's their work. Use "you/your" throughout your response.**

Examples of CORRECT usage:
- "Your cover letter effectively highlights your experience..."
- "You demonstrate strong technical skills..."
- "I'd suggest you strengthen the closing paragraph..."

Examples of INCORRECT usage (avoid these):
- "Adam's cover letter..." (use "Your cover letter")
- "He demonstrates..." (use "You demonstrate")
- "The applicant shows..." (use "You show")

1. **Comprehensive Summary**: 
   - Main topic, purpose, and key themes
   - Important details, data, dates, deadlines, or requirements
   - Structure and organization

2. **Detailed Analysis** (like a professional reviewer):
   - **Strengths**: What works well in this document? What are the strong points?
   - **Key Insights**: What are the most important takeaways or notable aspects?
   - **Suggestions for Improvement**: Provide specific, actionable suggestions to enhance the document
   - **Technical/Content Depth**: If applicable, analyze technical aspects, clarity, persuasiveness, or effectiveness

3. **Be Specific and Actionable**:
   - Reference specific sections or quotes when making points
   - Provide concrete examples of what could be improved
   - Give actionable advice, not just general observations
   - Think like a mentor providing detailed feedback
   - Use the appropriate perspective (you/your vs. he/she/they) based on whether it's the user's own work

4. **Format your response**:
   - Start with a brief overview
   - Then provide detailed analysis with clear sections (Strengths, Suggestions, etc.)
   - Use specific examples from the document
   - Be thorough but organized

Remember: The user will ask follow-up questions, so understand the document deeply. Provide analysis similar to how a professional editor or consultant would review it - detailed, specific, and actionable. Always use the correct perspective based on whether it's the user's own work or someone else's.

Now analyze the following document:`;

    // Use the dual AI service to analyze the document
    const aiResult = await provideStudyAssistanceWithFallback({
      question: analysisPrompt,
      context: `${documentContext}Document Analysis: ${fileName} (${fileType})`,
      fileContext: {
        fileName,
        fileType,
        fileContent: extractedText.substring(0, 100000) // Limit to 100k chars to avoid token limits
      },
      conversationHistory: conversationHistory,
      isSearchRequest: false
    });

    if (!aiResult || !aiResult.answer) {
      throw new Error('AI analysis failed to generate response');
    }

    // Return the analysis
    return NextResponse.json({
      success: true,
      analysis: aiResult.answer,
      provider: aiResult.provider,
      fileName,
      fileType,
      extractedTextLength: extractedText.length
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze document',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

