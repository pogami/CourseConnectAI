/**
 * Emotional Intelligence (EQ) Layer
 * Detects student frustration and provides empathetic responses
 */

export interface FrustrationDetection {
  isFrustrated: boolean;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestedApproach?: 'analogy' | 'step-by-step' | 'visual' | 'example' | 'break';
}

/**
 * Detect frustration from user message and conversation history
 */
export function detectFrustration(
  currentMessage: string,
  conversationHistory: any[] = []
): FrustrationDetection {
  const message = currentMessage.toLowerCase();
  const reasons: string[] = [];
  let level: 'low' | 'medium' | 'high' = 'low';

  // Check for stressed/frustrated keywords
  const frustrationKeywords = [
    'confused', 'confusing', 'don\'t understand', "don't get it", 'stuck', 'frustrated',
    'frustrating', 'hard', 'difficult', 'impossible', 'makes no sense', "doesn't make sense",
    'help', 'helpless', 'lost', 'clueless', 'no idea', "can't figure out", 'stuck',
    'give up', 'tired', 'exhausted', 'overwhelmed', 'too much', 'complicated'
  ];

  const stressedKeywords = [
    'urgent', 'asap', 'due soon', 'deadline', 'panic', 'worried', 'anxious',
    'stress', 'stressed', 'pressure', 'running out of time'
  ];

  // Check current message for frustration indicators
  const hasFrustrationKeywords = frustrationKeywords.some(keyword => message.includes(keyword));
  const hasStressedKeywords = stressedKeywords.some(keyword => message.includes(keyword));

  if (hasFrustrationKeywords) {
    reasons.push('Frustrated language detected');
    level = 'medium';
  }

  if (hasStressedKeywords) {
    reasons.push('Stressed language detected');
    if (level === 'low') level = 'medium';
  }

  // Check for repeated questions (same question asked 2+ times)
  if (conversationHistory.length >= 2) {
    const userMessages = conversationHistory
      .filter((msg: any) => msg.role === 'user' || msg.sender === 'user')
      .map((msg: any) => (msg.content || msg.text || '').toLowerCase().trim())
      .filter((text: string) => text.length > 10); // Only meaningful messages

    // Normalize messages for comparison (remove punctuation, extra spaces)
    const normalize = (text: string) => text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedCurrent = normalize(message);
    
    // Check if similar question was asked before
    const similarQuestions = userMessages.filter((prevMsg: string) => {
      const normalized = normalize(prevMsg);
      // Check for significant overlap (60% similarity)
      const words1 = normalized.split(' ');
      const words2 = normalizedCurrent.split(' ');
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
      return commonWords.length >= Math.min(words1.length, words2.length) * 0.6;
    });

    if (similarQuestions.length >= 2) {
      reasons.push('Same question asked multiple times');
      level = 'high';
    }
  }

  // Check for question repetition patterns
  const questionPatterns = [
    /(what|how|why|when|where|can you|will you).*(again|once more|one more time)/i,
    /(still|again).*(don't|do not).*(understand|get|know)/i,
    /(explain|help).*(again|once more|one more time)/i
  ];

  const hasRepetitionPattern = questionPatterns.some(pattern => pattern.test(currentMessage));
  if (hasRepetitionPattern) {
    reasons.push('Requesting repetition');
    if (level === 'low') level = 'medium';
    if (reasons.length >= 2) level = 'high';
  }

  // Determine suggested approach based on frustration level and context
  let suggestedApproach: 'analogy' | 'step-by-step' | 'visual' | 'example' | 'break' | undefined;
  
  if (level === 'high') {
    // High frustration - try completely different approach
    if (message.includes('math') || message.includes('calculate') || message.includes('formula')) {
      suggestedApproach = 'analogy'; // Use sports/real-world analogies instead of formulas
    } else {
      suggestedApproach = 'break'; // Break it into smaller pieces
    }
  } else if (level === 'medium') {
    // Medium frustration - try step-by-step or examples
    if (message.includes('how') || message.includes('process') || message.includes('steps')) {
      suggestedApproach = 'step-by-step';
    } else {
      suggestedApproach = 'example';
    }
  }

  return {
    isFrustrated: level !== 'low',
    level,
    reasons,
    suggestedApproach
  };
}

/**
 * Generate empathetic response prefix based on frustration detection
 */
export function generateEmpatheticPrefix(detection: FrustrationDetection): string {
  if (!detection.isFrustrated) return '';

  const { level, suggestedApproach } = detection;

  if (level === 'high') {
    if (suggestedApproach === 'analogy') {
      return "I can see this concept is really frustrating. Let's try a completely different approach—let's use a real-world analogy instead of the formulas for a second. Sometimes stepping away from the math and thinking about it differently helps it click.\n\n";
    } else {
      return "I can tell this is really challenging. Let's break this down into the smallest possible pieces and tackle it one step at a time. We'll get there—sometimes the hardest concepts just need to be approached from a different angle.\n\n";
    }
  } else if (level === 'medium') {
    if (suggestedApproach === 'step-by-step') {
      return "I can see this is a bit confusing. Let me walk you through this step-by-step, and we'll take it nice and slow. No rush—understanding is more important than speed.\n\n";
    } else {
      return "I notice you might be feeling a bit stuck. Let's try looking at this with a concrete example—sometimes seeing it in action makes all the difference.\n\n";
    }
  }

  return '';
}

/**
 * Generate celebration message for task completion
 */
export function generateCelebrationMessage(
  taskName: string,
  taskType: 'assignment' | 'exam' | 'other',
  isPriority: boolean = false,
  daysUntilNext?: number
): string {
  const celebrations = [
    "Boom! 🎉",
    "Nice work! 🚀",
    "Awesome! 💪",
    "You crushed it! 🔥",
    "Excellent! ⭐",
    "Way to go! 🎊"
  ];

  const randomCelebration = celebrations[Math.floor(Math.random() * celebrations.length)];

  if (isPriority) {
    return `${randomCelebration} That's the hardest thing on your plate this week done. You're officially ahead of schedule. Take 15 minutes off—you earned it.`;
  }

  if (taskType === 'exam') {
    return `${randomCelebration} ${taskName} is done! You're making great progress. Keep that momentum going!`;
  }

  if (daysUntilNext && daysUntilNext > 3) {
    return `${randomCelebration} ${taskName} completed! You've got ${daysUntilNext} days until your next deadline—great time management!`;
  }

  return `${randomCelebration} ${taskName} is complete! Every task you finish builds your confidence. Keep it up!`;
}


