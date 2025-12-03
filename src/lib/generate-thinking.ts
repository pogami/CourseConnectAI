/**
 * Generate natural, organic internal thinking content
 * Creates a stream-of-consciousness style thinking process similar to ChatGPT/Groq
 */

export function generateInternalThinking(question: string): string {
  const q = question.toLowerCase().trim();
  
  // Extract potential subject/topic (simple heuristic)
  const stopWords = ["what", "is", "a", "the", "how", "do", "i", "why", "does", "can", "you", "explain", "tell", "me", "about", "when", "where"];
  const words = q.replace(/[^\w\s]/g, "").split(" ");
  const keywords = words.filter(w => !stopWords.includes(w) && w.length > 2);
  const topic = keywords.length > 0 ? keywords.slice(0, 3).join(" ") : "this topic";

  // 1. INITIAL REACTION (Immediate thoughts)
  const openers = [
    `Hmm, okay. The user is asking about "${topic}". Let me break this down.`,
    `Interesting question about ${topic}. I need to be precise here.`,
    `Alright, looking at this query regarding ${topic}. It seems straightforward, but I should check for nuances.`,
    `Okay, ${topic}. This is a key concept. Let me recall the most relevant details.`,
    `Right, so the goal is to explain ${topic}. I should start by establishing the context.`,
    `Let's analyze this request about ${topic}. There are a few angles to consider.`
  ];

  // 2. EXPLORATION & STRATEGY (Deepening the thought)
  let strategy = "";
  
  if (q.includes("code") || q.includes("function") || q.includes("react") || q.includes("js") || q.includes("error")) {
    strategy = `Since this is technical, I need to provide a clean code example. I should also explain *why* it works that way, not just *how*. Common pitfalls with ${topic} are worth mentioning too.`;
  } else if (q.includes("why") || q.includes("reason")) {
    strategy = `They're looking for the underlying logic. I shouldn't just state facts; I need to connect the cause and effect. A step-by-step derivation would be good.`;
  } else if (q.includes("compare") || q.includes("difference") || q.includes("vs")) {
    strategy = `This is a comparison. I should structure this with clear points of contrast—maybe a pros/cons approach or a direct feature-by-feature breakdown.`;
  } else if (q.includes("how") || q.includes("steps")) {
    strategy = `They need a process. I'll outline the steps clearly. I should check if there are any prerequisites they need to know before starting.`;
  } else {
    strategy = `I need to synthesize the key information about ${topic} into a clear, digestible summary. It shouldn't be too dense, but it needs to be comprehensive.`;
  }

  // 3. SELF-CORRECTION (The "Wait..." moment)
  const refinements = [
    "Actually, wait—I should make sure I don't assume they know the jargon. I'll define key terms briefly.",
    "Hold on, is there a more modern way to do this? Yes, I should focus on the current best practices, not outdated methods.",
    "I need to be careful not to overcomplicate it. Let's stick to the core concept first, then add detail if needed.",
    "Wait, I should also consider the edge cases. What if this assumption doesn't hold? I'll add a quick note about that.",
    "Let me double-check. Is this always true? Mostly, yes, but there are exceptions I should flag.",
    "I'm thinking I should use an analogy here. It often helps make abstract concepts like this concrete."
  ];

  // 4. FINAL PLAN (Ready to answer)
  const closers = [
    "Okay, that feels solid. I'll structure the response to be direct and helpful.",
    "I have a clear plan now. I'll start with the high-level answer and then drill down.",
    "This looks good. I'm ready to formulate the response.",
    "I think I have everything I need. Time to write this out clearly.",
    "Alright, let's get this written down. I'll focus on clarity and accuracy."
  ];

  // Randomly select parts to create a unique flow
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const refinement = refinements[Math.floor(Math.random() * refinements.length)];
  const closer = closers[Math.floor(Math.random() * closers.length)];

  // Combine into a natural stream
  return `${opener} ${strategy} ${refinement} ${closer}`;
}

/**
 * Generate thinking content progressively (word by word) for streaming effect
 */
export function* generateThinkingStream(question: string): Generator<string, void, unknown> {
  const fullThinking = generateInternalThinking(question);
  const words = fullThinking.split(' ');
  
  let current = '';
  for (const word of words) {
    current += (current ? ' ' : '') + word;
    yield current;
  }
}
