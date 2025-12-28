"use client";

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexMathRendererProps {
  text: string;
  className?: string;
}

export function LatexMathRenderer({ text, className = "" }: LatexMathRendererProps) {
  // Function to remove markdown asterisks (bold/italic formatting)
  const removeAsterisks = (input: string): string => {
    // Remove **text** (bold) and *text* (italic) markdown formatting
    return input
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*([^*]+)\*/g, '$1'); // Remove italic *text*
  };

  // Function to detect and render LaTeX math expressions
  const renderMath = (input: string) => {
    // First, protect math expressions by replacing them with placeholders
    const mathPlaceholders: { [key: string]: string } = {};
    let placeholderIndex = 0;
    
    // Replace math delimiters with placeholders to protect them from asterisk removal
    let processedText = input.replace(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\))/g, (match) => {
      const placeholder = `__MATH_${placeholderIndex}__`;
      mathPlaceholders[placeholder] = match;
      placeholderIndex++;
      return placeholder;
    });
    
    // Remove asterisks from the text (math is protected)
    processedText = removeAsterisks(processedText);
    
    // Restore math placeholders
    Object.keys(mathPlaceholders).forEach(placeholder => {
      processedText = processedText.replace(placeholder, mathPlaceholders[placeholder]);
    });
    
    // Check if text contains any math delimiters
    const hasMath = processedText.includes("$$") || (processedText.includes("$") && processedText.includes("$")) || 
                    (processedText.includes("\\(") && processedText.includes("\\)")) || 
                    (processedText.includes("\\[") && processedText.includes("\\]"));
    
    if (!hasMath) {
      // No math, return as regular text (asterisks already removed)
      return <span>{processedText}</span>;
    }

    // Split by LaTeX delimiters (both $ and \( formats)
    const parts = processedText.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\))/);
    
    return parts.map((part, index) => {
      // Block math ($$...$$)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathContent = part.slice(2, -2).trim();
        return (
          <BlockMath key={index} math={mathContent} />
        );
      }
      
      // Block math (\[...\])
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const mathContent = part.slice(2, -2).trim();
        return (
          <BlockMath key={index} math={mathContent} />
        );
      }
      
      // Inline math ($...$)
      if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
        const mathContent = part.slice(1, -1).trim();
        return (
          <InlineMath key={index} math={mathContent} />
        );
      }
      
      // Inline math (\(...\))
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const mathContent = part.slice(2, -2).trim();
        return (
          <InlineMath key={index} math={mathContent} />
        );
      }
      
      // Regular text (asterisks already removed)
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      {renderMath(text)}
    </div>
  );
}

// Helper function to detect if text contains math
export function containsMath(text: string): boolean {
  return /\$[\s\S]*?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/.test(text);
}

// Helper function to wrap math expressions in LaTeX delimiters
export function wrapMathExpressions(text: string): string {
  // Common math patterns to automatically wrap
  const mathPatterns = [
    // Fractions: a/b, (a+b)/c
    /(\d+|\w+)\/(\d+|\w+)/g,
    // Exponents: x^2, a^b
    /(\w+)\^(\d+|\w+)/g,
    // Square roots: sqrt(x), √x
    /sqrt\([^)]+\)/g,
    /√[^\s]+/g,
    // Integrals: ∫, derivatives: ∂
    /[∫∂∑∏]/g,
    // Greek letters: α, β, γ, etc.
    /[αβγδεζηθικλμνξοπρστυφχψω]/g,
    // Common math symbols: ±, ×, ÷, ≤, ≥, ≠, ≈, ∞
    /[±×÷≤≥≠≈∞]/g,
  ];

  let result = text;
  
  mathPatterns.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // Don't wrap if already wrapped
      if (match.startsWith('$') && match.endsWith('$')) {
        return match;
      }
      return `$${match}$`;
    });
  });

  return result;
}

