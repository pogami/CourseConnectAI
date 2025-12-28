"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Copy, Check } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIResponseProps {
  content: string;
  className?: string;
  alwaysHighlight?: boolean; // For Programming AI Tutor - always highlight code
}

// Prevent line breaks in date patterns like "nov - 24", "Nov.3", "Sep.1", "Dec.9 - Dec.16"
function preventDateBreaks(text: string): string {
  // Replace spaces around hyphens in date patterns with non-breaking spaces
  // Pattern: month abbreviation (3 letters) + space + hyphen + space + number
  // Examples: "nov - 24", "dec - 16", "jan - 1"
  return text
    // Handle dates with periods and no space: "Nov.3", "Sep.1", "Aug.25"
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.(\d+)\b/gi, '$1.\u00A0$2') // Non-breaking space after period
    // Handle dates with periods and space: "Nov. 3", "Sep. 1"
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.\s+(\d+)\b/gi, '$1.\u00A0$2') // Non-breaking space
    // Handle date ranges with periods: "Dec.9 - Dec.16"
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.(\d+)\s+-\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.(\d+)\b/gi, '$1.\u00A0$2\u00A0-\u00A0$3.\u00A0$4') // Non-breaking spaces in ranges
    // Handle dates with spaces around hyphens: "nov - 24", "dec - 16"
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+-\s+(\d+)\b/gi, '$1\u00A0-\u00A0$2') // Non-breaking spaces
    // Handle full month names with hyphens: "january - 1"
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+-\s+(\d+)\b/gi, '$1\u00A0-\u00A0$2'); // Full month names
}

// Protect math expressions from markdown processing
// Detects patterns like "80 * 0.48 = 38.4" and wraps them in math delimiters
function protectMathExpressions(text: string): string {
  // First, protect existing math delimiters
  const mathPlaceholders: string[] = [];
  let placeholderIndex = 0;
  
  // Replace existing math delimiters with placeholders
  let processedText = text.replace(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\))/g, (match) => {
    const placeholder = `__MATH_PLACEHOLDER_${placeholderIndex}__`;
    mathPlaceholders[placeholderIndex] = match;
    placeholderIndex++;
    return placeholder;
  });
  
  // Detect and wrap math expressions
  // Pattern 1: Full equation like "80 * 0.48 = 38.4"
  processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*([*×])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/g, (match, num1, op, num2, result) => {
    return `$${num1} \\times ${num2} = ${result}$`;
  });
  
  // Pattern 2: Multiplication/division like "80 * 0.48" or "18.5 / 0.22"
  processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*([*×/÷])\s*(\d+(?:\.\d+)?)/g, (match, num1, op, num2) => {
    const opLatex = op === '*' || op === '×' ? '\\times' : op === '/' || op === '÷' ? '\\div' : op;
    return `$${num1} ${opLatex} ${num2}$`;
  });
  
  // Pattern 3: Addition/subtraction in equations like "38.4 + 11.7 = 50.1"
  processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/g, (match, num1, op, num2, result) => {
    return `$${num1} ${op} ${num2} = ${result}$`;
  });
  
  // Pattern 4: Variable expressions like "Final × 0.22" or "Final * 0.22 = 18.5"
  processedText = processedText.replace(/([A-Za-z]+)\s*([*×])\s*(\d+(?:\.\d+)?)\s*(?:=\s*(\d+(?:\.\d+)?))?/g, (match, variable, op, num, result) => {
    if (result) {
      return `$${variable} \\times ${num} = ${result}$`;
    }
    return `$${variable} \\times ${num}$`;
  });
  
  // Restore math placeholders
  mathPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(`__MATH_PLACEHOLDER_${index}__`, placeholder);
  });
  
  return processedText;
}

export function AIResponse({ content, className = "", alwaysHighlight = false }: AIResponseProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Prevent breaks in date patterns and protect math expressions
  const processedContent = protectMathExpressions(preventDateBreaks(content));

  // Check if content contains code blocks (triple backticks)
  const hasCodeBlocks = processedContent.includes('```');
  
  // For Programming AI Tutor, always use markdown rendering
  // For general chat, only use markdown if there are code blocks
  const shouldUseMarkdown = alwaysHighlight || hasCodeBlocks;

  // Simple hash function for stable block IDs
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const copyToClipboard = async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [blockId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [blockId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!shouldUseMarkdown) {
    // Render as plain text for non-code content
    return (
      <div className={`whitespace-pre-wrap text-sm ${className}`}>
        {processedContent}
      </div>
    );
  }

  return (
    <div className={`bg-muted/50 dark:bg-muted/30 px-5 py-3 rounded-2xl rounded-tl-md border border-border/40 shadow-sm text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        // Process content to prevent date breaks
        components={{
          a({ node, href, children, ...props }) {
            // Custom link styling - blue, underlined, opens in new tab
            return (
              <a 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors cursor-pointer"
                title={href}
                {...props}
              >
                {children}
              </a>
            );
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeText = String(children).replace(/\n$/, '');
            // Use hash of code content for stable block ID
            const blockId = `code-${hashString(codeText)}`;
            const isCopied = copiedStates[blockId] || false;
            
            if (!inline && language) {
              // Code block with language
              return (
                <div className="relative group">
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className="rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm w-full overflow-x-auto"
                    customStyle={{
                      margin: '8px 0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      padding: '12px',
                      border: '1px solid',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      maxHeight: '400px',
                      overflow: 'auto',
                      width: '100%',
                      maxWidth: '100%'
                    }}
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                  <button
                    className="absolute top-2 right-2 h-6 w-6 p-0 bg-transparent hover:bg-muted-foreground/10 rounded-md z-10 flex items-center justify-center transition-all duration-200 ease-in-out"
                    onClick={() => copyToClipboard(codeText, blockId)}
                    title="Copy code"
                  >
                    <div className="relative">
                      <Copy 
                        className={`h-3.5 w-3.5 text-muted-foreground transition-all duration-300 ease-in-out ${
                          isCopied ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'
                        }`} 
                      />
                      <Check 
                        className={`absolute inset-0 h-3.5 w-3.5 text-green-600 transition-all duration-300 ease-in-out ${
                          isCopied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'
                        }`} 
                      />
                    </div>
                  </button>
                </div>
              );
            } else if (!inline) {
              // Code block without language
              return (
                <div className="relative group">
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language="text"
                    PreTag="div"
                    className="rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm w-full overflow-x-auto"
                    customStyle={{
                      margin: '8px 0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      padding: '12px',
                      border: '1px solid',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      maxHeight: '400px',
                      overflow: 'auto',
                      width: '100%',
                      maxWidth: '100%'
                    }}
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                  <button
                    className="absolute top-2 right-2 h-6 w-6 p-0 bg-transparent hover:bg-muted-foreground/10 rounded-md z-10 flex items-center justify-center transition-all duration-200 ease-in-out"
                    onClick={() => copyToClipboard(codeText, blockId)}
                    title="Copy code"
                  >
                    <div className="relative">
                      <Copy 
                        className={`h-3.5 w-3.5 text-muted-foreground transition-all duration-300 ease-in-out ${
                          isCopied ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'
                        }`} 
                      />
                      <Check 
                        className={`absolute inset-0 h-3.5 w-3.5 text-green-600 transition-all duration-300 ease-in-out ${
                          isCopied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'
                        }`} 
                      />
                    </div>
                  </button>
                </div>
              );
            } else {
              // Inline code
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
          },
          // Style other markdown elements
          // Use div instead of p to avoid hydration errors with nested block elements
          p: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
