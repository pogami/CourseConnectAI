import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the webpage with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract metadata
    const citationData = extractCitationData(html, url);
    
    return NextResponse.json(citationData);
  } catch (error) {
    console.error('Citation scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URL' }, 
      { status: 500 }
    );
  }
}

function extractCitationData(html: string, url: string) {
  // Extract title from various meta tags
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Extract author from various meta tags
  const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*property=["']book:author["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*name=["']twitter:creator["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown Author';

  // Extract publisher/site name
  const publisherMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*name=["']publisher["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  const publisher = publisherMatch ? publisherMatch[1].trim() : extractDomainName(url);

  // Extract publication date - prioritize published time over modified time
  const publishedMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const modifiedMatch = html.match(/<meta[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const dateMatch = html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                   html.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                   html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i);
  
  // Use published time first, then modified time, then other date fields
  const publicationDate = publishedMatch ? publishedMatch[1].trim() : 
                         modifiedMatch ? modifiedMatch[1].trim() : 
                         dateMatch ? dateMatch[1].trim() : null;

  // Extract last modified date
  const lastModifiedMatch = html.match(/<meta[^>]*name=["']last-modified["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const lastModified = lastModifiedMatch ? lastModifiedMatch[1].trim() : null;

  return {
    title: cleanText(title),
    author: cleanText(author),
    publisher: cleanText(publisher),
    publicationDate,
    lastModified,
    siteName: extractDomainName(url),
    url,
    // Additional metadata for better citations
    description: extractDescription(html),
    keywords: extractKeywords(html),
    // For APA: use site name as publisher, not duplicated publisher
    siteNameForAPA: extractDomainName(url)
  };
}

function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown Site';
  }
}

function extractDescription(html: string): string {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                   html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  return descMatch ? cleanText(descMatch[1]).substring(0, 200) : '';
}

function extractKeywords(html: string): string {
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  return keywordsMatch ? cleanText(keywordsMatch[1]) : '';
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalizeTitleForAPA(title: string): string {
  // APA title capitalization: first word, first word after colon, and proper nouns only
  const words = title.split(' ');
  const capitalizedWords = words.map((word, index) => {
    // Always capitalize first word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Check if previous word ended with colon (indicates subtitle)
    const prevWord = words[index - 1];
    if (prevWord.endsWith(':')) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // For other words, only capitalize if they're proper nouns or common exceptions
    const properNouns = ['AI', 'API', 'CEO', 'CTO', 'USA', 'UK', 'NASA', 'FBI', 'CIA', 'UN', 'WHO'];
    const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'so', 'the', 'to', 'up', 'via', 'yet'];
    
    if (properNouns.includes(word.toUpperCase())) {
      return word.toUpperCase();
    } else if (lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });
  
  return capitalizedWords.join(' ');
}
