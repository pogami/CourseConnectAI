"use client";

import React from 'react';

interface AIFeedbackProps {
  messageId: string;
  aiContent: string;
  onFeedback?: (feedback: { rating: 'positive' | 'negative'; comment?: string; messageId: string }) => void;
}

export function AIFeedback({ messageId, aiContent, onFeedback }: AIFeedbackProps) {
  // Placeholder component - to be implemented
  // For now, return null to hide it
  return null;
}


