"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIResponse } from '@/components/ai-response';
import { provideStudyAssistanceWithFallback } from '@/ai/services/dual-ai-service';

export default function TestAIFormattingPage() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await provideStudyAssistanceWithFallback({
        question: question,
        context: '',
        conversationHistory: [],
        userName: 'Test User',
        aiResponseType: 'conversational'
      });

      setResponse(result.answer || 'No response');
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    "Create me a list of fruits",
    "List the topics in calculus",
    "Give me a numbered list of study tips",
    "Create a list with bold headings for each chapter"
  ];

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">AI Formatting Test Page</h1>
        <p className="text-muted-foreground mb-6">
          Test AI responses and formatting. Ask for lists, bold text, etc.
        </p>

        {/* Quick test buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {quickTests.map((test, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => setQuestion(test)}
            >
              {test}
            </Button>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything... (e.g., 'Create me a list of fruits')"
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? 'Loading...' : 'Ask'}
            </Button>
          </div>
        </form>

        {/* Response display */}
        {response && (
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">AI Response:</h2>
            <div className="prose dark:prose-invert max-w-none">
              <AIResponse content={response} className="" alwaysHighlight={false} />
            </div>
            
            {/* Raw markdown preview */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                Raw Markdown (click to expand)
              </summary>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {response}
              </pre>
            </details>
          </div>
        )}

        {loading && (
          <div className="border rounded-lg p-6 bg-card">
            <p className="text-muted-foreground">Loading response...</p>
          </div>
        )}
      </div>
    </div>
  );
}


