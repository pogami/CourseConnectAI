import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, currentSources } = await request.json();
    
    console.log('🔄 Background enhancement started for:', question);
    
    // Use LLaMA 3.1 for deeper source analysis
    const enhancedPrompt = `You are a research assistant. For the question "${question}", suggest 3-5 additional specific search terms that would find more comprehensive sources. Focus on:
- Different aspects of the topic
- Recent developments
- Expert opinions
- Academic sources
- News sources

Return only the search terms, one per line, no explanations.`;

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: enhancedPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_tokens: 100,
          num_ctx: 1024
        }
      })
    });

    if (ollamaResponse.ok) {
      const result = await ollamaResponse.json();
      const searchTerms = result.response.split('\n').filter((term: string) => term.trim());
      
      console.log('🔍 Enhanced search terms:', searchTerms);
      
      // TODO: Use these search terms to find additional sources
      // This would integrate with the web search system
      
      return NextResponse.json({
        success: true,
        enhancedSearchTerms: searchTerms,
        message: 'Background enhancement completed'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Background enhancement failed'
    });
    
  } catch (error) {
    console.error('Background enhancement error:', error);
    return NextResponse.json({
      success: false,
      message: 'Background enhancement error'
    });
  }
}
