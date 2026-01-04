/**
 * Enhanced Web Browsing Service with Puppeteer
 * 
 * This service provides advanced web browsing capabilities including:
 * - Automatic web search when AI doesn't know something
 * - JavaScript-heavy site handling with Puppeteer
 * - Screenshot capture
 * - Form interaction and dynamic content
 */

import { searchCurrentInformation, formatSearchResultsForAI } from './web-search-service';

export interface BrowsingResult {
  success: boolean;
  content?: string;
  title?: string;
  url?: string;
  screenshot?: string; // Base64 encoded screenshot
  error?: string;
  searchResults?: string;
}

export interface AutoSearchResult {
  shouldSearch: boolean;
  searchQuery?: string;
  confidence: number;
}

/**
 * Check if the AI should automatically search for information
 */
export function shouldAutoSearch(question: string, aiResponse: string): AutoSearchResult {
  // Disable automatic search - only search when explicitly requested via @search or search button
  return {
    shouldSearch: false,
    searchQuery: undefined,
    confidence: 0
  };
}

/**
 * Enhanced web scraping with Puppeteer for JavaScript-heavy sites
 */
export async function browseWithPuppeteer(url: string, options: {
  takeScreenshot?: boolean;
  waitForContent?: boolean;
  timeout?: number;
} = {}): Promise<BrowsingResult> {
  // Puppeteer is only available in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME === 'edge') {
    return {
      success: false,
      error: 'Puppeteer is not available in the Edge runtime.'
    };
  }

  let browser: any = null;
  
  try {
    // Dynamic import to avoid breaking Edge runtime
    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;
    
    console.log('🌐 Starting Puppeteer browsing for:', url);
    
    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }
    } catch (error) {
      return {
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.'
      };
    }
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (compatible; CourseConnect-AI/1.0; +https://courseconnectai.com)');
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: options.timeout || 15000 
    });
    
    // Wait for content if requested
    if (options.waitForContent) {
      await page.waitForSelector('body', { timeout: 5000 });
      // Wait a bit more for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Extract title
    const title = await page.title();
    
    // Extract content
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Get main content areas
      const mainSelectors = [
        'main', 'article', '[role="main"]', '.content', '.post-content',
        '.entry-content', '.article-content', '.main-content', '#content',
        '.post', '.entry', '.page-content'
      ];
      
      let contentElement = null;
      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.length > 100) {
          contentElement = element;
          break;
        }
      }
      
      // Fallback to body if no main content found
      if (!contentElement) {
        contentElement = document.body;
      }
      
      if (!contentElement) {
        return '';
      }
      
      // Extract text content
      let text = contentElement.textContent || '';
      
      // Clean up text
      text = text.replace(/\s+/g, ' ').trim();
      
      return text;
    });
    
    // Take screenshot if requested
    let screenshot: string | undefined;
    if (options.takeScreenshot) {
      screenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: false // Just visible area for smaller size
      });
    }
    
    console.log('✅ Puppeteer browsing completed:', {
      title,
      contentLength: content.length,
      url
    });
    
    return {
      success: true,
      content,
      title,
      url,
      screenshot
    };
    
  } catch (error) {
    console.error('❌ Puppeteer browsing failed:', error);
    
    let errorMessage = 'Failed to browse the web page.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'The page took too long to load. Please try a different URL.';
      } else if (error.message.includes('net::')) {
        errorMessage = 'Could not access the URL. Please check if the link is correct and accessible.';
      } else {
        errorMessage = `Browsing error: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Perform automatic web search when AI doesn't know something
 */
export async function performAutoSearch(searchQuery: string): Promise<string> {
  try {
    console.log('🔍 Performing automatic search for:', searchQuery);
    
    const searchResults = await searchCurrentInformation(searchQuery);
    const formattedResults = formatSearchResultsForAI(searchResults);
    
    console.log('✅ Auto search completed');
    
    return formattedResults;
    
  } catch (error) {
    console.warn('❌ Auto search failed:', error);
    return '';
  }
}

/**
 * Enhanced web browsing that tries multiple methods
 */
export async function enhancedWebBrowsing(url: string, options: {
  usePuppeteer?: boolean;
  takeScreenshot?: boolean;
  autoSearchFallback?: boolean;
} = {}): Promise<BrowsingResult> {
  
  // Try Puppeteer first if requested
  if (options.usePuppeteer) {
    const puppeteerResult = await browseWithPuppeteer(url, {
      takeScreenshot: options.takeScreenshot,
      waitForContent: true,
      timeout: 15000
    });
    
    if (puppeteerResult.success) {
      return puppeteerResult;
    }
    
    console.log('⚠️ Puppeteer failed, falling back to regular fetch');
  }
  
  // Fallback to regular fetch (existing web scraping)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CourseConnect-AI/1.0; +https://courseconnectai.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract content (simplified version of existing logic)
    let content = '';
    const mainContentSelectors = [
      'main', 'article', '[role="main"]', '.content', '.post-content',
      '.entry-content', '.article-content', '.main-content', '#content'
    ];
    
    for (const selector of mainContentSelectors) {
      const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\/${selector}>`, 'i');
      const match = html.match(regex);
      if (match && match[1].length > content.length) {
        content = match[1];
      }
    }
    
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      content = bodyMatch ? bodyMatch[1] : html;
    }
    
    // Clean HTML
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<[^>]*>/g, '');
    content = content.replace(/\s+/g, ' ').trim();
    
    return {
      success: true,
      content,
      title,
      url
    };
    
  } catch (error) {
    console.error('❌ Enhanced browsing failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if a URL would benefit from Puppeteer browsing
 */
export function shouldUsePuppeteer(url: string): boolean {
  const puppeteerDomains = [
    'spa', 'app', 'dashboard', 'admin', 'portal',
    'react', 'vue', 'angular', 'nextjs', 'nuxt'
  ];
  
  const lowerUrl = url.toLowerCase();
  
  // Check for JavaScript-heavy indicators
  const hasJSIndicator = puppeteerDomains.some(domain => 
    lowerUrl.includes(domain)
  );
  
  // Check for common SPA patterns
  const hasSPAPattern = lowerUrl.includes('#') || 
                       lowerUrl.includes('?') && lowerUrl.includes('=') ||
                       lowerUrl.includes('/app/') ||
                       lowerUrl.includes('/dashboard/');
  
  return hasJSIndicator || hasSPAPattern;
}
