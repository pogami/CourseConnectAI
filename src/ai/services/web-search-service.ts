/**
 * Web Search Service for Real-Time Information
 * 
 * This service provides current information using ONLY Google Custom Search API
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  date?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
  timestamp: string;
}

/**
 * Search for current information using ONLY Google Custom Search API
 */
let lastSearchTime = 0;
const MIN_SEARCH_INTERVAL = 1000; // 1 second between searches

export async function searchCurrentInformation(query: string): Promise<WebSearchResponse> {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.log('⚠️ Invalid query provided to searchCurrentInformation');
      return {
        results: [],
        query: '',
        timestamp: new Date().toISOString()
      };
    }
    // Query logging removed for production
    
    // Check rate limits
    const now = Date.now();
    if (now - lastSearchTime < MIN_SEARCH_INTERVAL) {
      console.log('⚠️ Rate limiting: waiting before next search');
      await new Promise(resolve => setTimeout(resolve, MIN_SEARCH_INTERVAL - (now - lastSearchTime)));
    }
    
    const results: WebSearchResult[] = [];
    
    // Get Google API credentials
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    // Note: Logging removed for production security - API keys and engine IDs should not be logged
    
    // Validate that we have actual string values (not just truthy)
    if (!googleApiKey || typeof googleApiKey !== 'string' || googleApiKey.trim().length === 0 ||
        googleApiKey === 'demo-key' || googleApiKey === 'your_google_search_key_here') {
      console.error('❌ GOOGLE_SEARCH_API_KEY is missing or invalid');
      console.error('   Value:', googleApiKey);
      console.error('   Type:', typeof googleApiKey);
      return {
        results: [],
        query,
        timestamp: new Date().toISOString()
      };
    }
    
    if (!googleSearchEngineId || typeof googleSearchEngineId !== 'string' || googleSearchEngineId.trim().length === 0 ||
        googleSearchEngineId === 'demo-engine-id' || googleSearchEngineId === 'your_search_engine_id_here') {
      console.error('❌ GOOGLE_SEARCH_ENGINE_ID is missing or invalid');
      console.error('   Value:', googleSearchEngineId);
      console.error('   Type:', typeof googleSearchEngineId);
      return {
        results: [],
        query,
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      console.log('🔍 Using Google Custom Search API...');
      
      const limitFromEnv = parseInt(process.env.SEARCH_RESULTS_LIMIT || "12", 10);
      const limit = Number.isFinite(limitFromEnv) && limitFromEnv > 0 && limitFromEnv <= 20 ? limitFromEnv : 12;
      
      // Ensure query is properly encoded (API key and engine ID should NOT be encoded)
      const encodedQuery = encodeURIComponent(query.trim());
      
      // Build URL - only encode the query, not the API key or engine ID
      const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodedQuery}&num=${limit}`;
      
      // Logging removed for production security
      
      const googleResponse = await fetch(googleSearchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CourseConnect-AI/1.0; +https://courseconnectai.com)',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        console.log('🔍 Google Raw Response Stats:', {
          kind: googleData.kind,
          totalResults: googleData.searchInformation?.totalResults,
          itemsCount: googleData.items?.length || 0
        });
        
        if (googleData.items && googleData.items.length > 0) {
          googleData.items.forEach((item: any) => {
            results.push({
              title: item.title || 'Untitled',
              snippet: item.snippet || 'No description available',
              url: item.link || '',
              date: new Date().toISOString()
            });
          });
          console.log('✅ Google search completed with', results.length, 'results');
          lastSearchTime = Date.now();
        } else {
          console.log('⚠️ Google returned OK (200) but "items" array was empty/missing.');
          // This happens if the query matches nothing, or the CSE is misconfigured (e.g. restrictive site list)
        }
      } else {
        console.error('❌ Google Search API error:', googleResponse.status, googleResponse.statusText);
        const errorText = await googleResponse.text();
        console.error('Raw error text:', errorText);
        
        // Return this specific error to the UI so we can see it
        return {
          results: [{
            title: `Google API Error: ${googleResponse.status}`,
            snippet: `Raw Error: ${errorText.substring(0, 300)}...`,
            url: 'https://console.cloud.google.com/apis/api/customsearch.googleapis.com/metrics',
            date: new Date().toISOString()
          }],
          query,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ Google Custom Search failed:', error);
    }
    
    // If no results from Google, return empty results
    if (results.length === 0) {
      console.log('⚠️ No results found from Google Search');
      return {
        results: [{
          title: 'No Results Found',
          snippet: 'The search query returned no results. This could be due to API key configuration, quota limits, or the query itself.',
          url: '#',
          date: new Date().toISOString()
        }],
        query,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('🎯 Google search completed with', results.length, 'results');
    
    return {
      results: results.slice(0, Number(process.env.SEARCH_RESULTS_LIMIT || 12)),
      query,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Google search failed:', error);
    
    return {
      results: [{
        title: 'Google Search Error',
        snippet: `Search failed due to an error. Please check your Google Search API configuration.`,
        url: 'https://console.cloud.google.com/',
        date: new Date().toISOString()
      }],
      query,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check if a query needs current information
 * Only return true for specific current events, news, weather, etc.
 */
export function needsCurrentInformation(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // Only search for specific current information topics
  const currentInfoKeywords = [
    'weather', 'temperature', 'forecast',
    'news', 'latest', 'recent', 'today', 'now',
    'stock', 'market', 'price', 'crypto', 'bitcoin',
    'election', 'politics', 'breaking',
    'sports', 'game', 'score', 'nba', 'nfl', 'mlb',
    'covid', 'pandemic', 'virus',
    'earthquake', 'hurricane', 'disaster'
  ];
  
  return currentInfoKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResultsForAI(searchResponse: WebSearchResponse): string {
  if (searchResponse.results.length === 0) {
    return '';
  }
  
  const formattedResults = searchResponse.results.map((result, index) => {
    return `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.url}\n`;
  }).join('\n');
  
  return `\n\n🔍 REAL-TIME SEARCH RESULTS (${new Date().toLocaleDateString()}):\nIMPORTANT: Use ONLY this current information to answer questions. Do NOT use outdated training data when current information is available.\n\n${formattedResults}\n\nCRITICAL: Base your response ONLY on the current information above. Ignore any outdated information from your training data.`;
}
