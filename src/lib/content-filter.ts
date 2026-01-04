// Content filtering and safety detection
// Detects profanity, harmful content, and provides crisis resources

export interface ContentFilterResult {
  isSafe: boolean;
  category: 'safe' | 'profanity' | 'self-harm' | 'violence' | 'harassment' | 'spam';
  confidence: number;
  message?: string;
  crisisResources?: CrisisResource[];
}

export interface CrisisResource {
  name: string;
  phone: string;
  text?: string;
  website: string;
  description: string;
}

// Crisis resources for self-harm detection
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    text: "Text HOME to 741741",
    website: "https://suicidepreventionlifeline.org",
    description: "24/7 crisis support and suicide prevention"
  },
  {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    website: "https://www.crisistextline.org",
    description: "Free, 24/7 crisis support via text message"
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    website: "https://www.samhsa.gov/find-help/national-helpline",
    description: "Mental health and substance abuse support"
  },
  {
    name: "The Trevor Project",
    phone: "1-866-488-7386",
    text: "Text START to 678678",
    website: "https://www.thetrevorproject.org",
    description: "Crisis support for LGBTQ+ youth"
  }
];

// Common profanity words (filtered list)
const PROFANITY_WORDS = [
  // Explicit profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
  'bitch', 'bitches', 'bitching', 'bitched',
  'asshole', 'assholes', 'dick', 'dicks', 'pussy', 'pussies',
  'damn', 'damned', 'damning', 'hell', 'crap', 'crap',
  
  // Racial slurs
  'nigger', 'nigga', 'niggas', 'chink', 'chinks', 'spic', 'spics',
  'kike', 'kikes', 'wetback', 'wetbacks', 'gook', 'gooks',
  
  // Homophobic slurs
  'fag', 'fags', 'faggot', 'faggots', 'dyke', 'dykes', 'tranny', 'trannies',
  
  // Other offensive terms
  'retard', 'retarded', 'retards', 'moron', 'morons', 'idiot', 'idiots',
  'stupid', 'dumb', 'dumbass', 'dumbasses'
];

// Self-harm and suicide indicators
const SELF_HARM_INDICATORS = [
  // Direct mentions
  'kill myself', 'kill myself', 'suicide', 'suicidal', 'end my life', 'end it all',
  'not worth living', 'better off dead', 'want to die', 'wish i was dead',
  'self harm', 'self-harm', 'cut myself', 'hurt myself', 'harm myself',
  
  // Methods
  'overdose', 'overdosing', 'pills', 'poison', 'hang myself', 'hanging',
  'jump off', 'jumping off', 'bridge', 'building', 'gun', 'shoot myself',
  
  // Emotional indicators
  'hopeless', 'worthless', 'burden', 'everyone hates me', 'no one cares',
  'can\'t go on', 'can\'t take it', 'too much pain', 'end the pain',
  'final solution', 'final answer', 'way out', 'escape', 'relief'
];

// Violence indicators (context-aware - excludes academic/historical usage)
const VIOLENCE_INDICATORS = [
  'kill you', 'murder', 'murdering', 'stab', 'stabbing', 'shoot you', 'shooting you',
  'explosive device', 'make a bomb', 'plant a bomb', 'bomb you', 'bomb the', 'bomb them',
  'harm you', 'hurt you', 'beat you', 'fight you', 'fighting you', 'violence against',
  'threat', 'threatening', 'revenge', 'payback', 'get even'
];

// Academic/historical contexts that should be allowed (checked before violence indicators)
const ALLOWED_ACADEMIC_CONTEXTS = [
  'bombing a test', 'bombed the test', 'bomb the test', 'bombing the exam',
  'bombing of', 'bombing raid', 'atomic bomb', 'nuclear bomb', 'bomb shelter',
  'bomb squad', 'bomb disposal', 'bomb threat', 'bombing campaign', 'bombing run'
];

// Harassment indicators
const HARASSMENT_INDICATORS = [
  'stalk', 'stalking', 'harass', 'harassing', 'bully', 'bullying',
  'threaten', 'threatening', 'intimidate', 'intimidating', 'scare',
  'frighten', 'terrorize', 'terrorizing', 'blackmail', 'blackmailing'
];

export function filterContent(text: string): ContentFilterResult {
  const lowerText = text.toLowerCase();
  
  // Check for self-harm indicators (highest priority)
  for (const indicator of SELF_HARM_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return {
        isSafe: false,
        category: 'self-harm',
        confidence: 0.9,
        message: "I'm concerned about what you're saying. Your life has value, and there are people who want to help.",
        crisisResources: CRISIS_RESOURCES
      };
    }
  }
  
  // Check if text contains academic/historical context that should be allowed
  const hasAcademicContext = ALLOWED_ACADEMIC_CONTEXTS.some(context => lowerText.includes(context));
  
  // Check for violence indicators (skip if academic context is present)
  if (!hasAcademicContext) {
    for (const indicator of VIOLENCE_INDICATORS) {
      if (lowerText.includes(indicator)) {
        return {
          isSafe: false,
          category: 'violence',
          confidence: 0.8,
          message: "I can't help with content that promotes violence. Let's talk about harmful content instead."
        };
      }
    }
  }
  
  // Check for harassment indicators
  for (const indicator of HARASSMENT_INDICATORS) {
    if (lowerText.includes(indicator)) {
      return {
        isSafe: false,
        category: 'harassment',
        confidence: 0.7,
        message: "I can't help with harassment or stalking. Let's focus on positive interactions instead."
      };
    }
  }
  
  // Check for profanity (whole words only, not substrings)
  for (const word of PROFANITY_WORDS) {
    // Use word boundaries to match whole words only (not substrings)
    // This prevents "hello" from matching "hell", "classic" from matching "ass", etc.
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(lowerText)) {
      return {
        isSafe: false,
        category: 'profanity',
        confidence: 0.6,
        message: "I prefer to keep our conversation respectful. Could you rephrase that without profanity?"
      };
    }
  }
  
  // Check for spam patterns
  if (isSpam(lowerText)) {
    return {
      isSafe: false,
      category: 'spam',
      confidence: 0.5,
      message: "I can't help with spam or promotional content. Let's focus on your academic questions instead."
    };
  }
  
  return {
    isSafe: true,
    category: 'safe',
    confidence: 1.0
  };
}

function isSpam(text: string): boolean {
  // Check for excessive repetition
  const words = text.split(' ');
  const wordCounts = new Map<string, number>();
  
  for (const word of words) {
    if (word.length > 3) { // Only count words longer than 3 characters
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  
  // If any word appears more than 3 times in a short message, it's likely spam
  for (const count of wordCounts.values()) {
    if (count > 3 && words.length < 20) {
      return true;
    }
  }
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    return true;
  }
  
  // Check for excessive punctuation
  const punctRatio = (text.match(/[!?.]{2,}/g) || []).length / text.length;
  if (punctRatio > 0.1) {
    return true;
  }
  
  return false;
}

// Generate crisis response message
export function generateCrisisResponse(): string {
  return `I'm concerned about what you're sharing. Your life has value and help is available right now.

**Immediate Help:**
• **988** (Suicide Prevention Lifeline) - Call or text 24/7
• **741741** (Crisis Text Line) - Text HOME 24/7
• **1-800-662-4357** (SAMHSA National Helpline) - 24/7

Please reach out to one of these resources now. You're not alone.`;
}

// Generate appropriate response based on filter result
export function generateFilterResponse(result: ContentFilterResult): string {
  if (result.category === 'self-harm') {
    return generateCrisisResponse();
  }
  
  if (result.category === 'profanity') {
    return "I prefer to keep our conversation respectful and professional. Could you rephrase your question without profanity? I'm here to help with your academic needs!";
  }
  
  if (result.category === 'violence') {
    return "I can't help with content that promotes violence. Let's focus on your academic questions instead. I'm here to help you succeed in your studies!";
  }
  
  if (result.category === 'harassment') {
    return "I can't help with harassment or stalking. Let's focus on positive, academic topics instead. I'm here to support your learning!";
  }
  
  if (result.category === 'spam') {
    return "I can't help with spam or promotional content. Let's focus on your academic questions instead. I'm here to help you learn!";
  }
  
  return "I'm here to help with your academic questions. Let's focus on your studies!";
}
