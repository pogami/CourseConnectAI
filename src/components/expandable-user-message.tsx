"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface ExpandableUserMessageProps {
  content: string;
  className?: string;
}

// Helper to highlight @ai mentions
const highlightAIMentions = (text: string) => {
  return text.replace(/(?<!\w)@ai(?!\w)/gi, (match) => 
    `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">${match}</span>`
  );
};

// Helper to strip citation term brackets but keep text
const stripCitationTerms = (text: string) => {
    return text.replace(/\[\[(.*?)\]\]/g, '$1');
};

// Math Rendering Helper
function renderMathLine(line: string, keyPrefix: string) {
    const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\))/);
    
    // If no math found, return simple HTML string with highlights
    if (parts.length === 1) {
        let processed = highlightAIMentions(line);
        processed = stripCitationTerms(processed);
        return <span key={keyPrefix} dangerouslySetInnerHTML={{ __html: processed }} />;
    }

    return (
        <span key={keyPrefix}>
            {parts.map((part, i) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <BlockMath key={`${keyPrefix}-${i}`} math={part.slice(2, -2).trim()} />;
                }
                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                    return <BlockMath key={`${keyPrefix}-${i}`} math={part.slice(2, -2).trim()} />;
                }
                if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={`${keyPrefix}-${i}`} math={part.slice(1, -1).trim()} />;
                }
                if (part.startsWith('\\(') && part.endsWith('\\)')) {
                    return <InlineMath key={`${keyPrefix}-${i}`} math={part.slice(2, -2).trim()} />;
                }
                
                let processed = highlightAIMentions(part);
                processed = stripCitationTerms(processed);
                return <span key={`${keyPrefix}-${i}`} dangerouslySetInnerHTML={{ __html: processed }} />;
            })}
        </span>
    );
}


export function ExpandableUserMessage({ content, className = "" }: ExpandableUserMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300; // Increased character limit before truncating to be more generous

  // Check if content needs truncation
  const shouldTruncate = content.length > maxLength;
  const contentToShow = shouldTruncate && !isExpanded ? content.substring(0, maxLength) + "..." : content;

  return (
    <div className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${className}`}>
        {contentToShow.split('\n').map((line, i) => (
            <div key={i} className={i > 0 ? 'mt-1' : ''}>
                {renderMathLine(line, `line-${i}`)}
            </div>
        ))}
        
      {shouldTruncate && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full transition-colors mt-1"
          title="Show more"
        >
          <ChevronDown className="h-3 w-3 text-white" />
        </button>
      )}
      {shouldTruncate && isExpanded && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => setIsExpanded(false)}
            className="inline-flex items-center justify-center w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="Show less"
          >
            <ChevronUp className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
