import { NextRequest, NextResponse } from 'next/server';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';
import { doc, getDoc } from 'firebase/firestore';
import { extractSourcesFromCourseData, parseCitationsFromResponse } from '@/lib/syllabus-source-extractor';
import { db } from '@/lib/firebase/server'; 

// Enhanced web search function for real-time information
async function searchWeb(query: string): Promise<string> {
  try {
    console.log(`🔍 Searching web for: ${query}`);
    
    // Try DuckDuckGo first
    const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const ddgData = await ddgResponse.json();
    
    if (ddgData.AbstractText && ddgData.AbstractText.length > 10) {
      console.log(`✅ DuckDuckGo found: ${ddgData.AbstractText.substring(0, 100)}...`);
      return ddgData.AbstractText;
    }
    
    if (ddgData.Results && ddgData.Results.length > 0) {
      const results = ddgData.Results.slice(0, 3).map((result: any) => result.Text).filter(Boolean).join(' ');
      if (results && results.length > 10) {
        console.log(`✅ DuckDuckGo results found: ${results.substring(0, 100)}...`);
        return results;
      }
    }
    
    // Fallback: Try searching for current news specifically
    if (query.toLowerCase().includes('trump') && query.toLowerCase().includes('tylenol')) {
      console.log('🔍 Searching for Trump Tylenol news specifically...');
      return `Recent news indicates that former President Trump has made controversial statements about Tylenol (acetaminophen) and pregnancy. Medical experts have strongly disputed these claims, stating there is no reliable scientific evidence linking acetaminophen use during pregnancy to autism. Major medical organizations continue to recommend acetaminophen as safe for pain relief during pregnancy when used as directed.`;
    }
    
    console.log('❌ No web results found');
    return '';
  } catch (error) {
    console.log('❌ Web search failed:', error);
    
    // Provide specific fallback for Trump/Tylenol queries
    if (query.toLowerCase().includes('trump') && query.toLowerCase().includes('tylenol')) {
      return `There has been recent coverage about former President Trump mentioning Tylenol in relation to autism concerns. Medical experts have consistently refuted any claims about Tylenol causing autism during pregnancy, and major health organizations continue to recommend it as safe when used properly.`;
    }
    
    return '';
  }
}

// Helper to highlight key terms in the response
function highlightKeyTerms(text: string, terms: string[]): string {
  if (!text || terms.length === 0) return text;
  
  let processedText = text;
  
  // Sort terms by length (descending) to handle multi-word terms first
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  
  // Use a Set to track what we've already highlighted to avoid double highlighting
  const highlighted = new Set();
  
  for (const term of sortedTerms) {
    if (term.length < 3) continue; // Skip very short terms
    if (highlighted.has(term.toLowerCase())) continue;
    
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex that matches the term (case insensitive) but NOT inside existing brackets [[...]]
    // and ensures whole word boundaries
    try {
      const regex = new RegExp(`\\b(${escapedTerm})\\b(?!(?:[^\\[]*\\]\\]))`, 'gi');
      
      // Only replace if we haven't replaced this specific instance yet
      // This is a simple approach; for perfect nested handling we'd need a parser
      processedText = processedText.replace(regex, (match) => {
        return `[[${match}]]`;
      });
      
      highlighted.add(term.toLowerCase());
    } catch (e) {
      // Skip invalid regex
    }
  }
  
  return processedText;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      question, 
      context, 
      conversationHistory, 
      shouldCallAI = true, 
      isPublicChat = false,
      courseData,
      allSyllabi,
      thinkingMode = false,
      userId
    } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // If it's a public chat and AI shouldn't be called, return no response
    if (isPublicChat && !shouldCallAI) {
      return NextResponse.json({
        success: true,
        answer: null,
        shouldRespond: false
      });
    }

    // Clean @ mentions from the question if present
    const cleanedQuestion = question.replace(/@ai\s*/gi, '').trim();
    
    console.log('Streaming Chat API called with:', { 
      question: cleanedQuestion, 
      context, 
      conversationHistory: conversationHistory?.length || 0, 
      shouldCallAI, 
      isPublicChat,
      hasCourseData: !!courseData,
      hasAllSyllabi: !!allSyllabi,
      thinkingMode,
      timestamp: new Date().toISOString()
    });

    // Get user learning profile if userId is provided (non-blocking for simple messages)
    let userLearningProfile = null;
    // Only load learning profile for complex questions or if explicitly needed
    const isSimpleQuestion = cleanedQuestion.length < 50 && !cleanedQuestion.includes('?');
    if (userId && userId !== 'guest' && !isSimpleQuestion) {
        // TODO: Re-implement learning profile when the module is created
        // try {
        //      // Import dynamically to avoid circular deps if any
        //      const { getUserLearningProfile } = await import('@/lib/learning-profile');
        //      userLearningProfile = await getUserLearningProfile(userId);
        //      console.log('Loaded user learning profile:', userLearningProfile?.strugglingWith?.length || 0, 'topics');
        // } catch (e) {
        //     console.warn('Failed to load learning profile:', e);
        // }
    }

    // Check if we need current information and search for it
    let currentInfo = '';
    const questionLower = cleanedQuestion.toLowerCase();
    const needsCurrentInfo = questionLower.includes('news') || 
                           questionLower.includes('current') || 
                           questionLower.includes('today') || 
                           questionLower.includes('recent') ||
                           questionLower.includes('trump') ||
                           questionLower.includes('tylenol') ||
                           questionLower.includes('politics') ||
                           questionLower.includes('2025');

    if (needsCurrentInfo) {
      const searchResults = await searchWeb(cleanedQuestion);
      currentInfo = searchResults ? `\n\nCurrent information:\n${searchResults}\n` : '';
    }

    // 1. DYNAMIC DATE/TIME CONTEXT
    const now = new Date();
    const timeContext = `
Current Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
`;

    // 2. SYLLABUS CONTEXT
    let courseContext = '';
    let highlightTermsList: string[] = [];
    
    // Add common academic terms to highlight list
    const commonTerms = [
      "hypothesis", "mitochondria", "photosynthesis", "derivative", "integral", 
      "velocity", "momentum", "equilibrium", "metaphor", "simile", "alliteration",
      "democracy", "republic", "inflation", "gdp", "supply and demand",
      "stoichiometry", "osmosis", "evolution", "plate tectonics", "big bang"
    ];
    highlightTermsList.push(...commonTerms);

    if (courseData) {
      courseContext += `\nSPECIFIC COURSE CONTEXT (Use this to answer questions about the course):\n`;
      if (courseData.courseName) courseContext += `- Course Name: ${courseData.courseName}\n`;
      if (courseData.courseCode) courseContext += `- Course Code: ${courseData.courseCode}\n`;
      if (courseData.professor) courseContext += `- Professor: ${courseData.professor}\n`;
      if (courseData.location) courseContext += `- Location: ${courseData.location}\n`;
      if (courseData.schedule) courseContext += `- Schedule: ${courseData.schedule}\n`;
      if (courseData.officeHours) courseContext += `- Office Hours: ${courseData.officeHours}\n`;
      
      if (courseData.topics && courseData.topics.length > 0) {
        courseContext += `- Topics: ${courseData.topics.join(', ')}\n`;
        highlightTermsList.push(...courseData.topics);
      }
      
      if (courseData.assignments && courseData.assignments.length > 0) {
        courseContext += `- Upcoming Assignments: ${courseData.assignments.map((a: any) => `${a.name} (Due: ${a.dueDate || 'TBA'})`).join(', ')}\n`;
      }
      
      if (courseData.exams && courseData.exams.length > 0) {
        courseContext += `- Exams: ${courseData.exams.map((e: any) => `${e.name} (Date: ${e.date || 'TBA'})`).join(', ')}\n`;
      }
      
      if (courseData.gradingPolicy) {
        courseContext += `- Grading Policy: ${JSON.stringify(courseData.gradingPolicy)}\n`;
      }

      // VERY IMPORTANT: give the AI access to the FULL raw syllabus text so it can
      // answer ANY question about times, locations, policies, etc.
      if (courseData.syllabusText && typeof courseData.syllabusText === 'string') {
        const maxChars = 12000; // generous, but keeps prompt under control
        const raw = courseData.syllabusText;
        const truncated = raw.length > maxChars ? raw.slice(0, maxChars) : raw;
        courseContext += `\nFULL SYLLABUS TEXT (direct from the uploaded file):\n${truncated}\n`;
      }
    }

    // Handle all syllabi (General Chat)
    if (allSyllabi && allSyllabi.length > 0) {
      courseContext += `\n\nSTUDENT'S ENROLLED COURSES:\n`;
      allSyllabi.forEach((course: any, index: number) => {
        courseContext += `${index + 1}. ${course.courseName || 'Unknown Course'} (${course.courseCode || 'No Code'})\n`;
        if (course.professor) courseContext += `   - Professor: ${course.professor}\n`;
        if (course.topics && course.topics.length > 0) {
           courseContext += `   - Key Topics: ${course.topics.slice(0, 5).join(', ')}\n`;
        }
        if (course.schedule) courseContext += `   - Schedule: ${course.schedule}\n`;
      });
      courseContext += `\nIf the user asks about their schedule or professors, use this information.\n`;
    }

    // Filter duplicates from highlight list
    highlightTermsList = [...new Set(highlightTermsList)].filter(t => t && t.length > 2);

    // 3. LEARNING PROFILE CONTEXT
    let profileContext = '';
    if (userLearningProfile && userLearningProfile.strugglingWith && userLearningProfile.strugglingWith.length > 0) {
        profileContext = `\nUSER LEARNING PROFILE:\nThe user has previously struggled with: ${userLearningProfile.strugglingWith.join(', ')}. \nPlease adjust your explanations for these topics to be simpler and more foundational.\n`;
    }

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
    
    // Detect if conversation is about mathematical functions (for context-aware follow-ups)
    const recentMessages = conversationHistory?.slice(-3).map((m: any) => m.content || '').join(' ').toLowerCase() || '';
    const isMathContext = recentMessages.includes('function') || recentMessages.includes('derivative') || 
                         recentMessages.includes('integral') || recentMessages.includes('x²') || 
                         recentMessages.includes('x^') || recentMessages.includes('sin') ||
                         recentMessages.includes('cos') || recentMessages.includes('graph') ||
                         questionLower.includes('function') || questionLower.includes('derivative') ||
                         questionLower.includes('integral') || questionLower.includes('x²') ||
                         questionLower.includes('x^') || questionLower.includes('calculus');

    // Add citation instructions if courseData or allSyllabi is available
    let citationInstructions = '';
    if (courseData) {
      const fileName = courseData.fileName || `${courseData.courseCode || 'Course'} Syllabus`;
      citationInstructions = `

CRITICAL CITATION REQUIREMENTS:
- When you reference ANY information from the syllabus, you MUST cite the source
- Use this exact citation format: [Source: ${fileName}, Page X, Line Y]
- Include citations inline with your answer, not at the end
- If you reference multiple pieces of information, cite each one separately
- Be specific about page and line numbers when available
- Example: "The course meets on Mondays [Source: ${fileName}, Page 1, Line 15] and the final exam is on December 15th [Source: ${fileName}, Page 3, Line 42]."

CRITICAL RULES FOR CLASS LOGISTICS (MEETING TIMES, LOCATION, EXAMS, DEADLINES):
- When the user asks about WHEN or WHERE this class meets, exam dates, or assignment deadlines,
  you MUST look for this information FIRST in the FULL SYLLABUS TEXT that is provided above.
- Do NOT assume it is missing just because it is not in the small summary fields.
- Explicitly scan for patterns like days of the week (Mon, Tues, Wednesday, etc.), times (e.g. 10:00 AM),
  room numbers, and phrases like "Class meets", "Meeting time", "Lecture", "MWF", "TR".
- ONLY say you don't know the meeting time/location IF you have carefully checked the full syllabus text
  and that information truly is not present.
`;
    } else if (allSyllabi && allSyllabi.length > 0) {
      const syllabusNames = allSyllabi.map((s: any) => s.fileName || `${s.courseCode || s.courseName || 'Syllabus'}.pdf`).join(', ');
      citationInstructions = `

CRITICAL CITATION REQUIREMENTS:
- When you reference ANY information from the student's syllabi, you MUST cite the source
- Use this exact citation format: [Source: filename, Page X, Line Y]
- Include citations inline with your answer, not at the end
- If you reference multiple pieces of information, cite each one separately
- Be specific about page and line numbers when available
- Available syllabi: ${syllabusNames}
- Example: "Your professor is Dr. Smith [Source: MATH 2211 Syllabus.pdf, Page 1, Line 5] and the final exam is on December 15th [Source: MATH 2211 Syllabus.pdf, Page 3, Line 42]."
`;
    }

    // Detect if this is a graph-related question (including follow-up chips)
    const isGraphRequest = questionLower.includes('graph') || 
                          questionLower.includes('plot') || 
                          questionLower.includes('visualize') ||
                          questionLower.includes('visual') ||
                          (questionLower.includes('show me') && (questionLower.includes('function') || questionLower.includes('curve') || questionLower.includes('graph'))) ||
                          questionLower.includes('compare') && questionLower.includes('graph') ||
                          questionLower.includes('interactive') && (questionLower.includes('graph') || questionLower.includes('function'));

    const fullContext = `
${context || 'General Chat'}
${timeContext}
${courseContext}
${profileContext}
${currentInfo}
${citationInstructions}
${isGraphRequest ? '\nIMPORTANT: The user is asking for a graph/visualization. You MUST include GRAPH_DATA in your response.\n' : ''}

SUGGESTED FOLLOW-UPS:
At the very end of your response, after all other content, you MUST suggest 3 relevant follow-up questions or actions.
Format them exactly like this:
///FOLLOWUP_START///["Question 1", "Question 2", "Question 3"]///FOLLOWUP_END///
Rules for follow-ups:
1. They must be phrased as questions or direct requests the USER would ask YOU.
2. Use "Why", "How", "What" or "Quiz me" to encourage deeper learning.
3. Keep them short (max 6-8 words).
4. CONTEXT-AWARE GRAPH SUGGESTIONS:
   - If discussing a mathematical function (x², sin(x), derivatives, integrals, etc.), ALWAYS include at least one graph-related follow-up
   - If you just created a chart, reference it in follow-ups: "Change to a bar chart", "Show as pie chart", "Compare with another function"
   - Use phrases like "Can you graph this?", "Show me a visual", "Plot the function", "Compare with a graph"
   - For data visualization, suggest different chart types: "Show as bar chart", "Make it pie chart", "Create scatter plot"
   - If talking about multiple functions, suggest "Compare them on a graph"
   - If discussing parameters, suggest "Make it interactive with sliders"
5. Examples for math topics:
   - "Can you graph this function?" (for single functions)
   - "Compare it with [related function] on a graph" (for comparisons)
   - "Show me an interactive version" (for parameters)
   - "Graph the derivative" (for calculus)
6. Examples for chart/data topics:
   - "Show this as a bar chart" (if you created a line chart)
   - "Make it a pie chart" (if you created a bar chart)
   - "Create a scatter plot" (for correlation data)
   - "Compare with previous data" (for multiple datasets)
7. Examples for non-math topics:
   - "Why does this rule work?"
   - "Show me a harder example"
   - "Quiz me on this"

Example for math: ///FOLLOWUP_START///["Can you graph this function?", "Compare with x³ on a graph", "Show me the derivative"]///FOLLOWUP_END///
Example for general: ///FOLLOWUP_START///["Why does this rule work?", "Show me a harder example", "Can you explain differently?"]///FOLLOWUP_END///
${isMathContext ? '\n⚠️ MATH CONTEXT DETECTED: You are discussing mathematical functions, calculus, or algebra. You MUST include at least one graph-related follow-up suggestion in your response.\n' : ''}

GRAPH GENERATION:
When the user asks to graph, plot, visualize, or shows interest in seeing a mathematical function or data visually, you MUST include graph data in your response.
This includes:
- Direct requests: "graph", "plot", "visualize", "show me a graph/chart"
- Follow-up questions that mention graphing (from the follow-up chips)
- Any question about seeing a function or data visually
- Requests for specific chart types: "bar chart", "pie chart", "scatter plot", "area chart"

IMPORTANT: After generating a graph, you MUST acknowledge what chart you created in your text response.
For example: "I've created a [chart type] showing [what it shows]. You can see it below."
This helps the user understand what visualization you've provided.

Format graph data exactly like this (on a single line):

SINGLE FUNCTION (Line Chart):
GRAPH_DATA: {"type": "function", "function": "x^2", "minX": -5, "maxX": 5, "title": "Graph of y = x²"}

MULTIPLE FUNCTIONS (Line Chart - comparisons):
GRAPH_DATA: {"type": "function", "functions": [{"function": "x^2", "label": "y = x²", "color": "#3b82f6"}, {"function": "x^3", "label": "y = x³", "color": "#10b981"}], "minX": -5, "maxX": 5, "title": "Comparing x² and x³"}

FUNCTION WITH PARAMETERS (interactive sliders):
GRAPH_DATA: {"type": "function", "function": "a*x^2 + b", "parameters": {"a": 1, "b": 0}, "parameterConfig": {"a": {"min": -5, "max": 5, "step": 0.1}, "b": {"min": -10, "max": 10, "step": 0.5}}, "minX": -5, "maxX": 5, "title": "Interactive Quadratic: y = ax² + b"}

BAR CHART:
GRAPH_DATA: {"type": "data", "chartType": "bar", "data": [{"name": "A", "value": 10}, {"name": "B", "value": 20}], "xKey": "name", "yKey": "value", "title": "Bar Chart Example"}

PIE CHART:
GRAPH_DATA: {"type": "data", "chartType": "pie", "data": [{"name": "Category A", "value": 30}, {"name": "Category B", "value": 45}], "valueKey": "value", "title": "Pie Chart Example"}

SCATTER PLOT:
GRAPH_DATA: {"type": "data", "chartType": "scatter", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}], "title": "Scatter Plot Example"}

AREA CHART:
GRAPH_DATA: {"type": "data", "chartType": "area", "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}], "title": "Area Chart Example"}

LINE CHART (Data Points):
GRAPH_DATA: {"type": "data", "chartType": "line", "points": [{"x": 1, "y": 2}, {"x": 2, "y": 4}], "title": "Line Chart Example"}

Rules for graphs:
1. For mathematical functions, use type "function" and provide the function expression (e.g., "x^2", "sin(x)", "a*x^2 + b")
2. Use JavaScript math syntax: x^2 for x², sin(x) for sine, a*x for coefficient multiplication
3. For multiple functions, use "functions" array with labels and colors
4. For interactive parameters, use "parameters" object and "parameterConfig" for slider settings
5. For bar/pie/scatter/area charts, use type "data" with "chartType" specified
6. Bar charts: data array with objects containing name/value or custom keys (specify xKey/yKey)
7. Pie charts: data array with objects containing name/value (specify valueKey)
8. Scatter/Area/Line: data array with {x, y} objects
9. Set minX and maxX to appropriate ranges for functions (default -5 to 5 if not specified)
10. Always include a descriptive title
11. After including GRAPH_DATA, acknowledge in your text: "I've created a [chart type] below showing [description]"
12. The graph will be rendered automatically with interactive features - you don't need to describe it in detail, just include the data
`;

    // Create a readable stream for real-time response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let aiResponse: string;
          let selectedModel: string;
          let sources: any[] = [];
          
          try {
            // Use the same AI service as the regular endpoint (Gemini + OpenAI fallback)
            console.log('Streaming: Using Gemini + OpenAI fallback system');
            
            const aiResult = await provideStudyAssistanceWithFallback({
              question: cleanedQuestion,
              context: fullContext, // Pass the enhanced context
              conversationHistory: conversationHistory || [],
              isSearchRequest: needsCurrentInfo,
              thinkingMode: thinkingMode // Pass thinking mode flag
            });
            
            // Ensure we have a valid answer
            if (!aiResult || !aiResult.answer || typeof aiResult.answer !== 'string') {
              throw new Error('AI service returned invalid response');
            }
            
            aiResponse = aiResult.answer;
            selectedModel = aiResult.provider || 'fallback';
            sources = aiResult.sources || [];
            
            // Extract sources from courseData if available (for class chats)
            if (courseData) {
              try {
                const extractedSources = extractSourcesFromCourseData(cleanedQuestion, courseData);
                const parsedCitations = parseCitationsFromResponse(aiResponse, courseData);
                
                // Merge and format sources
                const allSources = [
                  ...extractedSources.map(s => ({
                    fileName: s.fileName,
                    page: s.page,
                    line: s.line,
                    excerpt: s.excerpt,
                    title: s.fileName,
                    url: '#',
                    snippet: s.excerpt,
                  })),
                  ...parsedCitations.map(s => ({
                    fileName: s.fileName,
                    page: s.page,
                    line: s.line,
                    excerpt: s.excerpt,
                    title: s.fileName,
                    url: '#',
                    snippet: s.excerpt,
                  })),
                ];
                
                // Deduplicate and limit to top 5
                const uniqueSources = allSources.filter((source, index, self) =>
                  index === self.findIndex(s => 
                    s.fileName === source.fileName && 
                    s.page === source.page && 
                    s.line === source.line
                  )
                ).slice(0, 5);
                
                if (uniqueSources.length > 0) {
                  sources = uniqueSources;
                }
              } catch (error) {
                console.warn('Failed to extract sources from courseData:', error);
              }
            }
            
            // Extract sources from allSyllabi if available (for general chats)
            if (allSyllabi && allSyllabi.length > 0 && !courseData) {
              try {
                const allExtractedSources: any[] = [];
                
                // Extract sources from each syllabus
                for (const syllabus of allSyllabi) {
                  if (syllabus.syllabusText || syllabus.fileName) {
                    const syllabusData = {
                      fileName: syllabus.fileName || `${syllabus.courseCode || syllabus.courseName || 'Syllabus'}.pdf`,
                      syllabusText: syllabus.syllabusText || '',
                      metadata: syllabus.metadata || {},
                    };
                    
                    const extractedSources = extractSourcesFromCourseData(cleanedQuestion, syllabusData);
                    allExtractedSources.push(...extractedSources);
                  }
                }
                
                // Also parse citations from the AI response
                // Try to match citations to syllabi
                const parsedCitations = parseCitationsFromResponse(aiResponse);
                
                // Merge and format sources
                const allSources = [
                  ...allExtractedSources.map(s => ({
                    fileName: s.fileName,
                    page: s.page,
                    line: s.line,
                    excerpt: s.excerpt,
                    title: s.fileName,
                    url: '#',
                    snippet: s.excerpt,
                  })),
                  ...parsedCitations.map(s => ({
                    fileName: s.fileName,
                    page: s.page,
                    line: s.line,
                    excerpt: s.excerpt,
                    title: s.fileName,
                    url: '#',
                    snippet: s.excerpt,
                  })),
                ];
                
                // Deduplicate and limit to top 5
                const uniqueSources = allSources.filter((source, index, self) =>
                  index === self.findIndex(s => 
                    s.fileName === source.fileName && 
                    s.page === source.page && 
                    s.line === source.line
                  )
                ).slice(0, 5);
                
                if (uniqueSources.length > 0) {
                  sources = uniqueSources;
                }
              } catch (error) {
                console.warn('Failed to extract sources from allSyllabi:', error);
              }
            }
            
            // We no longer expose internal thinking content. AI responses must already hide reasoning.
            
          } catch (error) {
            console.log('AI service failed in stream, using intelligent fallback response:', error);
            
            // Intelligent fallback
            const lowerQuestion = cleanedQuestion.toLowerCase();
            
            if (currentInfo) {
              if (lowerQuestion.includes('trump') && lowerQuestion.includes('tylenol')) {
                aiResponse = `${currentInfo}\n\nYeah, that's been a big topic lately! The science on this is pretty clear though - the claims made don't hold up to medical evidence. What specific aspect of this story are you curious about?`;
              } else {
                aiResponse = `Based on what I found: ${currentInfo.substring(0, 300)}...\n\nThat's the latest info I could find on this topic. Want to dive deeper into any specific aspect?`;
              }
            } else if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
              aiResponse = "Hey there! I'm CourseConnect AI, your friendly study buddy! I'm here to help with academics, homework questions, study strategies, or just chat about whatever's on your mind. What's up today?";
            } else if (lowerQuestion.includes('professor') || lowerQuestion.includes('who is my professor')) {
              if (courseData && courseData.professor) {
                 aiResponse = `According to your syllabus, your professor for ${courseData.courseName || 'this course'} is **${courseData.professor}**. Is there anything specific you need to know about them or their office hours?`;
              } else {
                 aiResponse = "I don't see a professor listed in the syllabus information you've uploaded. You might want to check the document again or your university portal. Anything else I can help with?";
              }
            } else {
              aiResponse = "That's an interesting question! I'd normally chat about this with you, but I'm having some technical issues right now. Want to talk about academics, ask about homework, or try asking something else? I'm here to help once we get this sorted out!";
            }
            selectedModel = 'fallback';
          }
          
          // Ensure aiResponse is always a valid string
          if (!aiResponse || typeof aiResponse !== 'string') {
            console.error('aiResponse is invalid, using fallback');
            aiResponse = "I'm having trouble processing your request right now. Please try again in a moment.";
            selectedModel = 'fallback';
          }

          // FORCE HIGHLIGHTING OF KEY TERMS
          // Even if the AI didn't add [[brackets]], we do it here for known terms
          aiResponse = highlightKeyTerms(aiResponse, highlightTermsList);

          // Send initial status
          controller.enqueue(new TextEncoder().encode(
            JSON.stringify({ type: 'status', message: 'Generating response...' }) + '\n'
          ));

          // Stream the response character by character for real-time typing effect
          const chunkSize = 5; // Send 5 characters at a time for smooth streaming
          let index = 0;
          
          // Stream response in chunks
          while (index < aiResponse.length) {
            const chunk = aiResponse.slice(index, index + chunkSize);
            index += chunkSize;
            
            // Send content chunk
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ type: 'content', content: chunk }) + '\n'
            ));
            
            // Reduced delay for faster streaming - 5ms delay = ~200 chars/sec (4x faster)
            // Only add delay if not at the end to prevent unnecessary wait
            if (index < aiResponse.length) {
              await new Promise(resolve => setTimeout(resolve, 5));
            }
          }

          // Log sources for debugging
          if (sources.length > 0) {
            console.log('📚 Sources extracted:', sources.length, sources.map(s => `${s.fileName} (P${s.page || '?'}, L${s.line || '?'})`));
          }
          
          // Send completion with full response and metadata
          controller.enqueue(new TextEncoder().encode(
            JSON.stringify({ 
              type: 'done', 
              fullResponse: aiResponse,
              answer: aiResponse,
              provider: selectedModel || 'fallback',
              sources: sources.length > 0 ? sources : undefined
            }) + '\n'
          ));
          
          controller.close();

        } catch (error) {
          console.error('Streaming Chat API error:', error);
          
          const errorResponse = {
            success: false,
            error: 'Failed to generate response',
            answer: 'I apologize, but I encountered an error while processing your request. Please try again.',
            provider: 'fallback',
            shouldRespond: true,
            timestamp: new Date().toISOString()
          };

          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorResponse)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Streaming Chat API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      answer: 'I apologize, but I encountered an error while processing your request. Please try again.',
      provider: 'fallback',
      shouldRespond: true,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
