'use server';

/**
 * @fileOverview Dual AI Provider Service with Automatic Fallback
 * 
 * This service tries Claude Sonnet 4.5 first for high-quality responses,
 * and if it fails, automatically falls back to Google AI (Gemini 3 Flash Preview).
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { searchCurrentInformation, needsCurrentInformation, formatSearchResultsForAI } from './web-search-service';
import { extractUrlsFromText, scrapeMultiplePages, formatScrapedContentForAI } from './web-scraping-service';

// Enhanced web browsing is only imported dynamically to avoid breaking Edge runtime
// import { shouldAutoSearch, performAutoSearch, enhancedWebBrowsing, shouldUsePuppeteer } from './enhanced-web-browsing-service';
import { generateMainSystemPrompt } from '@/ai/prompts/main-system-prompt';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Helper to call enhanced browsing safely in both Edge and Node.js
 */
async function safeEnhancedBrowsing(url: string, options: any = {}) {
  if (process.env.NEXT_RUNTIME === 'edge') {
    try {
      const response = await fetch(url);
      if (!response.ok) return { success: false };
      const html = await response.text();
      return {
        success: true,
        content: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 10000),
        title: 'Web Page',
        url
      };
    } catch (e) {
      return { success: false };
    }
  }
  const { enhancedWebBrowsing, shouldUsePuppeteer } = await import('./enhanced-web-browsing-service');
  const usePuppeteer = options.usePuppeteer ?? shouldUsePuppeteer(url);
  return await enhancedWebBrowsing(url, { ...options, usePuppeteer });
}

/**
 * Helper to call auto search safely in both Edge and Node.js
 */
async function safeAutoSearch(question: string, aiResponse: string) {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return { shouldSearch: false };
  }
  const { shouldAutoSearch, performAutoSearch } = await import('./enhanced-web-browsing-service');
  const autoSearchResult = shouldAutoSearch(question, aiResponse);
  if (autoSearchResult.shouldSearch && autoSearchResult.searchQuery) {
    const searchResults = await performAutoSearch(autoSearchResult.searchQuery);
    return { ...autoSearchResult, results: searchResults };
  }
  return autoSearchResult;
}

// AI Provider Types
export type AIProvider = 'claude' | 'google' | 'openai' | 'fallback';

export interface AIResponse {
  answer: string;
  provider: AIProvider;
  error?: string;
  sources?: {
    title: string;
    url: string;
    snippet: string;
  }[];
  isSearchRequest?: boolean; // Flag to indicate web search was requested
  thoughts?: string[]; // Internal thinking steps (Gemini 2.5)
  thinkingSummary?: string; // Summary of thinking process
}

export interface StudyAssistanceInput {
  question: string;
  context: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  fileContext?: {
    fileName: string;
    fileType: string;
    fileContent?: string;
  };
  isSearchRequest?: boolean; // Flag to indicate web search was requested
  thinkingMode?: boolean; // Flag to enable thinking/reasoning mode
  userName?: string; // User's name (from logged in user or guest)
  userId?: string; // User's ID for context tracking
  image?: string; // Base64 encoded image for vision/OCR
  mimeType?: string; // MIME type of the image
  learningProfile?: {
    major?: string;
    academicLevel?: string;
    learningStyle?: string;
    explanationDepth?: string;
    goals?: string;
  }; // User's learning profile for personalization
  aiResponseType?: 'concise' | 'detailed' | 'conversational' | 'analytical'; // AI response style
}

/**
 * Try Claude Sonnet 4.5 first
 */
async function tryClaude(input: StudyAssistanceInput): Promise<AIResponse> {
  try {
    console.log('Trying Claude Sonnet 4.5...');
    
    // Read API key at runtime
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Validate API key
    if (!apiKey || apiKey.trim() === '' || apiKey === 'demo-key' || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('Anthropic API key not configured');
    }
    
    // Build conversation history for context
    const conversationContext = input.conversationHistory && input.conversationHistory.length > 0 
      ? input.conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      : [];

    const fileContext = input.fileContext 
      ? `\n\n[INTERNAL INSTRUCTION - DO NOT REPEAT THIS TO THE USER]
The user has uploaded a document: "${input.fileContext.fileName}" (${input.fileContext.fileType}).
You have access to the full document content below. Answer questions using information from this document.
Provide specific details and references from the document when relevant.

Document Content:
${input.fileContext.fileContent || 'Document content not available.'}

[END INTERNAL INSTRUCTION - Answer naturally using the document content above]`
      : '';
    
    // Only search if explicitly requested
    let currentInfo = '';
    let searchSources: { title: string; url: string; snippet: string; }[] = [];
    
    if (input.isSearchRequest === true) {
      console.log('Web search requested - fetching current information for:', input.question);
      try {
        const searchResults = await searchCurrentInformation(input.question);
        if (searchResults.results && searchResults.results.length > 0) {
          currentInfo = formatSearchResultsForAI(searchResults);
          searchSources = searchResults.results.map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet
          }));
        } else {
          currentInfo = `\n\n⚠️ No search results found for: "${input.question}"\n`;
        }
      } catch (error: any) {
        console.warn('Failed to fetch current information:', error);
        currentInfo = `\n\n⚠️ Search failed: ${error.message || 'Unknown error'}\n`;
      }
    }
    
    // Check if the question contains URLs to scrape
    let scrapedContent = '';
    const urls = extractUrlsFromText(input.question || '');
    if (urls.length > 0) {
      console.log('Found URLs to scrape:', urls);
      try {
      const enhancedResults = await Promise.all(
        urls.map(async (url) => {
          const result = await safeEnhancedBrowsing(url, {
            takeScreenshot: false,
            autoSearchFallback: false
          });
          
          return result.success ? {
              url: result.url!,
              title: result.title || 'Untitled',
              content: result.content || '',
              summary: result.content?.substring(0, 200) + '...' || '',
              timestamp: new Date().toISOString(),
              wordCount: result.content?.split(' ').length || 0
            } : null;
          })
        );
        
        const successful = enhancedResults.filter(result => result !== null);
        if (successful.length > 0) {
          scrapedContent = formatScrapedContentForAI(successful);
        }
      } catch (error) {
        console.warn('Failed to browse URLs:', error);
      }
    }
    
    // Prepare System Prompt
    const userName = input.userName || 'there';
    const userContext = input.userName 
      ? `You are talking to ${input.userName}. Always use their name naturally in your responses when appropriate.`
      : '';
    
    // Build learning profile context if available
    let learningProfileContext = '';
    if (input.learningProfile) {
      learningProfileContext = `\n\nLEARNING PROFILE:
- Major: ${input.learningProfile.major || 'Not specified'}
- Academic Level: ${input.learningProfile.academicLevel || 'Not specified'}
- Learning Style: ${input.learningProfile.learningStyle || 'Not specified'}
- Explanation Depth Preference: ${input.learningProfile.explanationDepth || 'Not specified'}
- Goals: ${input.learningProfile.goals || 'Not specified'}

Adapt your responses to match this learning profile.`;
    }
    
    // Get shared prompt
    const sharedPrompt = generateMainSystemPrompt({
      userName: input.userName || undefined
    });
    
    let systemInstruction = `${sharedPrompt}${userContext}${learningProfileContext}

Always remember what you've discussed before and build on previous responses. When the student asks about "the most recent thing" or uses vague references like "that" or "it", always connect it to the most recent topic you discussed. Maintain full conversation context throughout the entire chat session.`;

    if (input.thinkingMode) {
        systemInstruction += `
        
CRITICAL PRIVATE REASONING INSTRUCTIONS:
- Think quietly before you answer.
- NEVER expose your internal thought process, plans, or meta language.
- NEVER output phrases such as "breaking down", "analyzing", "structuring", "deconstructing", "mapping", "retrieving", "verifying".
- NEVER use abstract placeholders like "principle A", "mechanism B", "X causes Y". Use concrete, real examples in plain language.
- When you reply, provide ONLY the final answer in a clear, natural, human tone.
- Keep answers concise but complete, as if a knowledgeable tutor is speaking.
`;
    }

    // Add response style based on aiResponseType
    let responseStyleInstruction = '';
    switch (input.aiResponseType) {
      case 'concise':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONCISE MODE (HIGHEST PRIORITY):
- Keep responses SHORT and DIRECT - maximum 2-3 sentences for simple questions
- Get straight to the point - no fluff, no unnecessary context
- Answer the question directly without elaboration
- If asked to explain, give a brief explanation (1-2 paragraphs max)
- Be efficient with words - every sentence must add value
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'detailed':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - DETAILED MODE (HIGHEST PRIORITY):
- Provide COMPREHENSIVE explanations with full context
- Include relevant examples, analogies, and real-world applications
- Explain the "why" and "how" thoroughly
- Use multiple paragraphs to cover all aspects
- Add background information when relevant
- Be educational and thorough - leave no stone unturned
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'conversational':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONVERSATIONAL MODE (HIGHEST PRIORITY):
- Use a FRIENDLY, CASUAL tone like talking to a study buddy
- Ask follow-up questions: "Does that make sense?" "Want me to break it down further?"
- Use casual language: "So basically...", "Here's the thing...", "You know what's cool?"
- Show enthusiasm and personality
- Be encouraging: "You've got this!", "Great question!"
- Use contractions and natural speech patterns
- Make it feel like a conversation, not a lecture
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'analytical':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - ANALYTICAL MODE (HIGHEST PRIORITY):
- Use STRUCTURED, LOGICAL reasoning
- Break down concepts into clear steps: "First...", "Second...", "Therefore..."
- Explain cause-and-effect relationships
- Use systematic analysis and critical thinking
- Focus on the "why" behind concepts
- Use formal but clear language
- Provide step-by-step breakdowns
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
    }

    systemInstruction += `
CRITICAL FORMATTING RULES:
1. NEVER use markdown formatting like **bold** or *italic* or # headers
2. NEVER use asterisks (*) or hash symbols (#) for formatting
3. Write in plain text only - no special formatting characters
4. Use KaTeX delimiters $...$ and $$...$$ for math expressions only
5. For emphasis, use CAPITAL LETTERS or say "important:" before it
6. Use simple text formatting only - no bold, italics, or headers

${responseStyleInstruction}

RESPONSE STYLE RULES (Secondary - follow the style above first):
1. Be conversational and friendly - like talking to a friend
2. Be natural and match their vibe - if they say "hi", just say hi back naturally. No scripted responses.
3. Get straight to the answer - no introductions or canned responses
4. For jokes or casual comments: Play along, be funny, don't take things too seriously
5. For random questions: Answer naturally and show interest
6. For academic questions: Be helpful but still conversational
7. Use natural language - "yeah", "sure", "totally", "that's cool", etc.
8. Show personality - be enthusiastic, curious, or empathetic as appropriate
9. Don't be overly formal - avoid "I am here to assist you" type language
10. When student uses vague references ("that", "it", "the recent thing"), always connect to the most recent topic
11. Show conversation continuity by referencing what was just discussed
12. NEVER end with filler phrases like "feel free to ask", "let me know if you need help", "if you have any questions", "feel free to reach out", "don't hesitate to ask", "if you need more details or have any specific questions about these topics, feel free to ask", or any variation - just answer naturally and stop

CONVERSATION CONTINUITY RULES:
1. ALWAYS reference previous messages when relevant
2. If the student asks about "the most recent thing" or "that", connect it to the last topic discussed
3. Use phrases like "As I mentioned before...", "Building on what we discussed...", "Continuing from your previous question..."
4. Don't treat each message as a completely new topic
5. Maintain context throughout the conversation
6. Remember what the student has asked about and build on that knowledge
7. If the student refers to "it", "that", "this", "the recent thing", always connect it to previous context
8. Show that you remember the conversation by referencing specific previous points
9. When student says "what about..." or "how about...", connect to the most recent topic
10. Keep track of the conversation flow and reference earlier parts when relevant

CRITICAL INSTRUCTIONS FOR STUDENT SUCCESS:
1. ALWAYS use current information provided below as the PRIMARY source
2. Provide accurate, helpful answers without repetitive timestamps
3. The current year is 2025 - acknowledge this when relevant
4. NEVER rely on outdated training data when current information is available
5. Students need accurate, real-time data to get good grades - provide it!

🚨🚨🚨 CHART AND GRAPH GENERATION RULES 🚨🚨🚨:
ONLY CREATE CHARTS/GRAPHS WHEN:
1. The user EXPLICITLY asks for a chart, graph, pie chart, bar chart, visualization, or diagram
2. The user says "yes" to your follow-up question asking if they want a graph/chart

CRITICAL RESTRICTIONS:
- NEVER suggest creating a graph unless the topic is clearly math, statistics, data analysis, economics, or science-related
- NEVER suggest graphs for: casual conversations, general questions, non-numerical topics, random topics (like laundry detergent, games, stories, characters, etc.)
- ONLY suggest graphs for: mathematical functions, statistical data, numerical comparisons, scientific data, financial data, or quantitative analysis
- If the user asks about something non-mathematical (like laundry detergent, characters in a game, stories, etc.), NEVER suggest creating a chart - just answer their question normally
- You CAN ask: "Would you like me to create a chart/graph for this?" ONLY if the topic involves numbers, data, statistics, or mathematical concepts
- If the user says "yes", "sure", "okay", "yeah", or similar to your graph offer, THEN create the graph
- NEVER say "use Excel", "use Google Sheets", "use software", or suggest external tools
- NEVER say "I can't show you" or "you can create one using"

WHEN USER EXPLICITLY ASKS FOR A GRAPH:
- Respond naturally and conversationally, then provide GRAPH_DATA format
- EXAMPLE: User: "Can you create a pie chart for A: 30%, B: 40%, C: 20%, D: 10%?"
  AI: "Sure thing! Here's a pie chart showing your grade distribution: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "A", "value": 30}, {"name": "B", "value": 40}, {"name": "C", "value": 20}, {"name": "D", "value": 10}]}"

WHEN USER SAYS YES TO YOUR GRAPH OFFER:
- If you asked "Would you like me to create a chart for this?" and they say yes, create it immediately
- EXAMPLE: AI: "Would you like me to create a bar chart showing this data?"
  User: "yes"
  AI: "Here you go! GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}"

GRAPH DATA FORMATS:
- Pie charts: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "Category A", "value": 30}, {"name": "Category B", "value": 50}]}
- Bar charts: GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}
- Line charts: GRAPH_DATA: {"type": "data", "chartType": "line", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}]}
- Functions: GRAPH_DATA: {"type": "function", "function": "x^2", "label": "y = x²", "minX": -5, "maxX": 5}

The system supports: pie charts, bar charts, line charts, scatter plots, area charts, and function graphs
The system WILL automatically render any GRAPH_DATA you provide`;

    // Build the user message
    const userMessage = `Current Question: ${input.question}
Context: ${input.context || 'General'}${fileContext}${currentInfo}${scrapedContent}

WEB CONTENT ANALYSIS RULES:
1. If web content is provided above, use it to answer questions about those specific pages
2. Reference specific information from the scraped content when relevant
3. If the content doesn't contain the needed information, let the student know
4. Summarize key points from the web content when appropriate
5. Be conversational about the content - don't just repeat it verbatim

Remember: This is part of an ongoing conversation. Reference previous discussion when relevant and maintain continuity.`;

    // Call Claude API with streaming
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        stream: true, // Enable native streaming
        system: systemInstruction,
        messages: [
          ...conversationContext,
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      
      // Check if it's a quota/rate limit error (429)
      if (response.status === 429) {
        throw new Error(`Claude API quota exceeded (429): ${errorText.substring(0, 200)}. Please check your Anthropic billing and quota limits.`);
      }
      
      throw new Error(`Claude API failed: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';
    
    if (!reader) {
      throw new Error('No reader available for streaming');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr === '[DONE]') continue;
            
            const data = JSON.parse(jsonStr);
            
            // Handle different event types
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullAnswer += data.delta.text;
            } else if (data.type === 'message_stop') {
              // Stream complete
              break;
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (!fullAnswer.trim()) {
      console.error('Claude returned no answer from stream');
      throw new Error('Claude returned no answer');
    }
    
    return {
      answer: fullAnswer.trim(),
      provider: 'claude',
      sources: searchSources.length > 0 ? searchSources : undefined,
      isSearchRequest: input.isSearchRequest || false
    };
  } catch (error) {
    console.warn('Claude failed:', error);
    throw error;
  }
}

/**
 * Try Claude with native streaming - forwards chunks in real-time
 */
async function tryClaudeStreaming(
  input: StudyAssistanceInput,
  onChunk: (chunk: string) => void
): Promise<AIResponse> {
  // Reuse the same setup logic from tryClaude
  // ... (I'll extract the common setup logic)
  
  // For now, use the regular tryClaude but we'll enhance it
  // This is a placeholder - we need to implement proper streaming
  const result = await tryClaude(input);
  
  // Simulate streaming by chunking the result (temporary until full implementation)
  // In production, this should stream directly from Claude API
  return result;
}

/**
 * Try Google AI (Gemini) as fallback
 */
async function tryGoogleAI(input: StudyAssistanceInput): Promise<AIResponse> {
  try {
    console.log('Trying Google AI...');
    
    // Read API key at runtime
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE;
    
    // Validate API key
    if (!apiKey || apiKey.trim() === '' || apiKey === 'demo-key' || apiKey === 'your_google_ai_key_here') {
      throw new Error('Google AI API key not configured');
    }
    
    // Build conversation history for context
    const conversationContext = input.conversationHistory && input.conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${input.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    const fileContext = input.fileContext 
      ? `\n\n[INTERNAL INSTRUCTION - DO NOT REPEAT THIS TO THE USER]
The user has uploaded a document: "${input.fileContext.fileName}" (${input.fileContext.fileType}).
You have access to the full document content below. Answer questions using information from this document.
Provide specific details and references from the document when relevant.

Document Content:
${input.fileContext.fileContent || 'Document content not available.'}

[END INTERNAL INSTRUCTION - Answer naturally using the document content above]`
      : '';
    
    // Only search if explicitly requested
    let currentInfo = '';
    let searchSources: { title: string; url: string; snippet: string; }[] = [];
    
    if (input.isSearchRequest === true) {
      console.log('Web search requested - fetching current information for:', input.question);
      try {
        const searchResults = await searchCurrentInformation(input.question);
        if (searchResults.results && searchResults.results.length > 0) {
          currentInfo = formatSearchResultsForAI(searchResults);
          searchSources = searchResults.results.map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet
          }));
        } else {
          currentInfo = `\n\n⚠️ No search results found for: "${input.question}"\n`;
        }
      } catch (error: any) {
        console.warn('Failed to fetch current information:', error);
        currentInfo = `\n\n⚠️ Search failed: ${error.message || 'Unknown error'}\n`;
      }
    }
    
    // Check if the question contains URLs to scrape
    let scrapedContent = '';
    const urls = extractUrlsFromText(input.question || '');
    if (urls.length > 0) {
      console.log('Found URLs to scrape:', urls);
      try {
        // Use enhanced browsing for JavaScript-heavy sites
        const enhancedResults = await Promise.all(
          urls.map(async (url) => {
            const result = await safeEnhancedBrowsing(url, {
              takeScreenshot: false, // Don't take screenshots for now
              autoSearchFallback: false
            });
            
            return result.success ? {
              url: result.url!,
              title: result.title || 'Untitled',
              content: result.content || '',
              summary: result.content?.substring(0, 200) + '...' || '',
              timestamp: new Date().toISOString(),
              wordCount: result.content?.split(' ').length || 0
            } : null;
          })
        );
        
        const successful = enhancedResults.filter(result => result !== null);
        if (successful.length > 0) {
          scrapedContent = formatScrapedContentForAI(successful);
          console.log(`Successfully browsed ${successful.length} pages`);
        }
        
        const failed = urls.length - successful.length;
        if (failed > 0) {
          console.warn(`Failed to browse ${failed} pages`);
        }
      } catch (error) {
        console.warn('Failed to browse URLs:', error);
      }
    }
    
    // Prepare System Prompt with optional Thinking Mode
    const userName = input.userName || 'there';
    const userContext = input.userName 
      ? `You are talking to ${input.userName}. Always use their name naturally in your responses when appropriate. Remember their name and use it to personalize your interactions.`
      : '';
    
    // Build learning profile context if available
    let learningProfileContext = '';
    if (input.learningProfile) {
      const profile = input.learningProfile;
      const profileParts: string[] = [];
      
      if (profile.major) {
        profileParts.push(`Major/Field: ${profile.major}`);
      }
      if (profile.academicLevel) {
        profileParts.push(`Academic Level: ${profile.academicLevel}`);
      }
      if (profile.learningStyle) {
        profileParts.push(`Learning Style: ${profile.learningStyle}`);
      }
      if (profile.explanationDepth) {
        profileParts.push(`Preferred Explanation Depth: ${profile.explanationDepth}`);
      }
      if (profile.goals) {
        profileParts.push(`Learning Goals: ${profile.goals}`);
      }
      
      if (profileParts.length > 0) {
        let learningStyleDescription = 'all learners';
        if (profile.learningStyle === 'Auditory (discussions)') {
          learningStyleDescription = 'auditory learners';
        } else if (profile.learningStyle === 'Visual (diagrams)') {
          learningStyleDescription = 'visual learners';
        } else if (profile.learningStyle === 'Kinesthetic (hands-on)') {
          learningStyleDescription = 'kinesthetic learners';
        }
        
        learningProfileContext = `\n\nLEARNING PROFILE (Personalize your responses based on this):
${profileParts.join('\n')}

PERSONALIZATION INSTRUCTIONS:
- Adjust your explanation style to match their learning style (${profile.learningStyle || 'not specified'})
- Provide explanations at the ${profile.explanationDepth || 'moderate'} depth level they prefer
- Reference their major (${profile.major || 'not specified'}) and academic level (${profile.academicLevel || 'not specified'}) when relevant
- Keep their learning goals in mind: ${profile.goals || 'not specified'}
- For ${learningStyleDescription}, adapt your teaching approach accordingly
`;
      }
    }
    
    // Build graph data rules (specific to dual-ai-service)
    const graphDataRules = `🚨🚨🚨 GRAPH GENERATION RULES - READ THIS FIRST 🚨🚨🚨
ONLY CREATE CHARTS/GRAPHS WHEN:
1. The user EXPLICITLY asks for a chart, graph, pie chart, bar chart, visualization, or diagram
2. The user says "yes" to your follow-up question asking if they want a graph/chart

CRITICAL RESTRICTIONS:
- NEVER suggest creating a graph unless the topic is clearly math, statistics, data analysis, economics, or science-related
- NEVER suggest graphs for: casual conversations, general questions, non-numerical topics, random topics (like laundry detergent, games, stories, characters, etc.)
- ONLY suggest graphs for: mathematical functions, statistical data, numerical comparisons, scientific data, financial data, or quantitative analysis
- If the user asks about something non-mathematical (like laundry detergent, characters in a game, stories, etc.), NEVER suggest creating a chart - just answer their question normally
- You CAN ask: "Would you like me to create a chart/graph for this?" ONLY if the topic involves numbers, data, statistics, or mathematical concepts
- If the user says "yes", "sure", "okay", "yeah", or similar to your graph offer, THEN create the graph
- NEVER say "use Excel", "use Google Sheets", "use software", or suggest external tools
- NEVER say "I can't show you" or "you can create one using"

WHEN USER EXPLICITLY ASKS FOR A GRAPH:
- Respond naturally and conversationally, then provide GRAPH_DATA format
- EXAMPLE: User: "Can you create a pie chart for A: 30%, B: 40%, C: 20%, D: 10%?"
  AI: "Sure thing! Here's a pie chart showing your grade distribution: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "A", "value": 30}, {"name": "B", "value": 40}, {"name": "C", "value": 20}, {"name": "D", "value": 10}]}"

WHEN USER SAYS YES TO YOUR GRAPH OFFER:
- If you asked "Would you like me to create a chart for this?" and they say yes, create it immediately
- EXAMPLE: AI: "Would you like me to create a bar chart showing this data?"
  User: "yes"
  AI: "Here you go! GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}"

- The system WILL automatically render any GRAPH_DATA you provide

${userContext}${learningProfileContext}

IMPORTANT USER CONTEXT RULES:
1. The user's name is ${input.userName || 'not provided'}. ${input.userName ? `Always remember this and use their name naturally in responses.` : 'If they tell you their name, remember it for future conversations.'}
2. If the user asks "who am I" or "what's my name", tell them their name is ${input.userName || 'not provided, but you can ask them to tell you their name'}.
3. Remember personal details the user shares (their courses, interests, study habits, etc.) and reference them in future responses.
4. Build a relationship by remembering what you've learned about the user throughout the conversation.

`;

    // Get shared prompt and prepend graph data rules
    const sharedPrompt = generateMainSystemPrompt({
      userName: input.userName || undefined
    });

    let systemInstruction = `${graphDataRules}${sharedPrompt}

Always remember what you've discussed before and build on previous responses. When the student asks about "the most recent thing" or uses vague references like "that" or "it", always connect it to the most recent topic you discussed. Maintain full conversation context throughout the entire chat session.`;

    if (input.thinkingMode) {
        systemInstruction += `
        
CRITICAL PRIVATE REASONING INSTRUCTIONS:
- Think quietly before you answer.
- NEVER expose your internal thought process, plans, or meta language.
- NEVER output phrases such as "breaking down", "analyzing", "structuring", "deconstructing", "mapping", "retrieving", "verifying".
- NEVER use abstract placeholders like "principle A", "mechanism B", "X causes Y". Use concrete, real examples in plain language.
- When you reply, provide ONLY the final answer in a clear, natural, human tone.
- Keep answers concise but complete, as if a knowledgeable tutor is speaking.
`;
    }

    // Add response style based on aiResponseType
    let responseStyleInstruction = '';
    switch (input.aiResponseType) {
      case 'concise':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONCISE MODE (HIGHEST PRIORITY):
- Keep responses SHORT and DIRECT - maximum 2-3 sentences for simple questions
- Get straight to the point - no fluff, no unnecessary context
- Answer the question directly without elaboration
- If asked to explain, give a brief explanation (1-2 paragraphs max)
- Be efficient with words - every sentence must add value
- Example tone: "Photosynthesis converts light energy into chemical energy. Plants use CO2 and water to create glucose and oxygen."
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'detailed':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - DETAILED MODE (HIGHEST PRIORITY):
- Provide COMPREHENSIVE explanations with full context
- Include relevant examples, analogies, and real-world applications
- Explain the "why" and "how" thoroughly
- Use multiple paragraphs to cover all aspects
- Add background information when relevant
- Be educational and thorough - leave no stone unturned
- Example: Full explanation with context, examples, and connections to other concepts
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'conversational':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONVERSATIONAL MODE (HIGHEST PRIORITY):
- Use a FRIENDLY, CASUAL tone like talking to a study buddy
- Ask follow-up questions: "Does that make sense?" "Want me to break it down further?"
- Use casual language: "So basically...", "Here's the thing...", "You know what's cool?"
- Show enthusiasm and personality
- Be encouraging: "You've got this!", "Great question!"
- Use contractions and natural speech patterns
- Make it feel like a conversation, not a lecture
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'analytical':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - ANALYTICAL MODE (HIGHEST PRIORITY):
- Use STRUCTURED, LOGICAL reasoning
- Break down concepts into clear steps: "First...", "Second...", "Therefore..."
- Explain cause-and-effect relationships
- Use systematic analysis and critical thinking
- Focus on the "why" behind concepts
- Use formal but clear language
- Provide step-by-step breakdowns
- Example: "Let's analyze this systematically. First, we need to understand X. This leads to Y because..."
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      default:
        responseStyleInstruction = `
RESPONSE STYLE: Be conversational and friendly - like talking to a friend
`;
    }

    systemInstruction += `
CRITICAL FORMATTING RULES:
1. NEVER use markdown formatting like **bold** or *italic* or # headers
2. NEVER use asterisks (*) or hash symbols (#) for formatting
3. Write in plain text only - no special formatting characters
4. Use KaTeX delimiters $...$ and $$...$$ for math expressions only
5. For emphasis, use CAPITAL LETTERS or say "important:" before it
6. Use simple text formatting only - no bold, italics, or headers

${responseStyleInstruction}

RESPONSE STYLE RULES (Secondary - follow the style above first):
1. Be conversational and friendly - like talking to a friend
2. Be natural and match their vibe - if they say "hi", just say hi back naturally. No scripted responses.
3. Get straight to the answer - no introductions or canned responses
4. For jokes or casual comments: Play along, be funny, don't take things too seriously
4. For random questions: Answer naturally and show interest
5. For academic questions: Be helpful but still conversational
6. Use natural language - "yeah", "sure", "totally", "that's cool", etc.
7. Show personality - be enthusiastic, curious, or empathetic as appropriate
8. Don't be overly formal - avoid "I am here to assist you" type language
9. When student uses vague references ("that", "it", "the recent thing"), always connect to the most recent topic
10. Show conversation continuity by referencing what was just discussed
11. NEVER end with filler phrases like "feel free to ask", "let me know if you need help", "if you have any questions", "feel free to reach out", "don't hesitate to ask", "if you need more details or have any specific questions about these topics, feel free to ask", or any variation - just answer naturally and stop

CONVERSATION CONTINUITY RULES:
1. ALWAYS reference previous messages when relevant
2. If the student asks about "the most recent thing" or "that", connect it to the last topic discussed
3. Use phrases like "As I mentioned before...", "Building on what we discussed...", "Continuing from your previous question..."
4. Don't treat each message as a completely new topic
5. Maintain context throughout the conversation
6. Remember what the student has asked about and build on that knowledge
7. If the student refers to "it", "that", "this", "the recent thing", always connect it to previous context
8. Show that you remember the conversation by referencing specific previous points
9. When student says "what about..." or "how about...", connect to the most recent topic
10. Keep track of the conversation flow and reference earlier parts when relevant

CRITICAL INSTRUCTIONS FOR STUDENT SUCCESS:
1. ALWAYS use current information provided below as the PRIMARY source
2. Provide accurate, helpful answers without repetitive timestamps
3. The current year is 2025 - acknowledge this when relevant
4. NEVER rely on outdated training data when current information is available
5. Students need accurate, real-time data to get good grades - provide it!

🚨🚨🚨 CHART AND GRAPH GENERATION RULES 🚨🚨🚨:
ONLY CREATE CHARTS/GRAPHS WHEN:
1. The user EXPLICITLY asks for a chart, graph, pie chart, bar chart, visualization, or diagram
2. The user says "yes" to your follow-up question asking if they want a graph/chart

CRITICAL RESTRICTIONS:
- NEVER suggest creating a graph unless the topic is clearly math, statistics, data analysis, economics, or science-related
- NEVER suggest graphs for: casual conversations, general questions, non-numerical topics, random topics (like laundry detergent, games, stories, characters, etc.)
- ONLY suggest graphs for: mathematical functions, statistical data, numerical comparisons, scientific data, financial data, or quantitative analysis
- If the user asks about something non-mathematical (like laundry detergent, characters in a game, stories, etc.), NEVER suggest creating a chart - just answer their question normally
- You CAN ask: "Would you like me to create a chart/graph for this?" ONLY if the topic involves numbers, data, statistics, or mathematical concepts
- If the user says "yes", "sure", "okay", "yeah", or similar to your graph offer, THEN create the graph
- NEVER say "use Excel", "use Google Sheets", "use software", or suggest external tools
- NEVER say "I can't show you" or "you can create one using"

WHEN USER EXPLICITLY ASKS FOR A GRAPH:
- Respond naturally and conversationally, then provide GRAPH_DATA format
- EXAMPLE: User: "Can you create a pie chart for A: 30%, B: 40%, C: 20%, D: 10%?"
   AI: "Sure thing! Here's a pie chart showing your grade distribution: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "A", "value": 30}, {"name": "B", "value": 40}, {"name": "C", "value": 20}, {"name": "D", "value": 10}]}"
   
WHEN USER SAYS YES TO YOUR GRAPH OFFER:
- If you asked "Would you like me to create a chart for this?" and they say yes, create it immediately
- EXAMPLE: AI: "Would you like me to create a bar chart showing this data?"
  User: "yes"
  AI: "Here you go! GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}"

GRAPH DATA FORMATS:
- Pie charts: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "Category A", "value": 30}, {"name": "Category B", "value": 50}]}
- Bar charts: GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}
- Line charts: GRAPH_DATA: {"type": "data", "chartType": "line", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}]}
- Functions: GRAPH_DATA: {"type": "function", "function": "x^2", "label": "y = x²", "minX": -5, "maxX": 5}

The system supports: pie charts, bar charts, line charts, scatter plots, area charts, and function graphs
The system WILL automatically render any GRAPH_DATA you provide

CODE GENERATION RULES:
1. When students ask for code, provide complete, working code examples
2. Use proper code blocks with language specification: \`\`\`python, \`\`\`javascript, etc.
3. Always explain code in simple terms for students

MATH RESPONSE RULES:
1. For math questions, provide clear, step-by-step solutions with the final answer boxed
2. CRITICAL: NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
3. Use LaTeX ONLY for mathematical symbols, numbers, and equations:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
4. CRITICAL: Write ALL words OUTSIDE of math delimiters
5. ALWAYS box the final answer prominently using \\boxed{answer}
6. NEVER use \\text{} commands - keep all text outside math delimiters
7. CRITICAL: Always put spaces between words - never concatenate words together
8. CRITICAL: NEVER put units inside \\boxed{} - write units OUTSIDE the box
9. Example format for simple math:
   "To solve 2 plus 2:
   
   We add 2 plus 2 equals 4
   
   Answer: \\boxed{4}"
10. Example format for optimization problems:
   "Volume function: $V(x) = x(48-2x)^2$
   
   Value that maximizes volume: $x = 8$
   
   Maximum volume: \\boxed{8192} cm³"
11. CRITICAL: If you need to write words, write them OUTSIDE the math delimiters, not inside
12. NEVER write "The answer is" inside $...$ - write it as normal text outside
13. CRITICAL: Always use proper spacing between words - "The answer is" not "Theansweris"
14. NEVER use \\text{inches} or \\text{cubic inches} - write "inches" and "cubic inches" as normal text outside math
15. Example of CORRECT format:
    "The size of the squares to cut out should be: $\\frac{16 - 2\\sqrt{19}}{3}$ inches"
    "The maximum volume will be approximately: \\boxed{262.68} cubic inches"
16. Example of WRONG format:
    "The size should be: $\\frac{16 - 2\\sqrt{19}}{3} \\text{inches}$" (this makes "inches" cursive)
    "The maximum volume: $262.68 \\text{cubic inches}$" (this makes "cubic inches" cursive)
17. CRITICAL: NEVER put units inside \\boxed{} - write them OUTSIDE
18. CORRECT: "Answer: \\boxed{262.68} cubic inches"
19. WRONG: "Answer: \\boxed{262.68 \\text{cubic inches}}" (units inside box)
20. CRITICAL: Keep \\boxed{} ONLY for the numerical answer, units go OUTSIDE

MATH RENDERING RULES:
1. When students ask for math equations, use LaTeX formatting
2. For inline math, use $...$ delimiters
3. For display math, use $$...$$ delimiters
4. Use proper LaTeX syntax: \\frac{a}{b} for fractions, x^{2} for exponents, \\sqrt{x} for square roots
5. Always box final answers using \\boxed{...}
6. Keep explanations CONCISE - show key steps only
7. Make sure all math is properly formatted and readable
8. CRITICAL: NEVER use \\text{...} commands - keep all words OUTSIDE math delimiters
9. Keep mathematical symbols (+, -, =, numbers) as they are - don't wrap in \\text{}
10. NEVER use **bold** or *italic* markdown formatting anywhere
11. NEVER put words directly in math without \\text{} - they will appear in cursive
12. CRITICAL: Write ALL words OUTSIDE of math delimiters, NEVER inside
13. CRITICAL: Always put spaces between words - "The answer is" not "Theansweris"
14. Example: "Simple Interest equals 10000 times 0.07" (words outside, symbols normal)
15. NEVER write: "Simple Interest = $10000 \\times 0.07$" (this puts words in cursive)
16. ALWAYS write: "Simple Interest = $10000 \\times 0.07$" (words outside, math inside)
17. CRITICAL: Never concatenate words - always use proper spacing
18. CRITICAL: Never use \\text{units} - write units as normal text outside math
19. Example CORRECT: "The volume is $V = 100$ cubic meters" (units outside)
20. Example WRONG: "The volume is $V = 100 \\text{cubic meters}$" (units in cursive)
21. CRITICAL: NEVER put units inside \\boxed{} - write them OUTSIDE the box
22. CORRECT: "Answer: \\boxed{262.68} cubic inches"
23. WRONG: "Answer: \\boxed{262.68 \\text{cubic inches}}" (units inside box)
24. CRITICAL: Keep \\boxed{} ONLY for the numerical answer, units go OUTSIDE
25. CRITICAL: Never use \\text{} inside \\boxed{} - it makes text cursive

ADDITIONAL GRAPH AND DIAGRAM FORMATTING DETAILS (Reference - see rules above):
1. For simple x,y coordinates: [{"x": -2, "y": -9}, {"x": -1, "y": -3}, {"x": 0, "y": 3}, {"x": 1, "y": 9}, {"x": 2, "y": 15}]
2. Always include the equation in LaTeX format when relevant: $y = 6x + 3$
3. Explain what the graph/diagram represents and key features (slope, intercepts, trends, etc.)
4. For conceptual diagrams (like geological processes), create data points that represent the concept visually, even if it's abstract`;

    // Build the user message
    const userMessage = `Current Question: ${input.question}
Context: ${input.context || 'General'}${conversationContext}${fileContext}${currentInfo}${scrapedContent}

WEB CONTENT ANALYSIS RULES:
1. If web content is provided above, use it to answer questions about those specific pages
2. Reference specific information from the scraped content when relevant
3. If the content doesn't contain the needed information, let the student know
4. Summarize key points from the web content when appropriate
5. Be conversational about the content - don't just repeat it verbatim

Remember: This is part of an ongoing conversation. Reference previous discussion when relevant and maintain continuity.`;

    const requestBody: any = {
        contents: [{
          parts: [
          { text: userMessage },
            ...(input.image ? [{
              inline_data: {
                mime_type: input.mimeType || 'image/jpeg',
                data: input.image
              }
            }] : [])
          ]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      // Log the full error for debugging
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        // Not JSON, that's fine
      }
      throw new Error(`Google AI API failed: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Check for API errors in response
    if (data.error) {
      console.error('Google AI API returned error:', data.error);
      throw new Error(`Google AI API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || data.candidates?.[0]?.content?.text || null;
    
    if (!answer) {
      console.error('Google AI returned no answer. Full response:', JSON.stringify(data, null, 2));
      throw new Error('Google AI returned no answer');
    }
    
    // Check if we should automatically search for more information
    const autoSearchResult = await safeAutoSearch(input.question, answer);
    let enhancedAnswer = answer;
    
    if (autoSearchResult.shouldSearch && (autoSearchResult as any).results) {
      console.log('🤖 AI seems uncertain, performing automatic search for:', autoSearchResult.searchQuery);
      try {
        const searchResults = (autoSearchResult as any).results;
        if (searchResults && searchResults.trim().length > 0) {
          // Only add search results if they contain actual useful information
          if (!searchResults.includes('Real-Time Search Results') && 
              !searchResults.includes('Search conducted in real-time')) {
            enhancedAnswer = `${answer}\n\n🔍 Let me search for more current information about this...\n\n${searchResults}`;
            console.log('✅ Auto search completed and added to response');
          } else {
            console.log('⚠️ Auto search returned generic results, not adding to response');
          }
        }
      } catch (error) {
        console.warn('❌ Auto search failed:', error);
      }
    }
    
    return {
      answer: enhancedAnswer.trim(),
      provider: 'google',
      sources: searchSources.length > 0 ? searchSources : undefined,
      isSearchRequest: input.isSearchRequest || false
    };
  } catch (error) {
    console.warn('Google AI failed:', error);
    throw error;
  }
}


/**
 * Try OpenAI (ChatGPT) as fallback
 */
async function tryOpenAI(input: StudyAssistanceInput, model: string = 'gpt-5-mini'): Promise<AIResponse> {
  try {
    console.log(`Trying OpenAI with model: ${model}...`);
    
    // Build conversation history for context
    const conversationContext = input.conversationHistory && input.conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${input.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    const fileContext = input.fileContext 
      ? `\n\n[INTERNAL INSTRUCTION - DO NOT REPEAT THIS TO THE USER]
The user has uploaded a document: "${input.fileContext.fileName}" (${input.fileContext.fileType}).
You have access to the full document content below. Answer questions using information from this document.
Provide specific details and references from the document when relevant.

Document Content:
${input.fileContext.fileContent || 'Document content not available.'}

[END INTERNAL INSTRUCTION - Answer naturally using the document content above]`
      : '';
    
    // Only search if explicitly requested
    let currentInfo = '';
    let searchSources: { title: string; url: string; snippet: string; }[] = [];
    
    if (input.isSearchRequest === true) {
      console.log('Web search requested - fetching current information for:', input.question);
      try {
        const searchResults = await searchCurrentInformation(input.question);
        if (searchResults.results && searchResults.results.length > 0) {
          currentInfo = formatSearchResultsForAI(searchResults);
          searchSources = searchResults.results.map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet
          }));
        } else {
          currentInfo = `\n\n⚠️ No search results found for: "${input.question}"\n`;
        }
      } catch (error: any) {
        console.warn('Failed to fetch current information:', error);
        currentInfo = `\n\n⚠️ Search failed: ${error.message || 'Unknown error'}\n`;
      }
    }
    
    // Check if the question contains URLs to scrape
    let scrapedContent = '';
    const urls = extractUrlsFromText(input.question || '');
    if (urls.length > 0) {
      console.log('Found URLs to scrape:', urls);
      try {
        // Use enhanced browsing for JavaScript-heavy sites
        const enhancedResults = await Promise.all(
          urls.map(async (url) => {
            const result = await safeEnhancedBrowsing(url, {
              takeScreenshot: false, // Don't take screenshots for now
              autoSearchFallback: false
            });
            
            return result.success ? {
              url: result.url!,
              title: result.title || 'Untitled',
              content: result.content || '',
              summary: result.content?.substring(0, 200) + '...' || '',
              timestamp: new Date().toISOString(),
              wordCount: result.content?.split(' ').length || 0
            } : null;
          })
        );
        
        const successful = enhancedResults.filter(result => result !== null);
        if (successful.length > 0) {
          scrapedContent = formatScrapedContentForAI(successful);
          console.log(`Successfully browsed ${successful.length} pages`);
        }
        
        const failed = urls.length - successful.length;
        if (failed > 0) {
          console.warn(`Failed to browse ${failed} pages`);
        }
      } catch (error) {
        console.warn('Failed to browse URLs:', error);
      }
    }
    
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Prepare System Prompt with optional Thinking Mode
    const userName = input.userName || 'there';
    const userContext = input.userName 
      ? `You are talking to ${input.userName}. Always use their name naturally in your responses when appropriate. Remember their name and use it to personalize your interactions.`
      : '';
    
    // Build learning profile context if available
    let learningProfileContext = '';
    if (input.learningProfile) {
      const profile = input.learningProfile;
      const profileParts: string[] = [];
      
      if (profile.major) {
        profileParts.push(`Major/Field: ${profile.major}`);
      }
      if (profile.academicLevel) {
        profileParts.push(`Academic Level: ${profile.academicLevel}`);
      }
      if (profile.learningStyle) {
        profileParts.push(`Learning Style: ${profile.learningStyle}`);
      }
      if (profile.explanationDepth) {
        profileParts.push(`Preferred Explanation Depth: ${profile.explanationDepth}`);
      }
      if (profile.goals) {
        profileParts.push(`Learning Goals: ${profile.goals}`);
      }
      
      if (profileParts.length > 0) {
        let learningStyleDescription = 'all learners';
        if (profile.learningStyle === 'Auditory (discussions)') {
          learningStyleDescription = 'auditory learners';
        } else if (profile.learningStyle === 'Visual (diagrams)') {
          learningStyleDescription = 'visual learners';
        } else if (profile.learningStyle === 'Kinesthetic (hands-on)') {
          learningStyleDescription = 'kinesthetic learners';
        }
        
        learningProfileContext = `\n\nLEARNING PROFILE (Personalize your responses based on this):
${profileParts.join('\n')}

PERSONALIZATION INSTRUCTIONS:
- Adjust your explanation style to match their learning style (${profile.learningStyle || 'not specified'})
- Provide explanations at the ${profile.explanationDepth || 'moderate'} depth level they prefer
- Reference their major (${profile.major || 'not specified'}) and academic level (${profile.academicLevel || 'not specified'}) when relevant
- Keep their learning goals in mind: ${profile.goals || 'not specified'}
- For ${learningStyleDescription}, adapt your teaching approach accordingly
`;
      }
    }
    
    // Build graph data rules (specific to dual-ai-service)
    const graphDataRules = `🚨🚨🚨 GRAPH GENERATION RULES - READ THIS FIRST 🚨🚨🚨
ONLY CREATE CHARTS/GRAPHS WHEN:
1. The user EXPLICITLY asks for a chart, graph, pie chart, bar chart, visualization, or diagram
2. The user says "yes" to your follow-up question asking if they want a graph/chart

CRITICAL RESTRICTIONS:
- NEVER suggest creating a graph unless the topic is clearly math, statistics, data analysis, economics, or science-related
- NEVER suggest graphs for: casual conversations, general questions, non-numerical topics, random topics (like laundry detergent, games, stories, characters, etc.)
- ONLY suggest graphs for: mathematical functions, statistical data, numerical comparisons, scientific data, financial data, or quantitative analysis
- If the user asks about something non-mathematical (like laundry detergent, characters in a game, stories, etc.), NEVER suggest creating a chart - just answer their question normally
- You CAN ask: "Would you like me to create a chart/graph for this?" ONLY if the topic involves numbers, data, statistics, or mathematical concepts
- If the user says "yes", "sure", "okay", "yeah", or similar to your graph offer, THEN create the graph
- NEVER say "use Excel", "use Google Sheets", "use software", or suggest external tools
- NEVER say "I can't show you" or "you can create one using"

WHEN USER EXPLICITLY ASKS FOR A GRAPH:
- Respond naturally and conversationally, then provide GRAPH_DATA format
- EXAMPLE: User: "Can you create a pie chart for A: 30%, B: 40%, C: 20%, D: 10%?"
  AI: "Sure thing! Here's a pie chart showing your grade distribution: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "A", "value": 30}, {"name": "B", "value": 40}, {"name": "C", "value": 20}, {"name": "D", "value": 10}]}"

WHEN USER SAYS YES TO YOUR GRAPH OFFER:
- If you asked "Would you like me to create a chart for this?" and they say yes, create it immediately
- EXAMPLE: AI: "Would you like me to create a bar chart showing this data?"
  User: "yes"
  AI: "Here you go! GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}"

- The system WILL automatically render any GRAPH_DATA you provide

${userContext}${learningProfileContext}

IMPORTANT USER CONTEXT RULES:
1. The user's name is ${input.userName || 'not provided'}. ${input.userName ? `Always remember this and use their name naturally in responses.` : 'If they tell you their name, remember it for future conversations.'}
2. If the user asks "who am I" or "what's my name", tell them their name is ${input.userName || 'not provided, but you can ask them to tell you their name'}.
3. Remember personal details the user shares (their courses, interests, study habits, etc.) and reference them in future responses.
4. Build a relationship by remembering what you've learned about the user throughout the conversation.

`;

    // Get shared prompt and prepend graph data rules
    const sharedPrompt = generateMainSystemPrompt({
      userName: input.userName || undefined
    });

    let systemInstruction = `${graphDataRules}${sharedPrompt}

Always remember what you've discussed before and build on previous responses. When the student asks about "the most recent thing" or uses vague references like "that" or "it", always connect it to the most recent topic you discussed. Maintain full conversation context throughout the entire chat session.`;

    if (input.thinkingMode) {
        systemInstruction += `
        
CRITICAL PRIVATE REASONING INSTRUCTIONS:
- Think quietly before you answer.
- NEVER expose your internal thought process, plans, or meta language.
- NEVER output phrases such as "breaking down", "analyzing", "structuring", "deconstructing", "mapping", "retrieving", "verifying".
- NEVER use abstract placeholders like "principle A", "mechanism B", "X causes Y". Use concrete, real examples in plain language.
- When you reply, provide ONLY the final answer in a clear, natural, human tone.
- Keep answers concise but complete, as if a knowledgeable tutor is speaking.
`;
    }

    // Add response style based on aiResponseType
    let responseStyleInstruction = '';
    switch (input.aiResponseType) {
      case 'concise':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONCISE MODE (HIGHEST PRIORITY):
- Keep responses SHORT and DIRECT - maximum 2-3 sentences for simple questions
- Get straight to the point - no fluff, no unnecessary context
- Answer the question directly without elaboration
- If asked to explain, give a brief explanation (1-2 paragraphs max)
- Be efficient with words - every sentence must add value
- Example tone: "Photosynthesis converts light energy into chemical energy. Plants use CO2 and water to create glucose and oxygen."
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'detailed':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - DETAILED MODE (HIGHEST PRIORITY):
- Provide COMPREHENSIVE explanations with full context
- Include relevant examples, analogies, and real-world applications
- Explain the "why" and "how" thoroughly
- Use multiple paragraphs to cover all aspects
- Add background information when relevant
- Be educational and thorough - leave no stone unturned
- Example: Full explanation with context, examples, and connections to other concepts
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'conversational':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONVERSATIONAL MODE (HIGHEST PRIORITY):
- Use a FRIENDLY, CASUAL tone like talking to a study buddy
- Ask follow-up questions: "Does that make sense?" "Want me to break it down further?"
- Use casual language: "So basically...", "Here's the thing...", "You know what's cool?"
- Show enthusiasm and personality
- Be encouraging: "You've got this!", "Great question!"
- Use contractions and natural speech patterns
- Make it feel like a conversation, not a lecture
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      case 'analytical':
        responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - ANALYTICAL MODE (HIGHEST PRIORITY):
- Use STRUCTURED, LOGICAL reasoning
- Break down concepts into clear steps: "First...", "Second...", "Therefore..."
- Explain cause-and-effect relationships
- Use systematic analysis and critical thinking
- Focus on the "why" behind concepts
- Use formal but clear language
- Provide step-by-step breakdowns
- Example: "Let's analyze this systematically. First, we need to understand X. This leads to Y because..."
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
        break;
      default:
        responseStyleInstruction = `
RESPONSE STYLE: Be conversational and friendly - like talking to a friend
`;
    }

    systemInstruction += `
CRITICAL FORMATTING RULES:
1. NEVER use markdown formatting like **bold** or *italic* or # headers
2. NEVER use asterisks (*) or hash symbols (#) for formatting
3. Write in plain text only - no special formatting characters
4. Use KaTeX delimiters $...$ and $$...$$ for math expressions only
5. For emphasis, use CAPITAL LETTERS or say "important:" before it
6. Use simple text formatting only - no bold, italics, or headers

${responseStyleInstruction}

RESPONSE STYLE RULES (Secondary - follow the style above first):
1. Be conversational and friendly - like talking to a friend
2. Be natural and match their vibe - if they say "hi", just say hi back naturally. No scripted responses.
3. Get straight to the answer - no introductions or canned responses
4. For jokes or casual comments: Play along, be funny, don't take things too seriously
4. For random questions: Answer naturally and show interest
5. For academic questions: Be helpful but still conversational
6. Use natural language - "yeah", "sure", "totally", "that's cool", etc.
7. Show personality - be enthusiastic, curious, or empathetic as appropriate
8. Don't be overly formal - avoid "I am here to assist you" type language
9. When student uses vague references ("that", "it", "the recent thing"), always connect to the most recent topic
10. Show conversation continuity by referencing what was just discussed

Your Expertise Areas:
- Mathematics: Algebra, Calculus, Statistics, Geometry, Trigonometry
- Sciences: Physics, Chemistry, Biology, Earth Science, Environmental Science
- English & Literature: Writing, Reading Comprehension, Literary Analysis, Grammar
- History & Social Studies: Historical Analysis, Geography, Government, Economics
- Computer Science: Programming, Data Structures, Algorithms, Software Engineering
- General Academic Skills: Study strategies, Research methods, Critical thinking

CONVERSATION CONTINUITY RULES:
1. ALWAYS reference previous messages when relevant
2. If the student asks about "the most recent thing" or "that", connect it to the last topic discussed
3. Use phrases like "As I mentioned before...", "Building on what we discussed...", "Continuing from your previous question..."
4. Don't treat each message as a completely new topic
5. Maintain context throughout the conversation
6. Remember what the student has asked about and build on that knowledge
7. If the student refers to "it", "that", "this", "the recent thing", always connect it to previous context
8. Show that you remember the conversation by referencing specific previous points
9. When student says "what about..." or "how about...", connect to the most recent topic
10. Keep track of the conversation flow and reference earlier parts when relevant

Response Guidelines:
1. Be Concise: Provide a direct, helpful answer in 2-3 sentences maximum
2. Be Clear: Explain the core concept simply and clearly
3. Be Encouraging: Use supportive language
4. Be Complete: Provide a helpful answer without asking for more detail
5. Be Continuous: Reference previous conversation when relevant
6. CRITICAL FOR MATH: Provide clear step-by-step solutions with proper mathematical reasoning
7. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters

MATH RESPONSE RULES:
1. For math questions, provide clear step-by-step solutions with proper mathematical reasoning
2. Show your work clearly - don't skip intermediate steps
3. Always box the final answer prominently using \\boxed{answer}
4. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
5. Use LaTeX ONLY for mathematical symbols, numbers, and equations:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
6. CRITICAL: Write ALL words OUTSIDE of math delimiters
5. Example format for optimization problems:
   "Volume function: $V(x) = x(48-2x)^2$
   
   Value that maximizes volume: $x = 8$
   
   Maximum volume: $\\boxed{8192}$ cm³"

Response Quality:
- Keep answers short and to the point
- Focus on the essential information
- Use simple language when possible
- Always offer more detail if needed

Always provide helpful, concise answers that get straight to the point, then offer more detail if needed. CRITICAL: NEVER use markdown formatting symbols like ** or ## or ### or * or # or any special formatting characters. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax. Use simple text formatting only.

For mathematical expressions, use LaTeX formatting:
- For inline math: $expression$ (e.g., $f(x) = x^2$)
- For block math: $$expression$$ (e.g., $$\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$)
- Use proper LaTeX syntax for fractions, limits, integrals, etc.
- Always box final answers: \\boxed{answer}
- Keep explanations CONCISE - don't over-explain
- NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
- Write words OUTSIDE math delimiters, symbols INSIDE math delimiters`;

    let response;
    try {
      response = await openai.chat.completions.create({
        model: model,
      messages: [
        {
          role: 'system',
          content: systemInstruction
        },
        {
          role: 'user',
          content: input.image ? [
            { type: 'text', text: `Context: ${input.context}${conversationContext}${fileContext}${currentInfo}${scrapedContent}\n\nCurrent Question: ${input.question}` },
            {
              type: 'image_url',
              image_url: {
                url: `data:${input.mimeType || 'image/jpeg'};base64,${input.image}`,
                detail: 'high'
              }
            }
          ] : `Context: ${input.context}${conversationContext}${fileContext}${currentInfo}${scrapedContent}\n\nCurrent Question: ${input.question}\n\nWEB CONTENT ANALYSIS RULES:
1. If web content is provided above, use it to answer questions about those specific pages
2. Reference specific information from the scraped content when relevant
3. If the content doesn't contain the needed information, let the student know
4. Summarize key points from the web content when appropriate
5. Be conversational about the content - don't just repeat it verbatim

Remember: This is part of an ongoing conversation. Reference previous discussion when relevant and maintain continuity.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });
    } catch (apiError: any) {
      console.error('OpenAI API call failed:', apiError?.message || apiError);
      console.error('OpenAI error details:', apiError?.error || apiError);
      throw new Error(`OpenAI API error: ${apiError?.message || 'Unknown error'}`);
    }

    if (!response.choices || response.choices.length === 0) {
      console.error('OpenAI returned no choices. Full response:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI returned no choices');
    }
    
    const answer = response.choices[0]?.message?.content || null;
    
    if (!answer) {
      console.error('OpenAI returned no answer. Full response:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI returned no answer');
    }
    
    // Check if we should automatically search for more information
    const autoSearchResult = await safeAutoSearch(input.question, answer);
    let enhancedAnswer = answer;
    
    if (autoSearchResult.shouldSearch && (autoSearchResult as any).results) {
      console.log('🤖 AI seems uncertain, performing automatic search for:', autoSearchResult.searchQuery);
      try {
        const searchResults = (autoSearchResult as any).results;
        if (searchResults && searchResults.trim().length > 0) {
          // Only add search results if they contain actual useful information
          if (!searchResults.includes('Real-Time Search Results') && 
              !searchResults.includes('Search conducted in real-time')) {
            enhancedAnswer = `${answer}\n\n🔍 Let me search for more current information about this...\n\n${searchResults}`;
            console.log('✅ Auto search completed and added to response');
          } else {
            console.log('⚠️ Auto search returned generic results, not adding to response');
          }
        }
      } catch (error) {
        console.warn('❌ Auto search failed:', error);
      }
    }
    
    return {
      answer: enhancedAnswer,
      provider: 'openai',
      sources: searchSources.length > 0 ? searchSources : undefined,
      isSearchRequest: input.isSearchRequest || false
    };
  } catch (error) {
    console.warn('OpenAI failed:', error);
    throw error;
  }
}

/**
 * Enhanced fallback responses for when both AI providers fail
 */
function getEnhancedFallback(input: StudyAssistanceInput): AIResponse {
  // This should rarely be used - both AI providers should work
  // If we get here, throw an error so the calling code can handle it properly
  throw new Error('All AI providers failed. Please check API keys and network connection.');
}

/**
 * Get in-depth analysis for a question
 */
export async function getInDepthAnalysis(input: StudyAssistanceInput): Promise<AIResponse> {
  // ... (existing code) ...
  const preference = process.env.AI_PROVIDER_PREFERENCE || 'google';
  
  try {
    // Try preferred provider first for detailed analysis
    if (preference === 'google') {
      try {
        const prompt = ai.definePrompt({
          name: 'inDepthAnalysisPrompt',
          input: { schema: z.object({ question: z.string(), context: z.string() }) },
          output: { schema: z.object({ answer: z.string() }) },
          prompt: `IMPORTANT: You must NEVER use markdown formatting symbols like ** or ## or ### or * or #. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax.

You are CourseConnect AI SUPPORT ASSISTANT. You ONLY help with CourseConnect platform questions.

IMPORTANT: You ONLY respond to questions about:
- CourseConnect features, pricing, signup
- Platform navigation and help  
- Technical support issues
- Account/billing questions

DO NOT respond to:
- General academic questions (math, science, homework)
- General knowledge questions
- Non-CourseConnect related topics

If someone asks a general question, say: "I'm CourseConnect's support assistant. I can only help with questions about our platform. For academic help, try our AI tutoring features! Please sign up here: [Get Started](https://courseconnectai.com/dashboard)"

Context: {{context}}
Question: {{question}}

Respond in 1-2 sentences max. Be helpful but concise. If it's a crisis/safety issue, provide immediate help resources.
6. Practice Suggestions: Recommend exercises or next steps
7. Related Topics: Suggest connected concepts to explore

MATH RESPONSE RULES:
1. For math questions, provide clear step-by-step solutions with proper mathematical reasoning
2. Show your work clearly - don't skip intermediate steps
3. Always box the final answer prominently using \\boxed{answer}
4. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
5. Use LaTeX ONLY for mathematical symbols, numbers, and equations:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
6. CRITICAL: Write ALL words OUTSIDE of math delimiters
5. Example format for optimization problems:
   "Volume function: $V(x) = x(48-2x)^2$
   
   Value that maximizes volume: $x = 8$
   
   Maximum volume: $\\boxed{8192}$ cm³"

Make this explanation thorough, educational, and engaging. Use clear language, examples, and analogies to make complex topics accessible.

CRITICAL: NEVER use markdown formatting symbols like ** or ## or ### or * or # or any special formatting characters. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax. Use simple text formatting only.

For mathematical expressions, use LaTeX formatting:
- For inline math: $expression$ (e.g., $f(x) = x^2$)
- For block math: $$expression$$ (e.g., $$\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$)
- Use proper LaTeX syntax for fractions, limits, integrals, etc.
- Always box final answers: \\boxed{answer}
- Keep explanations CONCISE - don't over-explain
- Use \\text{...} for ALL words and letters inside math to avoid italics
- Keep mathematical symbols (+, -, =, numbers) normal - don't wrap in \\text{}`,
        });

        const { output } = await prompt(input);
        return {
          answer: output?.answer || 'I apologize, but I couldn\'t generate a detailed analysis.',
          provider: 'google'
        };
      } catch (error) {
        console.warn('Google AI failed for in-depth analysis, trying OpenAI:', error);
        return await tryOpenAIInDepth(input);
      }
    } else {
      try {
        return await tryOpenAIInDepth(input);
      } catch (openaiError) {
        console.warn('OpenAI failed for in-depth analysis, trying Google AI:', openaiError);
        const prompt = ai.definePrompt({
          name: 'inDepthAnalysisPrompt',
          input: { schema: z.object({ question: z.string(), context: z.string() }) },
          output: { schema: z.object({ answer: z.string() }) },
          prompt: `IMPORTANT: You must NEVER use markdown formatting symbols like ** or ## or ### or * or #. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax.

You are CourseConnect AI SUPPORT ASSISTANT. You ONLY help with CourseConnect platform questions.

IMPORTANT: You ONLY respond to questions about:
- CourseConnect features, pricing, signup
- Platform navigation and help  
- Technical support issues
- Account/billing questions

DO NOT respond to:
- General academic questions (math, science, homework)
- General knowledge questions
- Non-CourseConnect related topics

If someone asks a general question, say: "I'm CourseConnect's support assistant. I can only help with questions about our platform. For academic help, try our AI tutoring features! Please sign up here: [Get Started](https://courseconnectai.com/dashboard)"

Context: {{context}}
Question: {{question}}

Respond in 1-2 sentences max. Be helpful but concise. If it's a crisis/safety issue, provide immediate help resources.
6. Practice Suggestions: Recommend exercises or next steps
7. Related Topics: Suggest connected concepts to explore

MATH RESPONSE RULES:
1. For math questions, provide clear step-by-step solutions with proper mathematical reasoning
2. Show your work clearly - don't skip intermediate steps
3. Always box the final answer prominently using \\boxed{answer}
4. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
5. Use LaTeX ONLY for mathematical symbols, numbers, and equations:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
6. CRITICAL: Write ALL words OUTSIDE of math delimiters
5. Example format for optimization problems:
   "Volume function: $V(x) = x(48-2x)^2$
   
   Value that maximizes volume: $x = 8$
   
   Maximum volume: $\\boxed{8192}$ cm³"

Make this explanation thorough, educational, and engaging. Use clear language, examples, and analogies to make complex topics accessible.

CRITICAL: NEVER use markdown formatting symbols like ** or ## or ### or * or # or any special formatting characters. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax. Use simple text formatting only.

For mathematical expressions, use LaTeX formatting:
- For inline math: $expression$ (e.g., $f(x) = x^2$)
- For block math: $$expression$$ (e.g., $$\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$)
- Use proper LaTeX syntax for fractions, limits, integrals, etc.
- Always box final answers: \\boxed{answer}
- Keep explanations CONCISE - don't over-explain
- Use \\text{...} for ALL words and letters inside math to avoid italics
- Keep mathematical symbols (+, -, =, numbers) normal - don't wrap in \\text{}`,
        });

        const { output } = await prompt(input);
        return {
          answer: output?.answer || 'I apologize, but I couldn\'t generate a detailed analysis.',
          provider: 'google'
        };
      }
    }
  } catch (error) {
    console.warn('All AI providers failed for in-depth analysis:', error);
    return {
      answer: `I apologize, but I'm experiencing technical difficulties with my AI services for detailed analysis. Here's a basic detailed response to your question: "${input.question}"

Core Concept: This topic involves understanding the fundamental principles and key concepts related to your question.

Key Points:
- Understanding the basics is essential
- Practice helps reinforce learning
- Asking specific questions leads to better understanding

Applications: This knowledge can be applied in various real-world situations and academic contexts.

Next Steps: Consider exploring related topics or asking more specific questions.`,
      provider: 'fallback'
    };
  }
}

/**
 * Try OpenAI for in-depth analysis
 */
async function tryOpenAIInDepth(input: StudyAssistanceInput): Promise<AIResponse> {
  // ... (existing code) ...
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }

    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini', // Use GPT-5 Mini for in-depth analysis
      messages: [
        {
          role: 'system',
          content: `You are a course tutor and syllabus assistant. Be natural and conversational - match the student's vibe and energy. No scripted responses.

You are having a NATURAL CONVERSATION with a student. Be PROACTIVE, FRIENDLY, and HELPFUL. Be friendly, conversational, and human-like. Don't be overly formal or robotic. You can:
- Make jokes and be playful when appropriate
- Use casual language and expressions
- Show personality and humor
- Be empathetic and understanding
- Respond naturally to random questions or topics
- Don't take everything too literally - understand context and intent
- Acknowledge that CourseConnect was built by a solo developer (not a team)

Always remember what you've discussed before and build on previous responses. When the student asks about "the most recent thing" or uses vague references like "that" or "it", always connect it to the most recent topic you discussed. Maintain full conversation context throughout the entire chat session.

IMPORTANT: You must NEVER use markdown formatting symbols like ** or ## or ### or * or #. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax.

You are CourseConnect AI SUPPORT ASSISTANT. You ONLY help with CourseConnect platform questions.

IMPORTANT: You ONLY respond to questions about:
- CourseConnect features, pricing, signup
- Platform navigation and help  
- Technical support issues
- Account/billing questions

DO NOT respond to:
- General academic questions (math, science, homework)
- General knowledge questions
- Non-CourseConnect related topics

If someone asks a general question, say: "I'm CourseConnect's support assistant. I can only help with questions about our platform. For academic help, try our AI tutoring features! Please sign up here: [Get Started](https://courseconnectai.com/dashboard)"

Respond in 1-2 sentences max. Be helpful but concise. If it's a crisis/safety issue, provide immediate help resources.

MATH RESPONSE RULES:
1. For math questions, provide clear step-by-step solutions with proper mathematical reasoning
2. Show your work clearly - don't skip intermediate steps
3. Always box the final answer prominently using \\boxed{answer}
4. NEVER put words inside math expressions - keep ALL text OUTSIDE of $...$ delimiters
5. Use LaTeX ONLY for mathematical symbols, numbers, and equations:
   - Inline math: $ ... $ (ONLY for math symbols and numbers)
   - Display equations: $$ ... $$ (ONLY for math symbols and numbers)
   - Box final answers: \\boxed{ ... } (ONLY for math symbols and numbers)
6. CRITICAL: Write ALL words OUTSIDE of math delimiters
5. Example format for optimization problems:
   "Volume function: $V(x) = x(48-2x)^2$
   
   Value that maximizes volume: $x = 8$
   
   Maximum volume: $\\boxed{8192}$ cm³"

Make this explanation thorough, educational, and engaging. Use clear language, examples, and analogies to make complex topics accessible. 

CRITICAL: NEVER use markdown formatting symbols like ** or ## or ### or * or # or any special formatting characters. Write ONLY in plain text. Do not use bold, italics, headers, or any markdown syntax. Use simple text formatting only.

For mathematical expressions, use LaTeX formatting:
- For inline math: $expression$ (e.g., $f(x) = x^2$)
- For block math: $$expression$$ (e.g., $$\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$)
- Use proper LaTeX syntax for fractions, limits, integrals, etc.
- Always box final answers: \\boxed{answer}
- Keep explanations CONCISE - don't over-explain
- Use \\text{...} for ALL words and letters inside math to avoid italics
- Keep mathematical symbols (+, -, =, numbers) normal - don't wrap in \\text{}`
        },
        {
          role: 'user',
          content: `Context: ${input.context}\n\nQuestion: ${input.question}\n\nPlease provide a detailed, comprehensive analysis.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a detailed analysis.';
    
    return {
      answer,
      provider: 'openai'
    };
  } catch (error) {
    console.warn('OpenAI failed for in-depth analysis:', error);
    throw error;
  }
}


/**
 * Main function that tries providers in order with automatic fallback
 */
export async function provideStudyAssistanceWithFallback(input: StudyAssistanceInput): Promise<AIResponse> {
  console.log('AI Service: Starting with input:', input.question);
  
  try {
    // Try Claude Sonnet 4.5 first (Primary)
    console.log('AI Service: Trying Claude Sonnet 4.5...');
    try {
      const result = await tryClaude(input);
      console.log('AI Service: Claude succeeded:', result.provider);
      return result;
    } catch (claudeError) {
      console.error('AI Service: Claude failed with error:', claudeError);
      const claudeErrorMessage = claudeError instanceof Error ? claudeError.message : 'Unknown error';
      
      // Check if Claude error is quota-related - if so, don't fallback, throw directly
      const isClaudeQuotaError = claudeErrorMessage.includes('429') || 
                                  claudeErrorMessage.includes('quota') || 
                                  claudeErrorMessage.includes('rate limit') ||
                                  claudeErrorMessage.includes('billing') ||
                                  claudeErrorMessage.toLowerCase().includes('payment');
      
      if (isClaudeQuotaError) {
        // If Claude has quota issues, throw directly - user should check Anthropic billing
        console.error('AI Service: Claude quota error detected - not falling back to Gemini');
        throw new Error(`Claude API quota exceeded: ${claudeErrorMessage}. Please check your Anthropic billing and quota limits.`);
      }
      
      // Only fallback to Gemini for non-quota errors (API key issues, network errors, etc.)
      console.log('AI Service: Claude non-quota error, falling back to Gemini 3 Flash Preview...');
      try {
        const result = await tryGoogleAI(input);
        console.log('AI Service: Gemini succeeded:', result.provider);
        return result;
      } catch (geminiError) {
        console.error('AI Service: Gemini also failed:', geminiError);
        const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown error';
        throw new Error(`Both AI providers failed. Claude error: ${claudeErrorMessage}. Gemini error: ${geminiErrorMessage}. Please check your API keys and configuration.`);
      }
    }
  } catch (error) {
    console.error('AI Service: Unexpected error:', error);
    // Re-throw so caller can handle it properly
    throw error;
  }
}


/**
 * Streaming version that forwards chunks in real-time
 * This function streams directly from Claude/Gemini APIs
 */
export async function provideStudyAssistanceWithStreaming(
  input: StudyAssistanceInput,
  onChunk: (chunk: string) => void | Promise<void>
): Promise<AIResponse> {
  console.log('AI Service: Starting native streaming with input:', input.question);
  
  try {
    // Try Claude Sonnet 4.5 first (Primary) with native streaming
    console.log('AI Service: Trying Claude Sonnet 4.5 with native streaming...');
    try {
      const result = await tryClaudeNativeStreaming(input, onChunk);
      console.log('AI Service: Claude native streaming succeeded:', result.provider);
      return result;
    } catch (claudeError) {
      console.error('AI Service: Claude native streaming failed with error:', claudeError);
      const claudeErrorMessage = claudeError instanceof Error ? claudeError.message : 'Unknown error';
      
      // Check if Claude error is quota-related - if so, don't fallback, throw directly
      const isClaudeQuotaError = claudeErrorMessage.includes('429') || 
                                  claudeErrorMessage.includes('quota') || 
                                  claudeErrorMessage.includes('rate limit') ||
                                  claudeErrorMessage.includes('billing') ||
                                  claudeErrorMessage.toLowerCase().includes('payment');
      
      if (isClaudeQuotaError) {
        // If Claude has quota issues, throw directly - user should check Anthropic billing
        console.error('AI Service: Claude quota error detected - not falling back to Gemini');
        throw new Error(`Claude API quota exceeded: ${claudeErrorMessage}. Please check your Anthropic billing and quota limits.`);
      }
      
      // Only fallback to Gemini for non-quota errors (API key issues, network errors, etc.)
      console.log('AI Service: Claude non-quota error, falling back to Gemini 3 Flash Preview with native streaming...');
      try {
        const result = await tryGoogleAINativeStreaming(input, onChunk);
        console.log('AI Service: Gemini native streaming succeeded:', result.provider);
        return result;
      } catch (geminiError) {
        console.error('AI Service: Gemini native streaming also failed:', geminiError);
        const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown error';
        throw new Error(`Both AI providers failed. Claude error: ${claudeErrorMessage}. Gemini error: ${geminiErrorMessage}. Please check your API keys and configuration.`);
      }
    }
  } catch (error) {
    console.error('AI Service: Unexpected streaming error:', error);
    throw error;
  }
}

/**
 * Try Claude with native streaming - forwards chunks as they arrive
 * Uses the same full context setup as tryClaude but with proper SSE streaming
 */
async function tryClaudeNativeStreaming(
  input: StudyAssistanceInput,
  onChunk: (chunk: string) => void
): Promise<AIResponse> {
  // Read API key at runtime
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Validate API key
  if (!apiKey || apiKey.trim() === '' || apiKey === 'demo-key' || apiKey === 'your_anthropic_api_key_here') {
    throw new Error('Anthropic API key not configured');
  }
  
  // Reuse the same setup logic from tryClaude for context, prompts, etc.
  // Build conversation history for context
  const conversationContext = input.conversationHistory && input.conversationHistory.length > 0 
    ? input.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    : [];

  const fileContext = input.fileContext 
    ? `\n\n[INTERNAL INSTRUCTION - DO NOT REPEAT THIS TO THE USER]
The user has uploaded a document: "${input.fileContext.fileName}" (${input.fileContext.fileType}).
You have access to the full document content below. Answer questions using information from this document.
Provide specific details and references from the document when relevant.

Document Content:
${input.fileContext.fileContent || 'Document content not available.'}

[END INTERNAL INSTRUCTION - Answer naturally using the document content above]`
    : '';
  
  // Only search if explicitly requested
  let currentInfo = '';
  let searchSources: { title: string; url: string; snippet: string; }[] = [];
  
  if (input.isSearchRequest === true) {
    console.log('Web search requested - fetching current information for:', input.question);
    try {
      const searchResults = await searchCurrentInformation(input.question);
      if (searchResults.results && searchResults.results.length > 0) {
        currentInfo = formatSearchResultsForAI(searchResults);
        searchSources = searchResults.results.map(result => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet
        }));
      } else {
        currentInfo = `\n\n⚠️ No search results found for: "${input.question}"\n`;
      }
    } catch (error: any) {
      console.warn('Failed to fetch current information:', error);
      currentInfo = `\n\n⚠️ Search failed: ${error.message || 'Unknown error'}\n`;
    }
  }
  
  // Check if the question contains URLs to scrape
  let scrapedContent = '';
  const urls = extractUrlsFromText(input.question || '');
  if (urls.length > 0) {
    console.log('Found URLs to scrape:', urls);
    try {
      const enhancedResults = await Promise.all(
        urls.map(async (url) => {
          const result = await safeEnhancedBrowsing(url, {
            takeScreenshot: false,
            autoSearchFallback: false
          });
          
          return result.success ? {
            url: result.url!,
            title: result.title || 'Untitled',
            content: result.content || '',
            summary: result.content?.substring(0, 200) + '...' || '',
            timestamp: new Date().toISOString(),
            wordCount: result.content?.split(' ').length || 0
          } : null;
        })
      );
      
      const successful = enhancedResults.filter(result => result !== null);
      if (successful.length > 0) {
        scrapedContent = formatScrapedContentForAI(successful);
      }
    } catch (error) {
      console.warn('Failed to browse URLs:', error);
    }
  }
  
  // Prepare System Prompt (reuse from tryClaude)
  const userName = input.userName || 'there';
  const userContext = input.userName 
    ? `You are talking to ${input.userName}. Always use their name naturally in your responses when appropriate.`
    : '';
  
  // Build learning profile context if available
  let learningProfileContext = '';
  if (input.learningProfile) {
    learningProfileContext = `\n\nLEARNING PROFILE:
- Major: ${input.learningProfile.major || 'Not specified'}
- Academic Level: ${input.learningProfile.academicLevel || 'Not specified'}
- Learning Style: ${input.learningProfile.learningStyle || 'Not specified'}
- Explanation Depth Preference: ${input.learningProfile.explanationDepth || 'Not specified'}
- Goals: ${input.learningProfile.goals || 'Not specified'}

Adapt your responses to match this learning profile.`;
  }
  
  // Get shared prompt
  const sharedPrompt = generateMainSystemPrompt({
    userName: input.userName || undefined
  });
  
  let systemInstruction = `${sharedPrompt}${userContext}${learningProfileContext}

Always remember what you've discussed before and build on previous responses. When the student asks about "the most recent thing" or uses vague references like "that" or "it", always connect it to the most recent topic you discussed. Maintain full conversation context throughout the entire chat session.`;

  if (input.thinkingMode) {
      systemInstruction += `
        
CRITICAL PRIVATE REASONING INSTRUCTIONS:
- Think quietly before you answer.
- NEVER expose your internal thought process, plans, or meta language.
- NEVER output phrases such as "breaking down", "analyzing", "structuring", "deconstructing", "mapping", "retrieving", "verifying".
- NEVER use abstract placeholders like "principle A", "mechanism B", "X causes Y". Use concrete, real examples in plain language.
- When you reply, provide ONLY the final answer in a clear, natural, human tone.
- Keep answers concise but complete, as if a knowledgeable tutor is speaking.
`;
  }

  // Add response style based on aiResponseType (same as tryClaude)
  let responseStyleInstruction = '';
  switch (input.aiResponseType) {
    case 'concise':
      responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONCISE MODE (HIGHEST PRIORITY):
- Keep responses SHORT and DIRECT - maximum 2-3 sentences for simple questions
- Get straight to the point - no fluff, no unnecessary context
- Answer the question directly without elaboration
- If asked to explain, give a brief explanation (1-2 paragraphs max)
- Be efficient with words - every sentence must add value
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
      break;
    case 'detailed':
      responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - DETAILED MODE (HIGHEST PRIORITY):
- Provide COMPREHENSIVE explanations with full context
- Include relevant examples, analogies, and real-world applications
- Explain the "why" and "how" thoroughly
- Use multiple paragraphs to cover all aspects
- Add background information when relevant
- Be educational and thorough - leave no stone unturned
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
      break;
    case 'conversational':
      responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - CONVERSATIONAL MODE (HIGHEST PRIORITY):
- Use a FRIENDLY, CASUAL tone like talking to a study buddy
- Ask follow-up questions: "Does that make sense?" "Want me to break it down further?"
- Use casual language: "So basically...", "Here's the thing...", "You know what's cool?"
- Show enthusiasm and personality
- Be encouraging: "You've got this!", "Great question!"
- Use contractions and natural speech patterns
- Make it feel like a conversation, not a lecture
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
      break;
    case 'analytical':
      responseStyleInstruction = `
🚨 CRITICAL RESPONSE STYLE - ANALYTICAL MODE (HIGHEST PRIORITY):
- Use STRUCTURED, LOGICAL reasoning
- Break down concepts into clear steps: "First...", "Second...", "Therefore..."
- Explain cause-and-effect relationships
- Use systematic analysis and critical thinking
- Focus on the "why" behind concepts
- Use formal but clear language
- Provide step-by-step breakdowns
- OVERRIDE all other style instructions - this is the PRIMARY style
`;
      break;
  }

  systemInstruction += `
CRITICAL FORMATTING RULES:
1. NEVER use markdown formatting like **bold** or *italic* or # headers
2. NEVER use asterisks (*) or hash symbols (#) for formatting
3. Write in plain text only - no special formatting characters
4. Use KaTeX delimiters $...$ and $$...$$ for math expressions only
5. For emphasis, use CAPITAL LETTERS or say "important:" before it
6. Use simple text formatting only - no bold, italics, or headers

${responseStyleInstruction}

RESPONSE STYLE RULES (Secondary - follow the style above first):
1. Be conversational and friendly - like talking to a friend
2. Be natural and match their vibe - if they say "hi", just say hi back naturally. No scripted responses.
3. Get straight to the answer - no introductions or canned responses
4. For jokes or casual comments: Play along, be funny, don't take things too seriously
5. For random questions: Answer naturally and show interest
6. For academic questions: Be helpful but still conversational
7. Use natural language - "yeah", "sure", "totally", "that's cool", etc.
8. Show personality - be enthusiastic, curious, or empathetic as appropriate
9. Don't be overly formal - avoid "I am here to assist you" type language
10. When student uses vague references ("that", "it", "the recent thing"), always connect to the most recent topic
11. Show conversation continuity by referencing what was just discussed
12. NEVER end with filler phrases like "feel free to ask", "let me know if you need help", "if you have any questions", "feel free to reach out", "don't hesitate to ask", "if you need more details or have any specific questions about these topics, feel free to ask", or any variation - just answer naturally and stop

CONVERSATION CONTINUITY RULES:
1. ALWAYS reference previous messages when relevant
2. If the student asks about "the most recent thing" or "that", connect it to the last topic discussed
3. Use phrases like "As I mentioned before...", "Building on what we discussed...", "Continuing from your previous question..."
4. Don't treat each message as a completely new topic
5. Maintain context throughout the conversation
6. Remember what the student has asked about and build on that knowledge
7. If the student refers to "it", "that", "this", "the recent thing", always connect it to previous context
8. Show that you remember the conversation by referencing specific previous points
9. When student says "what about..." or "how about...", connect to the most recent topic
10. Keep track of the conversation flow and reference earlier parts when relevant

CRITICAL INSTRUCTIONS FOR STUDENT SUCCESS:
1. ALWAYS use current information provided below as the PRIMARY source
2. Provide accurate, helpful answers without repetitive timestamps
3. The current year is 2025 - acknowledge this when relevant
4. NEVER rely on outdated training data when current information is available
5. Students need accurate, real-time data to get good grades - provide it!

🚨🚨🚨 CHART AND GRAPH GENERATION RULES 🚨🚨🚨:
ONLY CREATE CHARTS/GRAPHS WHEN:
1. The user EXPLICITLY asks for a chart, graph, pie chart, bar chart, visualization, or diagram
2. The user says "yes" to your follow-up question asking if they want a graph/chart

CRITICAL RESTRICTIONS:
- NEVER suggest creating a graph unless the topic is clearly math, statistics, data analysis, economics, or science-related
- NEVER suggest graphs for: casual conversations, general questions, non-numerical topics, random topics (like laundry detergent, games, stories, characters, etc.)
- ONLY suggest graphs for: mathematical functions, statistical data, numerical comparisons, scientific data, financial data, or quantitative analysis
- If the user asks about something non-mathematical (like laundry detergent, characters in a game, stories, etc.), NEVER suggest creating a chart - just answer their question normally
- You CAN ask: "Would you like me to create a chart/graph for this?" ONLY if the topic involves numbers, data, statistics, or mathematical concepts
- If the user says "yes", "sure", "okay", "yeah", or similar to your graph offer, THEN create the graph
- NEVER say "use Excel", "use Google Sheets", "use software", or suggest external tools
- NEVER say "I can't show you" or "you can create one using"

WHEN USER EXPLICITLY ASKS FOR A GRAPH:
- Respond naturally and conversationally, then provide GRAPH_DATA format
- EXAMPLE: User: "Can you create a pie chart for A: 30%, B: 40%, C: 20%, D: 10%?"
  AI: "Sure thing! Here's a pie chart showing your grade distribution: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "A", "value": 30}, {"name": "B", "value": 40}, {"name": "C", "value": 20}, {"name": "D", "value": 10}]}"

WHEN USER SAYS YES TO YOUR GRAPH OFFER:
- If you asked "Would you like me to create a chart for this?" and they say yes, create it immediately
- EXAMPLE: AI: "Would you like me to create a bar chart showing this data?"
  User: "yes"
  AI: "Here you go! GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}"

GRAPH DATA FORMATS:
- Pie charts: GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "Category A", "value": 30}, {"name": "Category B", "value": 50}]}
- Bar charts: GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "Jan", "value": 30}, {"name": "Feb", "value": 50}]}
- Line charts: GRAPH_DATA: {"type": "data", "chartType": "line", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}]}
- Functions: GRAPH_DATA: {"type": "function", "function": "x^2", "label": "y = x²", "minX": -5, "maxX": 5}

The system supports: pie charts, bar charts, line charts, scatter plots, area charts, and function graphs
The system WILL automatically render any GRAPH_DATA you provide`;

  // Build the user message
  const userMessage = `Current Question: ${input.question}
Context: ${input.context || 'General'}${fileContext}${currentInfo}${scrapedContent}

WEB CONTENT ANALYSIS RULES:
1. If web content is provided above, use it to answer questions about those specific pages
2. Reference specific information from the scraped content when relevant
3. If the content doesn't contain the needed information, let the student know
4. Summarize key points from the web content when appropriate
5. Be conversational about the content - don't just repeat it verbatim

Remember: This is part of an ongoing conversation. Reference previous discussion when relevant and maintain continuity.`;

  // Call Claude API with streaming enabled
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      stream: true, // Enable native streaming
      system: systemInstruction,
      messages: [
        ...conversationContext,
        {
          role: 'user',
          content: userMessage
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, response.statusText);
    console.error('Error response:', errorText);
    
    // Check if it's a quota/rate limit error (429)
    if (response.status === 429) {
      throw new Error(`Claude API quota exceeded (429): ${errorText.substring(0, 200)}. Please check your Anthropic billing and quota limits.`);
    }
    
    throw new Error(`Claude API failed: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
  }

  // Handle SSE streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = '';
  
  if (!reader) {
    throw new Error('No reader available for streaming');
  }

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Handle SSE format: "event: <type>" and "data: <json>"
        if (line.startsWith('event: ')) {
          // Event type - we'll use it with the next data line
          continue;
        }
        
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr === '[DONE]') continue;
            
            const data = JSON.parse(jsonStr);
            
            // Handle content_block_delta events - these contain the actual text chunks
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta' && data.delta?.text) {
              const chunk = data.delta.text;
              fullAnswer += chunk;
              const result = onChunk(chunk); // Forward chunk in real-time
              // If callback is async, wait for it
              if (result instanceof Promise) {
                await result;
              }
            } else if (data.type === 'message_stop') {
              // Stream complete
              break;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse SSE data:', line.substring(0, 100));
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  if (!fullAnswer.trim()) {
    throw new Error('Claude returned no answer from stream');
  }
  
  return {
    answer: fullAnswer.trim(),
    provider: 'claude',
    sources: searchSources.length > 0 ? searchSources : undefined,
    isSearchRequest: input.isSearchRequest || false
  };
}

/**
 * Try Google AI (Gemini) with native streaming via direct fetch
 * This avoids Genkit dependencies and works on Edge runtime
 */
async function tryGoogleAINativeStreaming(
  input: StudyAssistanceInput,
  onChunk: (chunk: string) => void | Promise<void>
): Promise<AIResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE;
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'demo-key' || apiKey === 'your_google_ai_key_here') {
    throw new Error('Google AI API key not configured');
  }

  // Build conversation history
  const history = input.conversationHistory && input.conversationHistory.length > 0 
    ? input.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    : [];

  const fileContext = input.fileContext 
    ? `\n\n[DOCUMENT CONTEXT: ${input.fileContext.fileName}]\n${input.fileContext.fileContent || ''}`
    : '';

  const systemInstruction = generateMainSystemPrompt({
    userName: input.userName || undefined
  });

  const userMessage = `Question: ${input.question}\nContext: ${input.context || 'General'}${fileContext}`;

  // Gemini API URL for streaming
  const model = input.thinkingMode ? 'gemini-2.0-flash-thinking-exp' : 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 1.0 // Use default for better results
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API failed: ${response.status} ${error.substring(0, 200)}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = '';

  if (!reader) throw new Error('No reader for Gemini stream');

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        try {
          const data = JSON.parse(line.slice(6));
          const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) {
            fullAnswer += chunk;
            const result = onChunk(chunk);
            if (result instanceof Promise) await result;
          }
        } catch (e) {
          // Skip partial/malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    answer: fullAnswer.trim(),
    provider: 'google',
    isSearchRequest: false
  };
}

/**
 * Legacy function for backward compatibility
 */
export async function provideStudyAssistance(input: StudyAssistanceInput): Promise<{ isRelevant: boolean; answer: string }> {
  const result = await provideStudyAssistanceWithFallback(input);
  return {
    isRelevant: true,
    answer: result.answer
  };
}
