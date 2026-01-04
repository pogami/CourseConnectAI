import { NextRequest } from 'next/server';
import { provideStudyAssistanceWithStreaming } from '@/ai/services/dual-ai-service';
import { filterContent } from '@/lib/content-filter';
import { db } from '@/lib/firebase/server';
import { generateMainSystemPrompt } from '@/ai/prompts/main-system-prompt';

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
      courseData, // ✅ CRITICAL: Extract courseData for class chats
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
      // Stream the safety message instead of returning an error
      const safetyMessage = filterResult.message || 'Content filtered for safety';
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          // Split safety message into words and stream them
          const words = safetyMessage.split(/(\s+)/);
          for (let i = 0; i < words.length; i += 2) {
            const word = words[i] || '';
            const space = words[i + 1] || '';
            
            if (word.trim()) {
              const completeWord = word + (space || ' ');
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: completeWord
              }) + '\n'));
              await new Promise(resolve => setTimeout(resolve, 25));
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done',
            fullResponse: safetyMessage
          }) + '\n'));
          
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
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

          // ✅ CRITICAL: Handle courseData for class chats - extract full syllabus text
          let syllabusContent = '';
          if (courseData && courseData.syllabusText) {
            // Include FULL syllabus text (up to 200k chars)
            const fullSyllabus = courseData.syllabusText.length > 200000 
              ? courseData.syllabusText.substring(0, 200000) 
              : courseData.syllabusText;
            // Use shared prompt generator for syllabus content
            const syllabusPrompt = generateMainSystemPrompt({
              syllabusContent: `🚨🚨🚨 FULL SYLLABUS TEXT - USE THIS DIRECTLY 🚨🚨🚨

${fullSyllabus}

[END OF FULL SYLLABUS TEXT]`,
              courseInfo: 'See course context below',
              dateFormatted: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            });
            
            syllabusContent = syllabusPrompt;
            console.log('✅ Stream: Full syllabus included from courseData, length:', fullSyllabus.length);
          }

          // Get syllabi context if available (fallback for general chat)
          let syllabiContext = '';
          if (allSyllabi && Array.isArray(allSyllabi) && allSyllabi.length > 0) {
            syllabiContext = allSyllabi.map((s: any) =>
              `Course: ${s.courseName || 'Unknown'}\n${s.content || ''}`
            ).join('\n\n---\n\n');
          }

          // Enrich context with syllabi - prioritize courseData syllabusText
          let enrichedContext = context || 'General Chat';
          if (syllabusContent) {
            // Use full syllabus from courseData
            enrichedContext = `${context || 'General Chat'}\n\n${syllabusContent}`;
          } else if (syllabiContext) {
            // Fallback to allSyllabi
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

          // Don't add response style guidance to the question - it's handled by the AI service via aiResponseType parameter
          // This prevents the instruction from appearing in the actual response
          let finalQuestion = enhancedQuestion;
          if (frustration.isFrustrated) {
            // Only add frustration guidance if needed (as internal context, not visible to user)
            finalQuestion = `${enhancedQuestion}\n\n[IMPORTANT CONTEXT: The student is showing signs of frustration (${frustration.level} level). ${frustration.reasons.join(', ')}. ${frustration.suggestedApproach === 'analogy' ? 'Use a real-world analogy or sports example instead of formulas. Make it relatable.' : frustration.suggestedApproach === 'step-by-step' ? 'Break this down into very small, clear steps. Go slowly.' : frustration.suggestedApproach === 'example' ? 'Use concrete examples to illustrate the concept.' : frustration.suggestedApproach === 'break' ? 'Break this into the smallest possible pieces.' : ''} Start your response with empathy, acknowledge their frustration, then pivot to a different approach. Be patient and encouraging.]`;
          }

          // Call AI service with native streaming
          let fullAnswer = '';
          let wordBuffer = ''; // Buffer for accumulating characters until we have complete words
          let lastWordSentTime = 0; // Track when last word was sent for consistent timing
          const WORD_INTERVAL_MS = 25; // Consistent delay between words
          
          const aiResult = await provideStudyAssistanceWithStreaming({
            question: finalQuestion,
            context: enrichedContext,
            conversationHistory: conversationHistory || [],
            isSearchRequest: false,
            userName: userName || undefined,
            userId: userId || undefined,
            fileContext: fileContext, // Include document context so AI can reference uploaded documents
            learningProfile: learningProfile, // Include learning profile for personalization
            aiResponseType: aiResponseType // Pass response type to control AI tone
          }, async (chunk: string) => {
            // Accumulate chunks and split into complete words before sending
            fullAnswer += chunk;
            wordBuffer += chunk;
            
            // Split into words - match words and spaces
            const parts = wordBuffer.match(/\S+|\s+/g) || [];
            
            // Find complete words (word + space pairs)
            let completeWords: string[] = [];
            let incompletePart = '';
            
            // Process word + space pairs
            for (let i = 0; i < parts.length - 1; i += 2) {
              const word = parts[i];
              const space = parts[i + 1];
              
              if (word && /\S/.test(word)) {
                // Complete word with space
                completeWords.push(word + (space || ' '));
              }
            }
            
            // Check if last part is incomplete
            if (parts.length > 0) {
              const lastPart = parts[parts.length - 1];
              // If it's a word (not whitespace) and doesn't end with punctuation, it's incomplete
              if (/\S/.test(lastPart) && !/[.,!?;:]$/.test(lastPart)) {
                incompletePart = lastPart;
              }
            }
            
            // Send complete words one at a time with consistent timing
            // CRITICAL: Process words sequentially with delay to ensure smooth streaming
            for (let i = 0; i < completeWords.length; i++) {
              const word = completeWords[i];
              
              // Always add delay between words for smooth streaming
              await new Promise(resolve => setTimeout(resolve, WORD_INTERVAL_MS));
              
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: word
              }) + '\n'));
              
              lastWordSentTime = Date.now();
            }
            
            // Keep incomplete part in buffer
            wordBuffer = incompletePart;
          });

          if (!aiResult || !aiResult.answer) {
            console.error('AI service returned invalid response:', aiResult);
            throw new Error('AI service returned invalid response');
          }

          // Send any remaining buffered word or characters
          if (wordBuffer.trim()) {
            // Check if it's a complete word or just trailing characters
            const trimmed = wordBuffer.trim();
            // If it ends with punctuation or is a complete word, send it
            if (/[.,!?;:]$/.test(trimmed) || !/\s/.test(trimmed)) {
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: wordBuffer
              }) + '\n'));
            } else {
              // Incomplete word - send it anyway at the end
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: wordBuffer
              }) + '\n'));
            }
          }
          
          // Ensure we have the full answer (in case streaming didn't capture everything)
          const finalAnswer = fullAnswer.trim() || aiResult.answer.trim();
          
          if (!finalAnswer) {
            console.error('AI service returned empty answer');
            throw new Error('AI service returned empty response');
          }

          if (!aiResult || !aiResult.answer) {
            console.error('AI service returned invalid response:', aiResult);
            throw new Error('AI service returned invalid response');
          }

          // Send done signal with final response - wait a tiny bit to ensure all content chunks are sent
          await new Promise(resolve => setTimeout(resolve, 50));
          
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done',
            fullResponse: finalAnswer
          }) + '\n'));

          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          console.error('Error stack:', error.stack);
          try {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'error',
              message: error.message || 'Failed to generate response',
              error: error.message || 'Unknown error'
            }) + '\n'));
            controller.close();
          } catch (closeError) {
            // If controller is already closed or errored, just log it
            console.error('Error closing stream controller:', closeError);
          }
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
