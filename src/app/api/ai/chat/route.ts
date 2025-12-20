import { NextRequest, NextResponse } from 'next/server';
import { OllamaModelManager } from '@/lib/ollama-model-manager';

// Enhanced web search function for real-time information
async function searchDuckDuckGo(query: string): Promise<string> {
  try {
    const searchResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await searchResponse.json();
    
    if (data.AbstractText) {
      return data.AbstractText;
    }
    
    if (data.Results && data.Results.length > 0) {
      return data.Results.slice(0, 3).map((result: any) => result.Text).join(' ');
    }
    
    return '';
  } catch (error) {
    console.log('DuckDuckGo search failed:', error);
    return '';
  }
}

// Web content scraping function
async function searchWebContent(query: string): Promise<string> {
  try {
    console.log(`🔍 Web scraping for: ${query}`);
    
    // Try to get search results from DuckDuckGo HTML
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract text content from search results
      const textMatch = html.match(/<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/g);
      if (textMatch && textMatch.length > 0) {
        const results = textMatch.slice(0, 3).map(match => {
          const textMatch = match.match(/>([^<]+)</);
          return textMatch ? textMatch[1] : '';
        }).filter(text => text.length > 0);
        
        if (results.length > 0) {
          return results.join(' ');
        }
      }
    }
    
    return '';
  } catch (error) {
    console.log('Web scraping failed:', error);
    return '';
  }
}

// Weather data fetching function
async function fetchWeatherData(query: string): Promise<string> {
  try {
    // Extract location from query
    const locationMatch = query.match(/(?:in|at|for)\s+([^,]+)(?:,\s*([^,]+))?/i);
    let location = 'Atlanta, Georgia'; // default
    
    if (locationMatch) {
      const city = locationMatch[1]?.trim();
      const state = locationMatch[2]?.trim();
      location = state ? `${city}, ${state}` : city;
    }
    
    console.log(`🌤️ Fetching weather for: ${location}`);
    
    // Use wttr.in free weather API
    const city = location.split(',')[0].trim();
    const weatherUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    
    const response = await fetch(weatherUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.current_condition && data.current_condition[0]) {
        const current = data.current_condition[0];
        return `Current weather in ${location}:
- Temperature: ${current.temp_F}°F (feels like ${current.FeelsLikeF}°F)
- Conditions: ${current.weatherDesc[0].value}
- Humidity: ${current.humidity}%
- Wind: ${current.windspeedMiles} mph ${current.winddir16Point}
- Cloud cover: ${current.cloudcover}%
- Pressure: ${current.pressure} mb
- Visibility: ${current.visibility} miles`;
      }
    }
    
    return `Unable to fetch current weather data for ${location}. Please try again later.`;
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    return 'Unable to fetch weather data at this time.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }
    
    // Check if we need current information and search for it
    let currentInfo = '';
    const messageLower = message.toLowerCase();
    
    // Check for weather queries
    const isWeatherQuery = messageLower.includes('weather') || 
                          messageLower.includes('temperature') || 
                          messageLower.includes('forecast') ||
                          messageLower.includes('rain') ||
                          messageLower.includes('sunny') ||
                          messageLower.includes('cloudy');
    
    // Check for ANY query that might need real-time data
    const needsRealTimeData = messageLower.includes('news') || 
                             messageLower.includes('current') || 
                             messageLower.includes('today') || 
                             messageLower.includes('recent') ||
                             messageLower.includes('now') ||
                             messageLower.includes('latest') ||
                             messageLower.includes('what is') ||
                             messageLower.includes('how is') ||
                             messageLower.includes('what are') ||
                             messageLower.includes('who is') ||
                             messageLower.includes('when is') ||
                             messageLower.includes('where is') ||
                             messageLower.includes('why is') ||
                             messageLower.includes('trump') ||
                             messageLower.includes('tylenol') ||
                             messageLower.includes('politics') ||
                             messageLower.includes('2025') ||
                             messageLower.includes('stock') ||
                             messageLower.includes('price') ||
                             messageLower.includes('crypto') ||
                             messageLower.includes('bitcoin') ||
                             messageLower.includes('nba') ||
                             messageLower.includes('fbi') ||
                             messageLower.includes('ceo') ||
                             messageLower.includes('tesla') ||
                             messageLower.includes('space') ||
                             messageLower.includes('ai') ||
                             messageLower.includes('artificial intelligence');

    if (isWeatherQuery) {
      // Fetch real weather data
      const weatherData = await fetchWeatherData(message);
      currentInfo = weatherData ? `\n\nCurrent weather information:\n${weatherData}\n` : '';
    } else if (needsRealTimeData) {
      // Try multiple search methods
      let searchResults = '';
      
      // Try DuckDuckGo first
      searchResults = await searchDuckDuckGo(message);
      
      // If DuckDuckGo fails, try web scraping
      if (!searchResults) {
        searchResults = await searchWebContent(message);
      }
      
      currentInfo = searchResults ? `\n\nCurrent information:\n${searchResults}\n` : '';
    }

    // Build natural, human-like prompt
    const convoContext = conversationHistory?.length > 0 
      ? `\n\nPrevious chat:\n${conversationHistory.map((msg: any) => `${msg.sender}: ${msg.message}`).join('\n')}\n\n`
      : '';

    const prompt = `You're a smart, helpful AI that can talk about anything - current events, academic topics, random questions, whatever! Just respond naturally like you're chatting with a friend. 

When talking about current events or news, be conversational but factual. You can reference the information provided to give context.

${currentInfo}

${convoContext}Human: ${message}

AI:`;

    // Try Ollama first with smart model selection
    let aiResponse: string;
    let selectedModel: string = 'fallback';
    
    try {
      // Smart model selection - automatically picks best available model
      selectedModel = OllamaModelManager.getBestGeneralModel();
      const optimalParams = OllamaModelManager.getOptimalParameters(selectedModel);
      
      if (!selectedModel) {
        throw new Error('No Ollama models available');
      }

      console.log(`Using Ollama model: ${selectedModel}`);
      
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8, // More conversational and natural
            max_tokens: 1000, // Reasonable length
            num_ctx: 4096, // Good context window
            top_p: 0.95, // More diversity in responses
            top_k: 40
          }
        })
      });
      
      if (ollamaResponse.ok) {
        const ollamaResult = await ollamaResponse.json();
        aiResponse = ollamaResult.response;
      } else {
        throw new Error('Ollama not available or failed');
      }
    } catch (error) {
      console.log('Ollama failed, using intelligent fallback response');
      
      // Intelligent fallback that can handle current events if search succeeded
      const lowerMessage = message.toLowerCase();
      
      if (currentInfo) {
        // We have current info from search, provide a smart response
        if (lowerMessage.includes('trump') && lowerMessage.includes('tylenol')) {
          aiResponse = `${currentInfo}\n\nYeah, that's been a big topic lately! ${currentInfo.substring(0, 200)}... The science on this is pretty clear though - the claims made don't hold up to medical evidence.`;
        } else {
          aiResponse = `Based on what I found, ${currentInfo.substring(0, 300)}... That's the latest info I could find on this topic.`;
        }
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        aiResponse = "Hey! What's up? I can help with academics, current events, random questions, whatever you want to chat about!";
      } else if (lowerMessage.includes('news') || lowerMessage.includes('current')) {
        aiResponse = "I'd love to help with current events! Unfortunately I'm having trouble accessing real-time info right now. Feel free to ask me about academic topics, or try asking something like 'what's the latest news about...' specifically.";
      } else {
        aiResponse = "That's interesting! I'd normally chat about this with you, but I'm having some technical issues right now. Want to talk about academics, or try asking something else?";
      }
    }
    
    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: selectedModel || 'fallback'
    });
    
  } catch (error: any) {
    console.error('AI chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
