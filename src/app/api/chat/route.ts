import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import { extractUserNameFromMessages, extractUserNameFromMessage } from '@/lib/extract-user-name';
import { filterContent, generateFilterResponse } from '@/lib/content-filter';
import { generateMainSystemPrompt } from '@/ai/prompts/main-system-prompt';
import { createAIResponseNotification } from '@/lib/notifications/server';
import { db } from '@/lib/firebase/server';

export const runtime = 'nodejs';

// SearchResult interface for sources
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Removed Ollama - now using Gemini + OpenAI fallback

export async function POST(request: NextRequest) {
  try {
    const { 
      question, 
      context, 
      conversationHistory, 
      shouldCallAI = true, 
      isPublicChat = false, 
      hasAIMention = false, 
      allSyllabi,
      userId,
      userName,
      chatId,
      chatTitle,
      isSearchRequest = false,
      documentContext
    } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // If it's a public chat and AI shouldn't be called, return no response
    if (isPublicChat && !shouldCallAI) {
      return NextResponse.json({
        success: true,
        answer: null, // No AI response
        shouldRespond: false
      });
    }

    // Clean @ mentions from the question if present
    const cleanedQuestion = question.replace(/@ai\s*/gi, '').trim();
    
    // Extract user name from conversation history or current message as fallback
    let extractedName: string | null = null;
    try {
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        const messages = conversationHistory.map((msg: any) => ({
          sender: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content || ''
        }));
        extractedName = extractUserNameFromMessages(messages);
      }
      if (!extractedName) {
        extractedName = extractUserNameFromMessage(cleanedQuestion);
      }
    } catch (error) {
      console.warn('Error extracting user name:', error);
    }
    
    // Use extracted name if found, otherwise use provided userName
    const finalUserName = extractedName || userName;

    // Check if it's a general academic question (not CourseConnect support)
    const isGeneralQuestion = /^(what is|how do|explain|solve|calculate|define|tell me about|help me with).*(math|science|homework|biology|chemistry|physics|history|english|literature|essay|assignment|quiz|test|exam)/i.test(cleanedQuestion);
    
    if (isGeneralQuestion && !isSearchRequest) {
      return NextResponse.json({
        success: true,
        answer: "I'm CourseConnect's support assistant. I can only help with questions about our platform. For academic help, try our AI tutoring features! Please sign up here: [Get Started](https://courseconnectai.com/dashboard)",
        provider: 'support-filter',
        shouldRespond: true,
        timestamp: new Date().toISOString(),
        sources: [],
        crisisResources: []
      });
    }

    // Content filtering for safety
    const filterResult = filterContent(cleanedQuestion);
    if (!filterResult.isSafe) {
      console.log(`Content filtered: ${filterResult.category} (confidence: ${filterResult.confidence})`);
      return NextResponse.json({
        success: true,
        answer: generateFilterResponse(filterResult),
        provider: 'safety-filter',
        shouldRespond: true,
        timestamp: new Date().toISOString(),
        sources: [],
        crisisResources: filterResult.crisisResources
      });
    }

    // Detect math/physics style questions to force direct solving behavior
    const isMathQuestion = /(?:\\int|\\sum|\\frac|∫|√|=|≥|≤|≠|≈|\^|\bx\b|\by\b|\bdx\b|\bdy\b|\bsolve\b|\bequation\b|\bderivative\b|\bintegral\b|\bfactor\b|\bquadratic\b|\bpolynomial\b|\bsimplify\b|\bmatrix\b|\blimit\b|\btheta\b|\bsin\b|\bcos\b|\btan\b)/i.test(cleanedQuestion);
    
    console.log('Chat API called with:', { 
      question: cleanedQuestion, 
      context, 
      conversationHistory: conversationHistory?.length || 0, 
      shouldCallAI, 
      isPublicChat,
      hasAIMention,
      timestamp: new Date().toISOString()
    });
    
    // Check if we need current information and search for it
    let sources: SearchResult[] = []; // Will be populated by AI service if search is performed
    const questionLower = cleanedQuestion.toLowerCase();
    const needsCurrentInfo = questionLower.includes('news') || 
                           questionLower.includes('current') || 
                           questionLower.includes('today') || 
                           questionLower.includes('recent') ||
                           questionLower.includes('trump') ||
                           questionLower.includes('tylenol') ||
                           questionLower.includes('politics') ||
                           questionLower.includes('2025') ||
                           questionLower.includes('what is') ||
                           questionLower.includes('who is') ||
                           questionLower.includes('when did') ||
                           questionLower.includes('where is') ||
                           questionLower.includes('how does') ||
                           questionLower.includes('capital') ||
                           questionLower.includes('president') ||
                           questionLower.includes('country') ||
                           questionLower.includes('history');

    // AI service will handle search when isSearchRequest is true

    // Build natural, human-like prompt with file information
    const convoContext = conversationHistory?.length > 0 
      ? `\n\nPrevious chat:\n${conversationHistory.map((msg: any) => {
          let content = msg.content || '';
          // Add file information if present
          if (msg.files && msg.files.length > 0) {
            const fileInfo = msg.files.map((f: any) => `${f.name} (${f.type})`).join(', ');
            content += ` [Attached files: ${fileInfo}]`;
          } else if (msg.file) {
            content += ` [Attached file: ${msg.file.name} (${msg.file.type})]`;
          }
          return `${msg.role === 'assistant' ? 'AI' : 'User'}: ${content}`;
        }).join('\n')}\n\n`
      : '';

    // Build syllabi context if available (General Chat with all courses)
    let syllabiContext = '';
    if (allSyllabi && allSyllabi.length > 0) {
      syllabiContext = `\n\nYou have access to ALL of the student's course syllabi:\n\n`;
      allSyllabi.forEach((syllabus: any, index: number) => {
        syllabiContext += `📚 Course ${index + 1}: ${syllabus.courseName || 'Unknown'}${syllabus.courseCode ? ` (${syllabus.courseCode})` : ''}\n`;
        if (syllabus.professor) syllabiContext += `   Professor: ${syllabus.professor}\n`;
        if (syllabus.description) syllabiContext += `   Description: ${syllabus.description}\n`;
        if (syllabus.topics && syllabus.topics.length > 0) {
          syllabiContext += `   Topics: ${syllabus.topics.slice(0, 5).join(', ')}${syllabus.topics.length > 5 ? '...' : ''}\n`;
        }
        if (syllabus.exams && syllabus.exams.length > 0) {
          syllabiContext += `   Exams: ${syllabus.exams.map((e: any) => e.name).join(', ')}\n`;
        }
        if (syllabus.assignments && syllabus.assignments.length > 0) {
          syllabiContext += `   Assignments: ${syllabus.assignments.length} total\n`;
        }
        syllabiContext += '\n';
      });
      syllabiContext += `\nYou can help with ANY of these courses! The student can ask about any topic, assignment, or exam from any of their classes.\n\n`;
    }

    // Detect frustration and emotional state
    const { detectFrustration, generateEmpatheticPrefix } = await import('@/lib/emotional-intelligence');
    const frustration = detectFrustration(cleanedQuestion, conversationHistory);
    const empatheticPrefix = generateEmpatheticPrefix(frustration);

    // Build frustration guidance
    const frustrationGuidance = frustration.isFrustrated 
      ? `🚨 EMOTIONAL INTELLIGENCE - FRUSTRATION DETECTED:
The student is showing signs of frustration (${frustration.level} level). Reasons: ${frustration.reasons.join(', ')}.
${frustration.suggestedApproach === 'analogy' ? 'IMPORTANT: Use a real-world analogy or sports example instead of formulas/math. Step away from technical language and make it relatable.' : ''}
${frustration.suggestedApproach === 'step-by-step' ? 'IMPORTANT: Break this down into very small, clear steps. Go slowly and check understanding at each step.' : ''}
${frustration.suggestedApproach === 'example' ? 'IMPORTANT: Use concrete examples to illustrate the concept. Show, do not just tell.' : ''}
${frustration.suggestedApproach === 'break' ? 'IMPORTANT: Break this into the smallest possible pieces. Tackle one tiny piece at a time.' : ''}
Start your response with empathy and understanding. Acknowledge their frustration, then pivot to a different approach. Be patient and encouraging.`
      : '';

    // Use shared prompt generator
    const basePrompt = generateMainSystemPrompt({
      syllabusContent: syllabiContext || undefined,
      courseInfo: context || 'General Chat',
      dateFormatted: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      frustrationGuidance: frustrationGuidance
    });

    const prompt = `${basePrompt}

${convoContext}User: ${cleanedQuestion}

CourseConnect AI:`;

    // Use Gemini + OpenAI fallback (no more Ollama)
    let aiResponse: string;
    let selectedModel: string;
    let aiResult: any = null; // Store AI result for later use
    
    try {
      console.log('Using Gemini + OpenAI fallback system');
      
      // Use the dual AI service with Gemini first, OpenAI fallback
      // If we have syllabi context, include it in the context parameter
      let enrichedContext = context || 'General Chat';
      if (syllabiContext) {
        enrichedContext = `${context || 'General Chat'}${syllabiContext}`;
      }

      // Add document context if available
      let fileContext: any = undefined;
      if (documentContext && documentContext.combinedText) {
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

      // Let AI service handle search directly (simpler approach)
      aiResult = await provideStudyAssistanceWithFallback({
        question: cleanedQuestion,
        context: enrichedContext,
        conversationHistory: conversationHistory || [],
        isSearchRequest: isSearchRequest,
        userName: finalUserName || undefined,
        userId: userId || undefined,
        fileContext: fileContext, // Include document context so AI can reference uploaded documents
        learningProfile: learningProfile // Include learning profile for personalization
      });
      
      // Ensure we have a valid answer
      if (!aiResult || !aiResult.answer || typeof aiResult.answer !== 'string') {
        console.warn('AI service returned invalid response:', aiResult);
        throw new Error('AI service returned invalid response');
      }
      
      aiResponse = aiResult.answer;
      selectedModel = aiResult.provider;
      sources = aiResult.sources || []; // Sources come from AI service when it performs search
      
      
    } catch (error: any) {
      console.error('AI service failed:', error);
      // Return a proper error response instead of echoing
      return NextResponse.json({
        error: 'AI service unavailable',
        message: error?.message || 'Failed to generate response. Please check your API keys and try again.',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, { status: 503 });
    }

    // Note: Frustration guidance is already included in the prompt, so no need to prepend
    // The AI will naturally incorporate empathetic responses based on the prompt instructions

    // Final sanitation: limit emoji usage just in case a provider ignores style rules
    const sanitizeEmojis = (text: string): string => {
      try {
        // Simple emoji removal - remove common emoji ranges
        return (text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
      } catch {
        // Fallback: broadly remove non-ASCII characters which captures most emojis
        return (text || '').replace(/[\x80-\uFFFF]/g, '');
      }
    };

    // Ensure aiResponse is always a valid string
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('aiResponse is invalid:', aiResponse);
      throw new Error('AI service returned invalid response');
    }
    
    aiResponse = sanitizeEmojis(aiResponse);

    console.log('Chat API result:', { 
      model: selectedModel || 'fallback', 
      answerLength: aiResponse?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Create notification for AI response (only if user is authenticated and not in public chat)
    if (userId && chatId && !isPublicChat) {
      try {
        // Check if user is currently active in this chat (not away)
        const isUserActive = request.headers.get('user-active') === 'true';
        
        // Only create notification if user is not actively in the chat
        if (!isUserActive) {
          await createAIResponseNotification(
            userId,
            aiResponse,
            chatId,
            chatTitle || context
          );
          console.log(`✅ Notification created for user ${userId} in ${chatTitle || context} (user was away)`);
        } else {
          console.log(`ℹ️ No notification created - user is actively in chat ${chatId}`);
        }
      } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't fail the request if notification creation fails
      }
    }

    // Filter and rank sources to only those most relevant to the final answer
    let filteredSources = sources;
    try {
      if (Array.isArray(sources) && sources.length > 0 && typeof aiResponse === 'string') {
        const stop = new Set(['the','a','an','and','or','to','of','in','on','for','with','by','at','is','are','was','were','it','as','that','this','these','those','from','be','can','will']);
        const tokenize = (s: string) => (s || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(t => t && !stop.has(t) && t.length > 2);
        const answerTokens = new Set(tokenize(aiResponse));
        const scored = sources.map((s) => {
          const hay = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
          let score = 0;
          answerTokens.forEach(t => { if (hay.includes(t)) score += 1; });
          try { const host = new URL(s.url).hostname.replace(/^www\./,''); if (host) score += 0.25; } catch {}
          return { s, score };
        });
        const maxKeep = Math.min(parseInt(process.env.SEARCH_RESULTS_LIMIT || '12', 10), 20);
        const used = scored
          .filter(x => x.score > 0)
          .sort((a,b) => b.score - a.score)
          .slice(0, maxKeep)
          .map(x => x.s);
        filteredSources = used.length > 0 ? used : sources.slice(0, Math.max(3, Math.min(10, sources.length)));
      }
    } catch (e) {
      console.warn('Source ranking failed; returning original sources:', e);
      filteredSources = sources;
    }

    // Use isSearchRequest from AI result if available (more accurate), otherwise use original request
    const finalIsSearchRequest = aiResult?.isSearchRequest !== undefined ? aiResult.isSearchRequest : isSearchRequest;
    
    const response = {
      success: true,
      answer: aiResponse,
      provider: selectedModel || 'fallback',
      shouldRespond: true,
      timestamp: new Date().toISOString(),
      sources: filteredSources.length > 0 ? filteredSources : undefined,
      isSearchRequest: finalIsSearchRequest // CRITICAL: Include flag from AI service result
    };
    
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      error: 'Failed to process chat message',
      details: error.message 
    }, { status: 500 });
  }
}