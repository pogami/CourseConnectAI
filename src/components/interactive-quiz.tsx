"use client";

import React from 'react';

interface InteractiveQuizProps {
  questions: any[];
  topic: string;
  onQuizComplete: (results: { score: number; total: number; wrongQuestions: string[]; topic: string }) => void;
}

export function InteractiveQuiz({ questions, topic, onQuizComplete }: InteractiveQuizProps) {
  // Placeholder component - to be implemented
  return (
    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Interactive Quiz feature coming soon...
      </p>
    </div>
  );
}


