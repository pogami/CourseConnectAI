"use client";

import React from 'react';
import { AIResponse } from './ai-response';

/**
 * Test component to verify markdown formatting is working correctly
 * Use this to test if ReactMarkdown is rendering properly
 */
export function FormattingTest() {
  const testMarkdown = `**Bold text test**

This is paragraph one. It has multiple sentences to test paragraph rendering. This should appear as a separate paragraph.

This is paragraph two. It should have proper spacing from the first paragraph.

Here's a bullet list:
- First bullet point
- Second bullet point
- Third bullet point

Here's a numbered list:
1. First step
2. Second step
3. Third step

**Example 1:** Test example

Step 1: Do this
Step 2: Do that
Step 3: Done

**Example 2:** Another example

Step 1: Start here
Step 2: Continue
Step 3: Finish`;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Markdown Formatting Test</h2>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
        <AIResponse content={testMarkdown} className="" alwaysHighlight={false} />
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>If you see:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Bold text rendered as bold</li>
          <li>Paragraphs with proper spacing</li>
          <li>Bullet points as a list</li>
          <li>Numbered list as a list</li>
          <li>Examples clearly separated</li>
        </ul>
        <p className="mt-2">Then formatting is working correctly!</p>
      </div>
    </div>
  );
}

