import { NextRequest } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import { filterContent } from '@/lib/content-filter';
import { db } from '@/lib/firebase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      context,
      conversationHistory,
      shouldCallAI = true,
      isPublicChat = false,
      allSyllabi,
      userName,
      userId,
      documentContext,
      aiResponseType = 'concise'
    } = await request.json();

    if (!question) {
      return new Response(JSON.stringify({ type: 'error', message: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Content filtering for safety
    const filterResult = filterContent(question);
    if (!filterResult.isSafe) {
      return new Response(JSON.stringify({
        type: 'error',
        message: filterResult.message || 'Content filtered for safety'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send thinking status
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'thinking',
            thinking: 'checking your syllabus'
          }) + '\n'));

          // Get syllabi context if available
          let syllabiContext = '';
          if (allSyllabi && Array.isArray(allSyllabi) && allSyllabi.length > 0) {
            syllabiContext = allSyllabi.map((s: any) =>
              `Course: ${s.courseName || 'Unknown'}\n${s.content || ''}`
            ).join('\n\n---\n\n');
          }

          // Enrich context with syllabi
          let enrichedContext = context || 'General Chat';
          if (syllabiContext) {
            enrichedContext = `${context || 'General Chat'}\n\n${syllabiContext}`;
          }

          // Add document context if available
          let fileContext: any = undefined;
          if (documentContext && documentContext.combinedText) {
            // Use the combined text from all uploaded documents
            const documentNames = documentContext.documents?.map((d: any) => d.fileName).join(', ') || 'uploaded documents';
            enrichedContext = `${enrichedContext}\n\n📄 User has uploaded documents: ${documentNames}`;

            fileContext = {
              fileName: documentNames,
              fileType: 'multiple',
              fileContent: documentContext.combinedText.substring(0, 100000) // Limit to avoid token limits
            };

            console.log('📄 Including document context in AI call:', {
              documentCount: documentContext.documents?.length || 0,
              textLength: documentContext.combinedText.length
            });
          }

          // Detect frustration and emotional state
          const { detectFrustration } = await import('@/lib/emotional-intelligence');
          const frustration = detectFrustration(question, conversationHistory || []);
          
          // Build frustration-aware prompt enhancement
          let frustrationGuidance = '';
          if (frustration.isFrustrated) {
            const approachGuidance = 
              frustration.suggestedApproach === 'analogy' ? 'IMPORTANT: Use a real-world analogy or sports example instead of formulas/math. Step away from technical language and make it relatable.' :
              frustration.suggestedApproach === 'step-by-step' ? 'IMPORTANT: Break this down into very small, clear steps. Go slowly and check understanding at each step.' :
              frustration.suggestedApproach === 'example' ? 'IMPORTANT: Use concrete examples to illustrate the concept. Show, do not just tell.' :
              frustration.suggestedApproach === 'break' ? 'IMPORTANT: Break this into the smallest possible pieces. Tackle one tiny piece at a time.' :
              '';
            
            frustrationGuidance = `\n\n🚨 EMOTIONAL INTELLIGENCE - FRUSTRATION DETECTED:
The student is showing signs of frustration (${frustration.level} level). Reasons: ${frustration.reasons.join(', ')}.
${approachGuidance}
Start your response with empathy and understanding. Acknowledge their frustration, then pivot to a different approach. Be patient and encouraging.`;
          }

          // For landing page demo, use a more structured prompt
          const isLandingPageDemo = context?.includes('Calculus 101 course with syllabus');
          const enhancedQuestion = isLandingPageDemo
            ? `${question}\n\nIMPORTANT: Format your response as a structured study guide. Start with an introductory sentence mentioning the course name and key topics. Then provide a numbered list (1., 2., 3.) of the main topics to focus on, with brief explanations. Be professional but helpful. Use proper spacing and formatting.${frustrationGuidance}`
            : question + frustrationGuidance;

          // Fetch learning profile if userId is available
          let learningProfile: any = undefined;
          if (userId) {
            try {
              const userDoc = await db.collection('users').doc(userId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.learningProfile) {
                  learningProfile = userData.learningProfile;
                }
              }
            } catch (error) {
              console.warn('Failed to fetch learning profile:', error);
            }
          }

          // Log the AI response type for debugging
          console.log('🎨 AI Response Type:', aiResponseType);

          // Build response style guidance based on aiResponseType
          let responseStyleGuidance = '';
          if (aiResponseType === 'detailed') {
            responseStyleGuidance = '\n\n[HIGHEST PRIORITY: Provide a DETAILED response. Include comprehensive explanations, multiple examples, step-by-step breakdowns, and thorough context. Be thorough and expansive in your answer.]';
          } else if (aiResponseType === 'conversational') {
            responseStyleGuidance = '\n\n[HIGHEST PRIORITY: Provide a CONVERSATIONAL response. Use a friendly, approachable tone. Write as if you are having a natural conversation with the student. Be warm, engaging, and use casual language when appropriate.]';
          } else if (aiResponseType === 'analytical') {
            responseStyleGuidance = '\n\n[HIGHEST PRIORITY: Provide an ANALYTICAL response. Break down the problem systematically. Use logical reasoning, identify key components, analyze relationships, and provide structured insights. Be methodical and precise.]';
          } else {
            // Default to concise
            responseStyleGuidance = '\n\n[HIGHEST PRIORITY: Provide a CONCISE response. Be brief, direct, and to the point. Avoid unnecessary elaboration. Get straight to the answer.]';
          }

          // Enhance question with frustration guidance if needed
          let finalQuestion = enhancedQuestion;
          if (frustration.isFrustrated) {
            // Include frustration guidance in the question itself so it's part of the prompt
            finalQuestion = `${enhancedQuestion}\n\n[IMPORTANT CONTEXT: The student is showing signs of frustration (${frustration.level} level). ${frustration.reasons.join(', ')}. ${frustration.suggestedApproach === 'analogy' ? 'Use a real-world analogy or sports example instead of formulas. Make it relatable.' : frustration.suggestedApproach === 'step-by-step' ? 'Break this down into very small, clear steps. Go slowly.' : frustration.suggestedApproach === 'example' ? 'Use concrete examples to illustrate the concept.' : frustration.suggestedApproach === 'break' ? 'Break this into the smallest possible pieces.' : ''} Start your response with empathy, acknowledge their frustration, then pivot to a different approach. Be patient and encouraging.]${responseStyleGuidance}`;
          } else {
            finalQuestion = enhancedQuestion + responseStyleGuidance;
          }

          // Call AI service
          const aiResult = await provideStudyAssistanceWithFallback({
            question: finalQuestion,
            context: enrichedContext,
            conversationHistory: conversationHistory || [],
            isSearchRequest: false,
            userName: userName || undefined,
            userId: userId || undefined,
            fileContext: fileContext, // Include document context so AI can reference uploaded documents
            learningProfile: learningProfile, // Include learning profile for personalization
            aiResponseType: aiResponseType // Pass response type to control AI tone
          });

          if (!aiResult || !aiResult.answer) {
            throw new Error('AI service returned invalid response');
          }

          let answer = aiResult.answer;

          // Post-process the response to fix formatting issues
          // Fix missing spaces after punctuation
          answer = answer.replace(/([.!?])([A-Z])/g, '$1 $2');
          // Fix missing spaces in numbered lists (1. 2. 3.)
          answer = answer.replace(/(\d+)\.([A-Za-z])/g, '$1. $2');
          // Ensure proper spacing around list items - add newline before numbered items
          answer = answer.replace(/([.!?])\s*(\d+)\./g, '$1\n\n$2.');
          // Fix spacing after colons in list items
          answer = answer.replace(/(\d+\.\s+[^:]+):([A-Z])/g, '$1: $2');
          // Add newline after list item numbers if missing
          answer = answer.replace(/(\d+\.\s+[^:]+):\s*/g, '$1:\n');
          // Fix multiple spaces
          answer = answer.replace(/  +/g, ' ');
          // Clean up multiple newlines (keep max 2)
          answer = answer.replace(/\n{3,}/g, '\n\n');
          // Ensure proper paragraph breaks
          answer = answer.replace(/([.!?])\s+([A-Z][a-z])/g, (match, punct, next) => {
            // Don't add break if it's already a list item
            if (next.match(/^\d+\./)) return match;
            return punct + '\n\n' + next;
          });
          // Trim and clean
          answer = answer.trim();

          // Stream the response in sentence/phrase chunks (not word by word)
          // Split by sentences first, then by phrases for smoother streaming
          const sentences = answer.split(/(?<=[.!?])\s+/);
          for (const sentence of sentences) {
            // Split long sentences into phrases for better streaming
            const phrases = sentence.match(/.{1,50}(\s|$)/g) || [sentence];

            for (const phrase of phrases) {
              if (phrase.trim()) {
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'content',
                  content: phrase
                }) + '\n'));

                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done',
            fullResponse: answer
          }) + '\n'));

          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to generate response'
          }) + '\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Stream API error:', error);
    return new Response(JSON.stringify({
      type: 'error',
      message: error.message || 'Failed to process request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
