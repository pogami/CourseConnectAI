/**
 * Extracts the user's name from conversation messages
 * Looks for patterns like "my name is X", "I'm X", "call me X", etc.
 */
export function extractUserNameFromMessages(messages: Array<{ sender: string; text: string }>): string | null {
  if (!messages || messages.length === 0) return null;

  // Patterns to detect name mentions
  const namePatterns = [
    /(?:my name is|i'm|i am|call me|you can call me|you can refer to me as|just call me|my name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:name is|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:i go by|people call me|everyone calls me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is my name|here)/i,
  ];

  // Check messages in reverse order (most recent first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    // Only check user messages
    if (message.sender !== 'user') continue;

    const text = typeof message.text === 'string' ? message.text : JSON.stringify(message.text);
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        // Validate: name should be 2-50 characters and contain only letters and spaces
        if (extractedName.length >= 2 && extractedName.length <= 50 && /^[A-Za-z\s]+$/.test(extractedName)) {
          return extractedName;
        }
      }
    }
  }

  return null;
}

/**
 * Extracts the user's name from a single message
 */
export function extractUserNameFromMessage(message: string): string | null {
  if (!message) return null;

  const namePatterns = [
    /(?:my name is|i'm|i am|call me|you can call me|you can refer to me as|just call me|my name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:name is|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:i go by|people call me|everyone calls me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is my name|here)/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();
      // Validate: name should be 2-50 characters and contain only letters and spaces
      if (extractedName.length >= 2 && extractedName.length <= 50 && /^[A-Za-z\s]+$/.test(extractedName)) {
        return extractedName;
      }
    }
  }

  return null;
}




