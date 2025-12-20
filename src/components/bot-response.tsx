"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "katex/dist/katex.min.css";
import { TruncatedText } from './truncated-text';
import { AIResponse } from './ai-response';
import {
  Copy01Icon,
  CheckmarkCircle01Icon,
  Book01Icon,
  QuoteUpIcon,
  Search01Icon,
  Cancel01Icon,
  SparklesIcon,
  ArrowRight01Icon,
  Download01Icon,
  ZoomIcon,
  RotateLeft01Icon,
  ViewIcon,
  ViewOffIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SourceIcon } from './source-icon';
import { InteractiveQuiz } from './interactive-quiz';
import { FullExamModal } from './full-exam-modal';
import { AIFeedback } from './ai-feedback';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { FeatureDisabled } from './feature-disabled';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { InteractiveGraph } from '@/components/interactive-graph';

// Detect if content looks like data points (array of {x, y})
function looksLikeGraph(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.every((p: any) => "x" in p && "y" in p);
  } catch {
    return false;
  }
}

// Detect if content contains quiz data
function extractQuizData(content: string): { type: 'quiz' | 'exam' | null, data: any } {
  try {
    // Look for QUIZ_DATA: or EXAM_DATA: markers
    // Capture everything from opening brace to end of line (single-line JSON)
    const quizMatch = content.match(/QUIZ_DATA:\s*(\{[^\n]*\})/);
    const examMatch = content.match(/EXAM_DATA:\s*(\{[^\n]*\})/);
    
    if (quizMatch) {
      console.log('Found QUIZ_DATA marker');
      const jsonStr = quizMatch[1].trim();
      console.log('Extracted JSON string (first 200 chars):', jsonStr.substring(0, 200) + '...');
      const data = JSON.parse(jsonStr);
      console.log('Successfully parsed quiz data with', data.questions?.length, 'questions');
      return { type: 'quiz', data };
    }
    
    if (examMatch) {
      console.log('Found EXAM_DATA marker');
      const jsonStr = examMatch[1].trim();
      console.log('Extracted JSON string (first 200 chars):', jsonStr.substring(0, 200) + '...');
      const data = JSON.parse(jsonStr);
      console.log('Successfully parsed exam data with', data.questions?.length, 'questions');
      return { type: 'exam', data };
    }
    
    return { type: null, data: null };
  } catch (error) {
    console.error('Failed to parse quiz data. Error:', error);
    console.error('Content preview:', content.substring(0, 500));
    return { type: null, data: null };
  }
}

// Detect and extract graph data
function extractGraphData(content: string): { type: 'function' | 'data' | null, data: any } {
  try {
    if (!content || typeof content !== 'string') {
      return { type: null, data: null };
    }
    
    // Look for GRAPH_DATA: marker - find the opening brace and match balanced braces
    const graphMatch = content.match(/GRAPH_DATA:\s*(\{)/);
    
    if (graphMatch && graphMatch.index !== undefined) {
      const startIndex = graphMatch.index + graphMatch[0].length - 1; // Position of opening brace
      let braceCount = 0;
      let endIndex = startIndex;
      
      // Find the matching closing brace
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > startIndex) {
        const jsonStr = content.substring(startIndex, endIndex).trim();
        try {
          const data = JSON.parse(jsonStr);
          if (data && typeof data === 'object') {
            console.log('Successfully parsed graph data:', data.type);
            return { type: data.type || 'function', data: data || {} };
          }
        } catch (parseError) {
          console.error('Failed to parse graph JSON:', parseError);
          return { type: null, data: null };
        }
      }
    }
    
    // Also check for simple JSON array of {x, y} points at the start/end of content
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmedContent);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((p: any) => p && typeof p === 'object' && "x" in p && "y" in p)) {
          console.log('Found simple graph data array');
          return {
            type: 'data',
            data: {
              type: 'data',
              chartType: 'line',
              points: parsed
            }
          };
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    
    return { type: null, data: null };
  } catch (error) {
    console.error('Failed to extract graph data. Error:', error);
    return { type: null, data: null };
  }
}

// Helper to extract follow-up questions
function extractFollowUps(content: string): { text: string, followUps: string[] } {
  // Try to find the block
  const match = content.match(/\/\/\/FOLLOWUP_START\/\/\/([\s\S]*?)\/\/\/FOLLOWUP_END\/\/\//);
  if (match) {
    try {
      const jsonStr = match[1].trim();
      const followUps = JSON.parse(jsonStr);
      
      if (Array.isArray(followUps) && followUps.length > 0) {
        // Filter out any invalid entries and limit to 3
        const validFollowUps = followUps
          .filter((f: any) => typeof f === 'string' && f.trim().length > 0)
          .slice(0, 3)
          .map((f: string) => f.trim());
        
        if (validFollowUps.length > 0) {
          return {
            text: content.replace(match[0], '').trim(),
            followUps: validFollowUps
          };
        }
      }
    } catch (e) {
      // Silently fail - if JSON is malformed, just don't show follow-ups
      // This prevents the app from crashing
      console.warn('Failed to parse follow-ups JSON (this is okay, follow-ups will be skipped):', match[1]?.substring(0, 100));
    }
  }
  return { text: content, followUps: [] };
}

// Helper function to highlight @ai mentions
const highlightAIMentions = (text: string) => {
  return text.replace(/(?<!\w)@ai(?!\w)/gi, (match) => 
    `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">${match}</span>`
  );
};

// Convert markdown links to actual clickable HTML links
const convertMarkdownLinks = (text: string) => {
  // Match [text](url) pattern
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors" title="${url}">${linkText}</a>`;
  });
};

// Parse citations from content: [Source: filename, Page X, Line Y] or 📎 filename (PX, LY)
const parseCitations = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Pattern 1: [Source: filename, Page X, Line Y]
  const citationPattern1 = /\[Source:\s*([^,]+)(?:,\s*Page\s*(\d+))?(?:,\s*Line\s*(\d+))?\]/gi;
  // Pattern 2: 📎 filename (PX, LY)
  const citationPattern2 = /📎\s*([^(]+)\s*\(P(\d+),?\s*L(\d+)?\)/gi;
  
  const combinedPattern = new RegExp(
    `(${citationPattern1.source}|${citationPattern2.source})`,
    'gi'
  );
  
  let match;
  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Extract citation details
    let fileName = '';
    let page: number | undefined;
    let line: number | undefined;
    
    if (match[0].startsWith('[')) {
      // Pattern 1 format
      fileName = match[1]?.trim() || '';
      page = match[2] ? parseInt(match[2]) : undefined;
      line = match[3] ? parseInt(match[3]) : undefined;
    } else {
      // Pattern 2 format
      fileName = match[1]?.trim() || '';
      page = match[2] ? parseInt(match[2]) : undefined;
      line = match[3] ? parseInt(match[3]) : undefined;
    }
    
    // Add highlighted citation badge
    parts.push(
      <span
        key={`citation-${match.index}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
      >
        📎 {fileName}
        {page !== undefined && ` (P${page}`}
        {line !== undefined && `, L${line}`}
        {page !== undefined && ')'}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : <>{text}</>;
};

// Convert [[Term]] into highlighted spans
const convertHighlightedTerms = (text: string) => {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const cleaned = term.trim();
    if (!cleaned) return term;
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 font-medium transition-colors border border-blue-100 dark:border-blue-500/20">${cleaned}</span>`;
  });
};

// Detect math and render with KaTeX
function renderMathLine(line: string, i: number) {
  // Check if line contains any math delimiters
  const hasMath = line.includes("$$") || (line.includes("$") && line.includes("$")) || 
                  (line.includes("\\(") && line.includes("\\)")) || 
                  (line.includes("\\[") && line.includes("\\]")) ||
                  line.includes("\\boxed{");
  
  if (!hasMath) {
    // No math, return as regular text with bold formatting
    let processedLine = line
      .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>'); // Convert italic to bold instead
    
    // Convert markdown links to clickable HTML links
    processedLine = convertMarkdownLinks(processedLine);
    processedLine = convertHighlightedTerms(processedLine);
    
    return (
      <p key={i} className="text-sm not-italic break-words max-w-full overflow-hidden leading-7 font-sans" dangerouslySetInnerHTML={{ __html: processedLine }} />
    );
  }

  // Split the line by math expressions and render each part appropriately
  const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\)|\\boxed\{[^}]*\})/);
  
  // Check if this line contains block math (which renders as <div>)
  const hasBlockMath = parts.some(part => 
    (part.startsWith('$$') && part.endsWith('$$')) || 
    (part.startsWith('\\[') && part.endsWith('\\]'))
  );
  
  // Use <div> instead of <p> if there's block math to avoid invalid HTML nesting
  const ContainerTag = hasBlockMath ? 'div' : 'p';
  
  return (
    <ContainerTag key={i} className="text-sm not-italic break-words max-w-full overflow-hidden leading-7 font-sans">
      {parts.map((part, partIndex) => {
        // Block math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const mathContent = part.slice(2, -2).trim();
          return <BlockMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Block math (\[...\])
        else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const mathContent = part.slice(2, -2).trim();
          return <BlockMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Inline math ($...$)
        else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const mathContent = part.slice(1, -1).trim();
          return <InlineMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Inline math (\(...\))
        else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const mathContent = part.slice(2, -2).trim();
          return <InlineMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Boxed math
        else if (part.startsWith('\\boxed{') && part.endsWith('}')) {
          const boxedMatch = part.match(/\\boxed\{([^}]+)\}/);
          if (boxedMatch) {
            const boxedContent = boxedMatch[1];
            return (
              <span key={`${i}-${partIndex}`} className="inline-block border border-foreground px-3 py-2 bg-transparent">
                <InlineMath math={boxedContent} />
              </span>
            );
          }
        }
        // Regular text with formatting
        else if (part.trim()) {
          let processedPart = part
            .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>'); // Convert italic to bold instead
          
          processedPart = convertMarkdownLinks(processedPart);
          processedPart = convertHighlightedTerms(processedPart);
          
          return <span key={`${i}-${partIndex}`} dangerouslySetInnerHTML={{ __html: processedPart }} />;
        }
        return null;
      })}
    </ContainerTag>
  );
}

// Helper to render inline math and text for buttons
function renderInlineContent(text: string) {
  // 1. Remove highlighted term brackets [[Term]] -> Term
  const cleanText = text.replace(/\[\[(.*?)\]\]/g, '$1');
  
  // 2. Split by math delimiters
  // Matches $...$ (inline math) or \(...\) (inline math)
  const parts = cleanText.split(/(\$[^$]+?\$|\\\([^)]+?\\\))/);
  
  return (
    <>
      {parts.map((part, index) => {
         if (part.startsWith('$') && part.endsWith('$')) {
           const mathContent = part.slice(1, -1).trim();
           return <InlineMath key={index} math={mathContent} />;
         } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
           const mathContent = part.slice(2, -2).trim();
           return <InlineMath key={index} math={mathContent} />;
         } else {
           return <span key={index}>{part}</span>;
         }
      })}
    </>
  );
}

// Function to break long text into paragraphs
function breakIntoParagraphs(text: string): string[] {
  // Split by double newlines first (paragraph breaks)
  let paragraphs = text.split('\n\n');
  
  // If no paragraph breaks, try to create them from long sentences
  if (paragraphs.length === 1) {
    // Use a regex that captures both the sentence and its punctuation
    // This preserves exclamation marks, question marks, and periods
    const sentenceRegex = /([^.!?]+)([.!?]+)/g;
    const sentences: Array<{text: string, punctuation: string}> = [];
    let match;
    
    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = match[1].trim();
      const punctuation = match[2];
      if (sentenceText.length > 0) {
        sentences.push({ text: sentenceText, punctuation });
      }
    }
    
    // If no matches found, return the original text
    if (sentences.length === 0) {
      return [text];
    }
    
    const result: string[] = [];
    let currentParagraph = '';
    
    for (const { text: sentenceText, punctuation } of sentences) {
      const fullSentence = sentenceText + punctuation;
      
      // If adding this sentence would make the paragraph too long, start a new one
      if (currentParagraph.length + fullSentence.length > 200 && currentParagraph.length > 0) {
        result.push(currentParagraph.trim());
        currentParagraph = fullSentence + ' ';
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + fullSentence;
      }
    }
    
    if (currentParagraph.trim()) {
      result.push(currentParagraph.trim());
    }
    
    return result.length > 0 ? result : [text];
  }
  
  return paragraphs.filter(p => p.trim().length > 0);
}

interface BotResponseProps {
  content: string;
  className?: string;
  sources?: {
    title?: string;
    url?: string;
    snippet: string;
    page?: number;
    line?: number;
    fileName?: string;
  }[];
  isSearchRequest?: boolean; // Flag to indicate web search was requested
  onSendMessage?: (message: string) => void;
  messageId?: string;
  onFeedback?: (feedback: { rating: 'positive' | 'negative'; comment?: string; messageId: string }) => void;
  courseData?: any; // Course data for file access
}

export default function BotResponse({ content, className = "", sources, isSearchRequest = false, onSendMessage, messageId, onFeedback, courseData }: BotResponseProps) {
  const { text: cleanContent, followUps } = useMemo(() => extractFollowUps(content), [content]);
  const isGraph = useMemo(() => looksLikeGraph(cleanContent), [cleanContent]);
  const quizData = useMemo(() => extractQuizData(cleanContent), [cleanContent]);
  const graphData = useMemo(() => {
    try {
      return extractGraphData(cleanContent);
    } catch (error) {
      console.error('Error extracting graph data:', error);
      return { type: null, data: null };
    }
  }, [cleanContent]);
  const { isFeatureEnabled } = useFeatureFlags();
  const [isCopied, setIsCopied] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Render interactive quiz
  if (quizData.type === 'quiz' && quizData.data) {
    // Remove the QUIZ_DATA line from content
    const textOnly = cleanContent.replace(/QUIZ_DATA:[^\n]+/, '').trim();
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
            
            {/* AI Feedback for text portion - Inline */}
            {messageId && onFeedback && (
              <div className="inline-block ml-2 mt-2">
                <AIFeedback messageId={messageId} aiContent={cleanContent} onFeedback={onFeedback} />
              </div>
            )}
          </div>
        )}
        {isFeatureEnabled('interactiveQuizzes') ? (
          <InteractiveQuiz
            questions={quizData.data.questions}
            topic={quizData.data.topic || 'Quiz'}
            onQuizComplete={(results) => {
              if (onSendMessage) {
                const { score, total, wrongQuestions, topic } = results;
                const percentage = Math.round((score / total) * 100);
                let message = `I just completed the ${topic} quiz! I got ${score}/${total} (${percentage}%).`;
                
                if (wrongQuestions.length > 0) {
                  message += `\n\nQuestions I got wrong:\n${wrongQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
                  message += `\n\nCan you help me understand these topics better so I can ace them next time?`;
                } else {
                  message += ` Perfect score! 🎉`;
                }
                
                onSendMessage(message);
              }
            }}
          />
        ) : (
          <FeatureDisabled featureName="Interactive Quizzes" />
        )}
      </div>
    );
  }

  // Render full exam modal
  if (quizData.type === 'exam' && quizData.data) {
    // Remove the EXAM_DATA line from content
    const textOnly = cleanContent.replace(/EXAM_DATA:[^\n]+/, '').trim();
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
            
            {/* AI Feedback for text portion - Inline */}
            {messageId && onFeedback && (
              <div className="inline-block ml-2 mt-2">
                <AIFeedback messageId={messageId} aiContent={cleanContent} onFeedback={onFeedback} />
              </div>
            )}
          </div>
        )}
        {isFeatureEnabled('fullExams') ? (
          <>
            <Button onClick={() => setShowExamModal(true)} className="w-full" size="lg">
              🎯 Start Practice Exam ({quizData.data.questions.length} Questions)
            </Button>
            <FullExamModal
              isOpen={showExamModal}
              onClose={() => setShowExamModal(false)}
              questions={quizData.data.questions}
              topic={quizData.data.topic || 'Practice Exam'}
              timeLimit={quizData.data.timeLimit || 30}
              onExamComplete={(results) => {
                if (onSendMessage) {
                  const { score, total, wrongQuestions, topic } = results;
                  const percentage = Math.round((score / total) * 100);
                  let message = `I just completed the ${topic} practice exam! I got ${score}/${total} (${percentage}%).`;
                  
                  if (wrongQuestions.length > 0) {
                    message += `\n\nQuestions I got wrong:\n${wrongQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
                    message += `\n\nCan you help me understand these topics better so I can ace the real exam?`;
                  } else {
                message += ` Perfect score! 🎉`;
              }
              
              onSendMessage(message);
            }
          }}
        />
          </>
        ) : (
          <FeatureDisabled featureName="Practice Exams" />
        )}
      </div>
    );
  }

  // Render graph if graph data is detected
  if (graphData.type && graphData.data) {
    try {
      return <InteractiveGraph graphData={graphData} cleanContent={cleanContent || ''} className={className} />;
    } catch (error) {
      console.error('Error rendering graph:', error);
      // Fall through to regular text rendering
    }
  }

  if (isGraph) {
    try {
      const data = JSON.parse(cleanContent);
      if (Array.isArray(data) && data.length > 0) {
        return (
          <div className={`p-5 ${className}`}>
            <h3 className="text-lg font-semibold mb-2">Graph Output:</h3>
            <LineChart width={400} height={300} data={data}>
              <Line type="monotone" dataKey="y" stroke="#4F46E5" strokeWidth={2} />
              <CartesianGrid stroke="#E5E7EB" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </div>
        );
      }
    } catch (error) {
      console.error('Error parsing graph data:', error);
      // Fall through to regular text rendering
    }
  }

  // Check if content contains code blocks (triple backticks)
  const hasCodeBlocks = cleanContent.includes('```');
  
  if (hasCodeBlocks) {
    // Use AIResponse for code highlighting
    return <AIResponse content={cleanContent} className={className} alwaysHighlight={false} />;
  }

  // Check if this is a web search response (but hide UI for now)
  // const isWebSearch = isSearchRequest === true || (sources && sources.length > 0);
  const isWebSearch = false; // Temporarily disabled
  
  // Otherwise treat as text + math (original behavior) - NO BUBBLE, integrated text
  return (
    <div className={`relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group ${className}`}>
      
      {/* Header with Badge - Temporarily hidden */}
      {/* <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium">
          {isWebSearch ? (
            <span className="text-blue-600 dark:text-blue-400 font-semibold">🌐 Web Search</span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">💡 General Knowledge</span>
          )}
        </div>
      </div> */}
      
      {breakIntoParagraphs(cleanContent).map((paragraph, i) => (
        <div key={i} className="mb-3 last:mb-0">
          {paragraph.split("\n").map((line, j) => {
            // Clean the line of citation text for display
            // Remove [Source: ...] but keep the rest of the text
            const cleanLine = line.replace(/\[Source:[^\]]+\]/g, '').trim();
            
            if (!cleanLine) return null; // Skip empty lines left after removing citations
            
            // If the line was JUST a citation, we skip rendering it inline (since it's in the card)
            // If it had other text, we render the text without the citation
            return renderMathLine(cleanLine, j);
          })}
        </div>
      ))}
      
      {/* Smart Follow-up Chips */}
      {followUps.length > 0 && onSendMessage && (
        <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-forwards print:hidden">
          {followUps.map((question, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(question)}
              className="group flex items-center gap-2 px-4 py-2 bg-background/50 hover:bg-background border border-border/40 hover:border-primary/30 text-muted-foreground hover:text-primary text-xs font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-left backdrop-blur-sm"
            >
              <span>{renderInlineContent(question)}</span>
              <ArrowRight01Icon className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-primary/70 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Detected Sources Section */}
      {(() => {
        const hasSyllabusSources = sources && sources.length > 0 && sources.some(s => s.fileName || (s.page !== undefined) || (s.line !== undefined));
        if (hasSyllabusSources) {
          console.log('📚 BotResponse: Displaying sources:', sources);
        } else if (sources && sources.length > 0) {
          console.log('📚 BotResponse: Sources present but missing fileName/page/line:', sources);
        }
        return hasSyllabusSources;
      })() && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full border border-border/30">
              <Search01Icon className="w-3 h-3" />
              Used Sources
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50"></div>
          </div>

          {/* Compact summary line for quick scanning */}
          <div className="mb-2 text-[11px] text-muted-foreground/90">
            {(() => {
              const uniqueNames = Array.from(
                new Set(
                  (sources || [])
                    .map((s) => (s.fileName || s.title || '').trim())
                    .filter(Boolean)
                )
              );
              if (uniqueNames.length === 0) return null;
              const summary =
                uniqueNames.length <= 3
                  ? uniqueNames.join(' • ')
                  : `${uniqueNames.slice(0, 3).join(' • ')} + ${uniqueNames.length - 3} more`;
              return (
                <span>
                  <span className="font-semibold">Used sources:</span>{' '}
                  <span className="opacity-90">{summary}</span>
                </span>
              );
            })()}
          </div>
          
          <div className="grid gap-2">
            {sources && sources.map((source, idx) => {
              const fileName = source.fileName || source.title || 'Syllabus';

              // Clean snippet to avoid leaking internal markers like FOLLOWUP blocks
              const rawSnippet = source.snippet || '';
              const cleanedSnippet = rawSnippet
                // Strip FOLLOWUP markers and any JSON that follows them
                .replace(/\/\/\/FOLLOWUP_START\/\/\/[\s\S]*$/g, '')
                // Remove any leftover FOLLOWUP markers inline, just in case
                .replace(/\/\/\/FOLLOWUP_START\/\/\/[\s\S]*?\/\/\/FOLLOWUP_END\/\/\//g, '')
                // Collapse whitespace
                .replace(/\s+/g, ' ')
                .trim();
              const isExpanded = expandedSourceIndex === idx;
              
              const handleFileClick = () => {
                // Toggle expansion
                setExpandedSourceIndex(isExpanded ? null : idx);
              };
              
              return (
                <div
                  key={idx}
                  className={`group relative bg-gradient-to-br from-card to-muted/30 border rounded-xl overflow-hidden transition-all duration-300 ${
                    isExpanded 
                      ? 'border-blue-500/30 shadow-md ring-1 ring-blue-500/10' 
                      : 'border-border/60 hover:shadow-md hover:border-primary/20'
                  }`}
                >
                  {/* Left Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 transition-opacity ${
                    isExpanded ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                  }`} />
                  
                  <div className="p-3 pl-4">
                    {/* Header: File Info */}
                    <div className="flex items-start justify-between gap-3 mb-2 cursor-pointer" onClick={handleFileClick}>
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                         <div className={`p-1.5 rounded-lg shadow-sm border transition-colors ${
                           isExpanded 
                             ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                             : 'bg-background border-border/50 text-blue-600 dark:text-blue-400 group-hover:scale-105'
                         }`}>
                            <Book01Icon className="w-3.5 h-3.5" />
                         </div>
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground/90 truncate" title={fileName}>
                                {fileName}
                              </p>
                              {(source.page !== undefined || source.line !== undefined) && (
                                 <span className="inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-background border border-border/50 text-muted-foreground shadow-sm">
                                   {source.page !== undefined && `Page ${source.page}`}
                                   {source.page !== undefined && source.line !== undefined && <span className="text-border">|</span>}
                                   {source.line !== undefined && `Line ${source.line}`}
                                 </span>
                              )}
                            </div>
                         </div>
                      </div>
                    </div>
                    
                    {/* Snippet Content */}
                    <div
                       onClick={handleFileClick}
                       className="w-full text-left group/snippet relative mt-1 cursor-pointer"
                    >
                       <div className="relative pl-3">
                          <p className={`text-xs text-muted-foreground/80 transition-all duration-300 leading-relaxed font-serif italic ${
                            isExpanded ? 'text-foreground/90 text-sm' : 'line-clamp-2 group-hover/snippet:text-foreground/90'
                          }`}>
                            "{cleanedSnippet || rawSnippet}"
                          </p>
                       </div>
                       
                       {/* Verification Note (Only when expanded) */}
                       {isExpanded && (
                         <div className="mt-3 pt-3 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
                           <div className="flex gap-2 items-start text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                             <Search01Icon className="w-3 h-3 mt-0.5 shrink-0" />
                             <p>This is a direct quote from your uploaded file. Always double-check dates and policies in the original document.</p>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer Indicators - Temporarily hidden */}
      {/* <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {isWebSearch ? (
          <span className="font-medium">Based on online data</span>
        ) : (
          <span>Based on training data</span>
        )}
      </div> */}
      
      {/* Source Icon - Inline (for web sources only) */}
      {sources && sources.length > 0 && sources.some(s => s.url && s.url !== '#') && (
        <div className="inline-block ml-2">
          <SourceIcon sources={sources.filter(s => s.url && s.url !== '#').map(s => ({
            title: s.title || s.fileName || '',
            url: s.url || '',
            snippet: s.snippet || ''
          }))} />
        </div>
      )}
      
      {/* Copy Button and Feedback - Inline Row */}
      <div className="inline-flex items-center gap-1 ml-2">
        <button
          className="h-6 w-6 p-0 bg-transparent hover:bg-muted-foreground/10 rounded-md z-10 flex items-center justify-center transition-all duration-200 ease-in-out"
          onClick={copyToClipboard}
          title="Copy message"
        >
          <div className="relative">
            <Copy01Icon 
              className={`h-3.5 w-3.5 text-muted-foreground transition-all duration-300 ease-in-out ${
                isCopied ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'
              }`} 
            />
            <CheckmarkCircle01Icon 
              className={`absolute inset-0 h-3.5 w-3.5 text-green-600 transition-all duration-300 ease-in-out ${
                isCopied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'
              }`} 
            />
          </div>
        </button>

        {/* AI Feedback - Next to Copy Button */}
        {messageId && onFeedback && (
          <AIFeedback messageId={messageId} aiContent={content} onFeedback={onFeedback} />
        )}
      </div>
    </div>
  );
}
