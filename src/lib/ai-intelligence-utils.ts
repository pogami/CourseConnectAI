/**
 * AI Intelligence Utilities
 * Helper functions for analyzing questions and generating context
 */

export function detectQuestionComplexity(question: string): 'basic' | 'intermediate' | 'advanced' {
  const lowerQuestion = question.toLowerCase();
  
  // Advanced indicators
  const advancedKeywords = ['prove', 'derive', 'theorem', 'lemma', 'corollary', 'optimize', 'algorithm', 'complexity', 'asymptotic'];
  if (advancedKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'advanced';
  }
  
  // Intermediate indicators
  const intermediateKeywords = ['explain', 'analyze', 'compare', 'contrast', 'evaluate', 'calculate', 'solve', 'find'];
  if (intermediateKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'intermediate';
  }
  
  // Basic by default
  return 'basic';
}

export function getAdaptiveInstructions(complexity: 'basic' | 'intermediate' | 'advanced'): string {
  switch (complexity) {
    case 'advanced':
      return '\n\nFor this advanced question, provide a rigorous, detailed explanation with formal reasoning and mathematical precision.';
    case 'intermediate':
      return '\n\nFor this intermediate question, provide a clear, step-by-step explanation with examples.';
    case 'basic':
      return '\n\nFor this basic question, provide a simple, easy-to-understand explanation.';
    default:
      return '';
  }
}

export function isQuizRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('quiz') || 
         lowerQuestion.includes('practice test') || 
         lowerQuestion.includes('practice exam') ||
         lowerQuestion.includes('test me');
}

export function extractQuizTopic(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  const topicMatch = lowerQuestion.match(/(?:quiz|test|exam|practice).*?(?:on|about|for|covering)\s+([^.?!]+)/i);
  return topicMatch ? topicMatch[1].trim() : null;
}

export function detectConfusion(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const confusionIndicators = [
    'confused', 'don\'t understand', 'don\'t get', 'unclear', 'unclear about',
    'not sure', 'help me understand', 'explain', 'what does', 'how does'
  ];
  return confusionIndicators.some(indicator => lowerQuestion.includes(indicator));
}

export function isStudyPlanRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('study plan') || 
         lowerQuestion.includes('study schedule') ||
         lowerQuestion.includes('how should i study') ||
         lowerQuestion.includes('what should i study');
}

export function generateStudyPlan(courseData: any, topics: string[]): string {
  if (!topics || topics.length === 0) {
    return 'I can help you create a study plan! Please provide the topics you need to study.';
  }
  
  const assignments = courseData?.assignments || [];
  const exams = courseData?.exams || [];
  
  let plan = `Here's a suggested study plan for: ${topics.join(', ')}\n\n`;
  
  if (exams.length > 0) {
    const nextExam = exams[0];
    plan += `📅 Next Exam: ${nextExam.name || 'Upcoming Exam'}\n`;
    if (nextExam.date) {
      plan += `Date: ${nextExam.date}\n`;
    }
  }
  
  plan += `\nRecommended Study Schedule:\n`;
  plan += `1. Review lecture notes and textbook chapters\n`;
  plan += `2. Practice problems related to each topic\n`;
  plan += `3. Create flashcards for key concepts\n`;
  plan += `4. Take practice quizzes\n`;
  plan += `5. Review and reinforce weak areas\n`;
  
  return plan;
}

export function isAssignmentHelpRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('assignment') || 
         lowerQuestion.includes('homework') ||
         lowerQuestion.includes('hw') ||
         lowerQuestion.includes('problem set');
}

export function findRelevantAssignment(question: string, assignments: any[]): any | null {
  if (!assignments || assignments.length === 0) return null;
  
  const lowerQuestion = question.toLowerCase();
  
  // Try to find assignment by name
  for (const assignment of assignments) {
    const assignmentName = (assignment.name || '').toLowerCase();
    if (assignmentName && lowerQuestion.includes(assignmentName)) {
      return assignment;
    }
  }
  
  // Return first upcoming assignment
  const upcoming = assignments
    .filter(a => a.dueDate && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  return upcoming[0] || null;
}

export function extractTopics(text: string, availableTopics?: string[]): string[] {
  // Simple topic extraction - look for capitalized words or quoted phrases
  const topics: string[] = [];
  
  // If availableTopics provided, match against them
  if (availableTopics && availableTopics.length > 0) {
    const lowerText = text.toLowerCase();
    const matched = availableTopics.filter(topic => 
      lowerText.includes(topic.toLowerCase())
    );
    if (matched.length > 0) {
      topics.push(...matched);
    }
  }
  
  // Extract quoted topics
  const quotedMatches = text.match(/"([^"]+)"/g);
  if (quotedMatches) {
    topics.push(...quotedMatches.map(m => m.replace(/"/g, '')));
  }
  
  // Extract topics after keywords
  const topicKeywords = ['topic', 'topics', 'about', 'covering', 'on'];
  for (const keyword of topicKeywords) {
    const regex = new RegExp(`${keyword}\\s+([^.!?]+)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const topic = match.replace(new RegExp(keyword, 'gi'), '').trim();
        if (topic) topics.push(topic);
      });
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(topics.filter(t => t.length > 2)));
}

export function calculateDaysUntil(date: string): number {
  if (!date || date === 'null') return -1;
  
  try {
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return -1;
  }
}

export function isPracticeExamRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('practice exam') || 
         lowerQuestion.includes('practice test') ||
         lowerQuestion.includes('mock exam') ||
         lowerQuestion.includes('sample exam');
}

export function isResourceRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return lowerQuestion.includes('resource') || 
         lowerQuestion.includes('material') ||
         lowerQuestion.includes('textbook') ||
         lowerQuestion.includes('reading') ||
         lowerQuestion.includes('reference');
}

export function generateMemoryContext(metadata: any): string {
  if (!metadata) return '';
  
  let context = '';
  
  if (metadata.topicsCovered && metadata.topicsCovered.length > 0) {
    context += `\n\nPreviously discussed topics: ${metadata.topicsCovered.join(', ')}`;
  }
  
  if (metadata.strugglingWith && metadata.strugglingWith.length > 0) {
    context += `\n\nStudent has been struggling with: ${metadata.strugglingWith.join(', ')}`;
  }
  
  return context;
}

export function generatePracticeExamInstructions(topic: string, courseName: string): string {
  return `\n\n📝 PRACTICE EXAM MODE - INTERACTIVE:
Generate a comprehensive practice exam for ${topic || courseName}.

CRITICAL: You MUST output the exam in this EXACT format:

First, write a brief introduction (1-2 sentences).

Then on a new line, output:
EXAM_DATA: {"topic":"${topic || courseName}","timeLimit":30,"questions":[{"question":"Your question here","options":["A) Option 1","B) Option 2","C) Option 3","D) Option 4"],"answer":"A","explanation":"Why this is correct"}]}

Requirements:
- 20 questions total
- All must be multiple choice with 4 options (A, B, C, D)
- Answer must be just the letter (A, B, C, or D)
- Include brief explanation for each
- Difficulty progression (easier → harder)

The JSON must be valid and on ONE line after EXAM_DATA:`;
}

export function generateDeadlineContext(courseData: any): string {
  if (!courseData) return '';
  
  let context = '';
  const now = new Date();
  
  // Add assignment deadlines
  const assignments = courseData.assignments || [];
  const upcomingAssignments = assignments
    .filter((a: any) => {
      if (!a.dueDate || a.dueDate === 'null') return false;
      const dueDate = new Date(a.dueDate);
      return !isNaN(dueDate.getTime()) && dueDate >= now;
    })
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
  
  if (upcomingAssignments.length > 0) {
    context += '\n\n📅 Upcoming Assignments:';
    upcomingAssignments.forEach((assignment: any) => {
      const daysUntil = calculateDaysUntil(assignment.dueDate);
      context += `\n- ${assignment.name || 'Assignment'}: Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${assignment.dueDate})`;
    });
  }
  
  // Add exam deadlines
  const exams = courseData.exams || [];
  const upcomingExams = exams
    .filter((e: any) => {
      if (!e.date || e.date === 'null') return false;
      const examDate = new Date(e.date);
      return !isNaN(examDate.getTime()) && examDate >= now;
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);
  
  if (upcomingExams.length > 0) {
    context += '\n\n📅 Upcoming Exams:';
    upcomingExams.forEach((exam: any) => {
      const daysUntil = calculateDaysUntil(exam.date);
      context += `\n- ${exam.name || 'Exam'}: In ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${exam.date})`;
    });
  }
  
  return context;
}

