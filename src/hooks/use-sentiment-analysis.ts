import { useState, useEffect, useMemo } from 'react';

export type SentimentType = 'neutral' | 'confused' | 'stuck' | 'help' | 'frustrated';

interface SentimentAnalysisResult {
  sentiment: SentimentType;
  confidence: number;
  detectedWords: string[];
}

// Keywords that indicate different sentiment states
const SENTIMENT_KEYWORDS: Record<SentimentType, string[]> = {
  neutral: [],
  confused: [
    'confused', 'confusion', 'confusing', 'unclear', 'unclear about', 'not sure',
    'dont understand', "don't understand", 'do not understand', 'lost', 'lost on',
    'unclear', 'vague', 'puzzled', 'bewildered', 'perplexed', 'baffled',
    'im confused', "i'm confused", 'i am confused'
  ],
  stuck: [
    'stuck', 'stuck on', 'cant figure out', "can't figure out", 'cannot figure out',
    'blocked', 'blocked on', 'not working', 'not getting', 'struggling',
    'struggling with', 'having trouble', 'trouble with', 'difficulty', 'difficult',
    'impossible', 'cant do', "can't do", 'cannot do', 'dead end', 'at a loss'
  ],
  help: [
    'help', 'help me', 'need help', 'please help', 'can you help', 'could you help',
    'assist', 'assistance', 'support', 'guide', 'guidance', 'explain', 'show me',
    'teach me', 'how do', 'how to', 'what is', 'what are', 'how does', 'how can'
  ],
  frustrated: [
    'frustrated', 'frustrating', 'annoying', 'annoyed', 'irritated', 'irritating',
    'aggravating', 'exasperated', 'fed up', 'sick of', 'tired of', 'give up',
    'giving up', 'this is hard', 'too hard', 'too difficult', 'impossible'
  ]
};

/**
 * Custom hook that analyzes user input sentiment
 * Detects words indicating confusion, being stuck, needing help, or frustration
 * Returns sentiment state that can be used to change UI (e.g., border color)
 */
export function useSentimentAnalysis(inputText: string): SentimentAnalysisResult {
  const analysis = useMemo(() => {
    if (!inputText || inputText.trim().length === 0) {
      return {
        sentiment: 'neutral' as SentimentType,
        confidence: 0,
        detectedWords: []
      };
    }

    const lowerText = inputText.toLowerCase();
    const detectedWords: string[] = [];
    const sentimentScores: Record<SentimentType, number> = {
      neutral: 0,
      confused: 0,
      stuck: 0,
      help: 0,
      frustrated: 0
    };

    // Check each sentiment category
    Object.entries(SENTIMENT_KEYWORDS).forEach(([sentiment, keywords]) => {
      if (sentiment === 'neutral') return;
      
      keywords.forEach(keyword => {
        // For multi-word phrases, use simple includes (more lenient)
        if (keyword.includes(' ')) {
          if (lowerText.includes(keyword)) {
            sentimentScores[sentiment as SentimentType]++;
            detectedWords.push(keyword);
          }
        } else {
          // For single words, use simple includes for better matching (especially for "im")
          if (lowerText.includes(keyword)) {
            sentimentScores[sentiment as SentimentType]++;
            detectedWords.push(keyword);
          }
        }
      });
    });

    // Determine dominant sentiment
    const maxScore = Math.max(...Object.values(sentimentScores));
    let dominantSentiment: SentimentType = 'neutral';
    
    if (maxScore > 0) {
      // Prioritize frustrated > stuck > confused > help
      if (sentimentScores.frustrated > 0) {
        dominantSentiment = 'frustrated';
      } else if (sentimentScores.stuck > 0) {
        dominantSentiment = 'stuck';
      } else if (sentimentScores.confused > 0) {
        dominantSentiment = 'confused';
      } else if (sentimentScores.help > 0) {
        dominantSentiment = 'help';
      }
    }

    // Calculate confidence based on number of matches and text length
    const totalMatches = Object.values(sentimentScores).reduce((a, b) => a + b, 0);
    const confidence = Math.min(1, totalMatches / Math.max(1, inputText.split(/\s+/).length / 10));

    return {
      sentiment: dominantSentiment,
      confidence,
      detectedWords: [...new Set(detectedWords)] // Remove duplicates
    };
  }, [inputText]);

  return analysis;
}

