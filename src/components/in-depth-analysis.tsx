"use client";

import React, { useState } from 'react';
import { Calculator, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { isMathOrPhysicsContent } from '@/utils/math-detection';

interface InDepthAnalysisProps {
  question: string;
  conversationHistory?: Array<{
    sender: 'user' | 'bot' | 'moderator';
    text: string;
  }>;
  userName?: string; // Display name for narrative replacement
}

// Render math expressions properly
function renderMathLine(line: string, i: number) {
  if (line.includes("$$")) {
    const expr = line.replace(/\$\$/g, "");
    return <BlockMath key={i} math={expr} />;
  } else if (line.includes("$")) {
    const expr = line.replace(/\$/g, "");
    return <InlineMath key={i} math={expr} />;
  } else if (line.includes("\\(") && line.includes("\\)")) {
    const expr = line.replace(/\\\(/g, "").replace(/\\\)/g, "");
    return <InlineMath key={i} math={expr} />;
  } else if (line.includes("\\[") && line.includes("\\]")) {
    const expr = line.replace(/\\\[/g, "").replace(/\\\]/g, "");
    return <BlockMath key={i} math={expr} />;
  } else {
    return (
      <p key={i} className="text-sm not-italic break-words max-w-full overflow-hidden leading-7 font-sans">
        {line}
      </p>
    );
  }
}

export function InDepthAnalysis({ question, conversationHistory, userName }: InDepthAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Note: render exactly as returned; no heuristic spacing to avoid mangling content

  const handleOpenAnalysis = async () => {
    setIsOpen(true);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/in-depth-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error getting analysis:', error);
      setAnalysis('Sorry, I couldn\'t generate a detailed analysis at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAnalysis('');
  };

  // Only show button if question contains math
  const hasMath = isMathOrPhysicsContent(question);

  if (!hasMath) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpenAnalysis}
        className="inline-flex items-center justify-center w-5 h-5 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors ml-1"
        title="Detailed step-by-step analysis"
      >
        <Calculator className="h-3 w-3 text-blue-500" />
      </button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-muted-foreground">Generating detailed analysis...</span>
              </div>
            ) : (
              <div className="max-w-none space-y-4 whitespace-pre-wrap">
                {(() => {
                  const name = (userName && userName.trim().length > 0) ? userName.trim() : 'User';
                  // 1) Strip markdown bold **...**  2) Replace "The user" with the actual name
                  const sanitized = analysis
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\b[Tt]he user\b/g, name);

                  return sanitized.split('\n').map((raw, i) => {
                    const line = raw.trim();
                    const finalAnsMatch = line.match(/^Final\s*Answer\s*:?\s*(.+)$/i);
                    if (finalAnsMatch) {
                      const ans = finalAnsMatch[1].trim();
                      return (
                        <div key={`final-${i}`} className="text-sm not-italic leading-7">
                          <span className="mr-2">Final Answer:</span>
                          <span className="inline-flex items-center border border-blue-300 dark:border-blue-700 rounded px-2 py-0.5 font-semibold bg-blue-50/50 dark:bg-blue-900/20">
                            {ans}
                          </span>
                        </div>
                      );
                    }
                    return <div key={i}>{renderMathLine(line, i)}</div>;
                  });
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
