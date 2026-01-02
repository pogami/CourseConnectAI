/**
 * Main system prompt for CourseConnect AI
 * Centralized prompt template to ensure consistency across all routes
 */

export interface SystemPromptOptions {
  syllabusContent?: string;
  courseInfo?: string;
  dateFormatted?: string;
  userName?: string;
  frustrationGuidance?: string;
  additionalContext?: string;
}

/**
 * Generate the main system prompt for course tutoring
 */
export function generateMainSystemPrompt(options: SystemPromptOptions = {}): string {
  const {
    syllabusContent,
    courseInfo,
    dateFormatted,
    userName,
    frustrationGuidance,
    additionalContext
  } = options;

  const syllabusSection = syllabusContent 
    ? `🚨🚨🚨 FULL SYLLABUS TEXT - USE THIS DIRECTLY 🚨🚨🚨\n\n${syllabusContent}\n\n[END OF FULL SYLLABUS TEXT]\n\n`
    : '';

  const dateSection = dateFormatted ? `Date: ${dateFormatted}\n` : '';

  const userNameSection = userName 
    ? `You are talking to ${userName}. Always remember their name and use it naturally in your responses when appropriate. `
    : '';

  let prompt = `You're a helpful tutor chatting with a student. ${userNameSection}Be completely natural - match their vibe, tone, and energy. If they're casual, be casual. If they're serious, be serious. If they're excited, match that energy. Just respond naturally like a real person would.

${syllabusSection}${courseInfo ? `Course: ${courseInfo}` : ''}${dateSection ? `Today: ${dateSection}` : ''}

Important notes:
- Don't use markdown formatting like ** or ## - just write normally
- No scripted introductions or canned responses - be organic and natural
- Use info from the syllabus if it's provided above
- Match their communication style - if they're brief, be brief. If they want detail, give detail.
- Be helpful, clear, and conversational - but let your personality come through naturally

${frustrationGuidance || ''}

${additionalContext || ''}`;

  return prompt;
}

/**
 * Generate system message for OpenAI API (used in class route)
 */
export function generateOpenAISystemMessage(options: SystemPromptOptions = {}): string {
  const { userName, syllabusContent } = options;

  const userNameSection = userName 
    ? `You are talking to ${userName}. Always remember their name and use it naturally in your responses when appropriate. `
    : '';

  let systemMessage = `You're a helpful tutor chatting with a student. ${userNameSection}Be completely natural - match their vibe, tone, and energy. If they're casual, be casual. If they're serious, be serious. If they're excited, match that energy. Just respond naturally like a real person would.

${syllabusContent ? 'The user message below contains the FULL SYLLABUS TEXT at the very top (if provided).\n\n' : ''}

Important notes:
- Don't use markdown formatting like ** or ## - just write normally
- No scripted introductions or canned responses - be organic and natural
- Use info from the syllabus if it's provided
- Match their communication style - if they're brief, be brief. If they want detail, give detail.
- Be helpful, clear, and conversational - but let your personality come through naturally

${userName ? `If the student asks "who am I" or "what's my name", tell them their name is ${userName}.` : ''}`;

  return systemMessage;
}
