/**
 * Utility to extract sources (citations) from syllabus text
 * Based on user questions and syllabus content
 */

export interface SyllabusSource {
  fileName: string;
  page?: number;
  line?: number;
  excerpt: string;
  relevanceScore: number;
}

interface SyllabusDocument {
  fileName: string;
  text: string;
  metadata?: {
    pageCount?: number;
    lineCount?: number;
    pages?: { [pageNumber: number]: string[] };
    lines?: { [lineNumber: number]: { page: number; content: string } };
  };
}

/**
 * Extract relevant sources from syllabus text based on user question
 */
export function extractSyllabusSources(
  question: string,
  syllabusText: string,
  fileName: string = 'Syllabus',
  metadata?: SyllabusDocument['metadata']
): SyllabusSource[] {
  const sources: SyllabusSource[] = [];
  const questionLower = question.toLowerCase();
  const questionWords = questionLower
    .split(/\s+/)
    .filter(w => w.length > 2) // Filter out short words
    .filter(w => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(w));

  if (questionWords.length === 0) {
    return sources;
  }

  // If we have line-level metadata, use it for precise citations
  if (metadata?.lines) {
    Object.entries(metadata.lines).forEach(([lineNumStr, lineData]) => {
      const lineNum = parseInt(lineNumStr);
      const lineLower = lineData.content.toLowerCase();
      const lineContent = lineData.content.trim();
      
      // Check if line contains any query words
      const matches = questionWords.filter(word => lineLower.includes(word));
      if (matches.length > 0) {
        const relevance = matches.length / questionWords.length;
        
        if (relevance > 0.2) { // At least 20% of query words match
          // Start with the exact matched line
          let excerpt = lineContent;
          
          // Get significant surrounding context (3 lines before, 3 lines after) to ensure full quote
          const contextLines: string[] = [];
          
          // Add lines before
          for (let i = Math.max(1, lineNum - 3); i < lineNum; i++) {
            const line = metadata.lines?.[i]?.content;
            if (line && line.trim().length > 0) contextLines.push(line.trim());
          }
          
          contextLines.push(lineContent);
          
          // Add lines after
          for (let i = lineNum + 1; i <= lineNum + 3; i++) {
            const line = metadata.lines?.[i]?.content;
            if (line && line.trim().length > 0) contextLines.push(line.trim());
          }
          
          // Join with spaces for readability
          excerpt = contextLines.join(' ').trim();
          
          // Clean up whitespace
          excerpt = excerpt.replace(/\s+/g, ' ').trim();
          
          // Cap at 1000 characters (generous limit for full context)
          if (excerpt.length > 1000) {
            excerpt = excerpt.substring(0, 1000) + '...';
          }
          
          sources.push({
            fileName,
            page: lineData.page,
            line: lineNum,
            excerpt: excerpt, // Now contains full context
            relevanceScore: relevance,
          });
        }
      }
    });
  } else {
    // Fallback: search through text without line metadata
    const textLower = syllabusText.toLowerCase();
    const sentences = syllabusText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const sentenceLower = sentence.toLowerCase();
      const sentenceContent = sentence.trim();
      const matches = questionWords.filter(word => sentenceLower.includes(word));
      
      if (matches.length > 0) {
        const relevance = matches.length / questionWords.length;
        
        if (relevance > 0.3) {
          // Estimate page number (rough approximation)
          const estimatedPage = metadata?.pageCount 
            ? Math.ceil((index / sentences.length) * metadata.pageCount)
            : 1;
          
          // Start with the exact matched sentence - this is what answers the question
          let excerpt = sentenceContent;
          
          // Only add surrounding sentences if the matched sentence is very short (< 40 chars)
          // This keeps the focus on the exact relevant information
          if (excerpt.length < 40) {
            // Get just 1 sentence before and after for minimal context
            const contextStart = Math.max(0, index - 1);
            const contextEnd = Math.min(sentences.length, index + 2);
            const contextSentences = sentences.slice(contextStart, contextEnd);
            excerpt = contextSentences.join(' ').trim();
          }
          
          // Clean up whitespace
          excerpt = excerpt.replace(/\s+/g, ' ').trim();
          
          // Cap at 250 characters, prioritizing the matched sentence
          if (excerpt.length > 250) {
            // Try to show the matched sentence with minimal truncation
            const sentenceIndex = excerpt.indexOf(sentenceContent);
            if (sentenceIndex >= 0 && sentenceIndex < 200) {
              // Show from start of matched sentence
              excerpt = excerpt.substring(sentenceIndex, sentenceIndex + 250).trim();
              if (excerpt.length === 250) {
                excerpt += '...';
              }
            } else {
              // Truncate at word boundary
              const truncated = excerpt.substring(0, 250);
              const lastSpace = truncated.lastIndexOf(' ');
              if (lastSpace > 200) {
                excerpt = excerpt.substring(0, lastSpace) + '...';
              } else {
                excerpt = truncated + '...';
              }
            }
          }
          
          sources.push({
            fileName,
            page: estimatedPage,
            excerpt: excerpt || sentenceContent, // Always fallback to exact sentence
            relevanceScore: relevance,
          });
        }
      }
    });
  }

  // Sort by relevance and return top 5
  return sources
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

/**
 * Extract sources from course data (for class chats)
 */
export function extractSourcesFromCourseData(
  question: string,
  courseData: any
): SyllabusSource[] {
  if (!courseData) return [];
  
  const fileName = courseData.fileName || `${courseData.courseCode || 'Course'} Syllabus`;
  const syllabusText = courseData.syllabusText || '';
  
  if (!syllabusText) return [];
  
  // Try to get metadata if available
  const metadata = courseData.metadata || {};
  
  return extractSyllabusSources(question, syllabusText, fileName, metadata);
}

/**
 * Parse citation format from AI response: [Source: filename, Page X, Line Y]
 */
export function parseCitationsFromResponse(
  response: string,
  courseData?: any
): Array<{ fileName: string; page?: number; line?: number; excerpt: string }> {
  const citations: Array<{ fileName: string; page?: number; line?: number; excerpt: string }> = [];
  const citationPattern = /\[Source:\s*([^,]+)(?:,\s*Page\s*(\d+))?(?:,\s*Line\s*(\d+))?\]/gi;

  // Helper to aggressively clean any excerpt we generate
  const cleanExcerpt = (raw: string): string => {
    if (!raw) return '';

    let excerpt = raw;

    // Strip internal follow-up markers that belong to the AI response, not the source
    excerpt = excerpt.replace(/\/\/\/FOLLOWUP_START\/\/\/[\s\S]*?\/\/\/FOLLOWUP_END\/\/\//g, '');

    // Remove any remaining [Source: ...] tags from the text itself
    excerpt = excerpt.replace(/\[Source:[^\]]+\]/gi, '');

    // Collapse whitespace/newlines
    excerpt = excerpt.replace(/\s+/g, ' ').trim();

    // Hard cap to keep snippets short and readable
    if (excerpt.length > 250) {
      excerpt = excerpt.substring(0, 247).trim() + '...';
    }

    return excerpt;
  };
  
  let match;
  while ((match = citationPattern.exec(response)) !== null) {
    const fileName = match[1].trim();
    const page = match[2] ? parseInt(match[2]) : undefined;
    const line = match[3] ? parseInt(match[3]) : undefined;
    
    // Try to get excerpt from course data if available.
    // PRIORITY: use the actual syllabus text whenever we can so the snippet is a REAL quote.
    let excerpt = '';
    if (courseData?.syllabusText && line && courseData.metadata?.lines?.[line]) {
      const lineData = courseData.metadata.lines[line];

      // Prefer the exact line plus a bit of surrounding context if we have it
      const surroundingLines: string[] = [];
      const lineNum = line;

      for (let i = Math.max(1, lineNum - 1); i <= lineNum + 1; i++) {
        const l = courseData.metadata.lines[i];
        if (l && l.content && l.content.trim().length > 0) {
          surroundingLines.push(l.content.trim());
        }
      }

      excerpt = surroundingLines.join(' ');
    } else if (courseData?.syllabusText) {
      // We know the syllabus content but not the exact line:
      // take a direct slice from the raw syllabus text so it's always a REAL quote.
      // This ensures we are 100% quoting the actual document, not inventing text.
      excerpt = courseData.syllabusText.substring(0, 250);
    } else {
      // Last resort: use nearby context from the AI response itself
      // and then aggressively clean it so we don't leak internal markers.
      const contextStart = Math.max(0, match.index - 80);
      const contextEnd = Math.min(response.length, match.index + match[0].length + 80);
      excerpt = response.substring(contextStart, contextEnd);
    }

    const cleanedExcerpt = cleanExcerpt(excerpt);
    
    citations.push({
      fileName,
      page,
      line,
      excerpt: cleanedExcerpt || `Referenced in ${fileName}`,
    });
  }
  
  return citations;
}

