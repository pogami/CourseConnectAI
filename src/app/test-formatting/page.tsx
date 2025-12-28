"use client";

import { FormattingTest } from '@/components/formatting-test';

export default function TestFormattingPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Markdown Formatting Test</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        This page tests if ReactMarkdown is rendering AI responses correctly.
        If everything below looks properly formatted, your markdown rendering is working.
      </p>
      <FormattingTest />
    </div>
  );
}

