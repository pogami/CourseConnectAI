/**
 * Calculate AI-powered priority rankings for assignments
 * Considers: due date proximity, weight, course difficulty, and user activity
 */

export interface AssignmentItem {
  name: string;
  dueDate: Date | string;
  weight?: number | string;
  course: string;
  chatId: string;
  type: 'assignment' | 'exam';
  status?: string;
  description?: string;
}

export interface ChatData {
  id?: string;
  messages?: Array<{
    sender?: string;
    text?: string;
    timestamp?: number | Date;
  }>;
  courseData?: {
    courseCode?: string;
    courseName?: string;
    difficulty?: string;
    topics?: string[];
  };
}

/**
 * Calculate priority score for an assignment
 * Higher score = higher priority
 */
function calculatePriorityScore(
  assignment: AssignmentItem,
  chats: Record<string, ChatData>,
  now: Date = new Date()
): number {
  let score = 0;

  // 1. Due date proximity (most important factor)
  const dueDate = assignment.dueDate instanceof Date 
    ? assignment.dueDate 
    : new Date(assignment.dueDate);
  const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    score += 1000; // Overdue = highest priority
  } else if (daysUntil === 0) {
    score += 500; // Due today
  } else if (daysUntil === 1) {
    score += 400; // Due tomorrow
  } else if (daysUntil <= 2) {
    score += 300; // Due in 2 days
  } else if (daysUntil <= 3) {
    score += 200; // Due in 3 days
  } else if (daysUntil <= 5) {
    score += 100; // Due in 5 days
  } else if (daysUntil <= 7) {
    score += 50; // Due this week
  }
  // Beyond 7 days gets minimal score boost

  // 2. Weight/percentage (higher weight = higher priority)
  const weight = assignment.weight 
    ? (typeof assignment.weight === 'number' ? assignment.weight : parseFloat(String(assignment.weight)))
    : 10; // Default to 10% if not specified
  
  if (weight >= 20) {
    score += 150; // Major assignment/exam
  } else if (weight >= 15) {
    score += 100; // Significant assignment
  } else if (weight >= 10) {
    score += 50; // Moderate assignment
  } else if (weight >= 5) {
    score += 25; // Small assignment
  }

  // 3. Type boost (exams are typically more important)
  if (assignment.type === 'exam') {
    score += 100;
  }

  // 4. User activity/struggles (check chat history)
  const chat = chats[assignment.chatId];
  if (chat?.messages) {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const assignmentName = assignment.name.toLowerCase();
    const assignmentDesc = (assignment.description || '').toLowerCase();
    
    let mentionCount = 0;
    let recentMention = false;
    
    chat.messages.forEach((msg: any) => {
      if (msg.sender !== 'user') return;
      const msgTime = msg.timestamp instanceof Date 
        ? msg.timestamp 
        : new Date(msg.timestamp);
      if (msgTime < sevenDaysAgo) return;
      
      const msgText = (msg.text || '').toLowerCase();
      if (msgText.includes(assignmentName) || 
          (assignmentDesc && msgText.includes(assignmentDesc))) {
        mentionCount++;
        if (msgTime.getTime() > (now.getTime() - 24 * 60 * 60 * 1000)) {
          recentMention = true;
        }
      }
    });
    
    // Boost if user has been asking about this assignment
    if (recentMention) {
      score += 75; // Mentioned in last 24h
    } else if (mentionCount > 0) {
      score += 25 * Math.min(mentionCount, 3); // Up to 75 points for multiple mentions
    }
  }

  // 5. Course difficulty (harder courses get slight boost)
  const courseData = chat?.courseData;
  if (courseData?.difficulty) {
    const difficulty = courseData.difficulty.toLowerCase();
    if (difficulty.includes('hard') || difficulty.includes('advanced')) {
      score += 25;
    } else if (difficulty.includes('medium') || difficulty.includes('intermediate')) {
      score += 10;
    }
  }

  return score;
}

/**
 * Calculate Priority 1, 2, 3 rankings for assignments due this week
 */
export function calculatePriorityRankings(
  assignments: AssignmentItem[],
  chats: Record<string, ChatData>,
  now: Date = new Date()
): Array<AssignmentItem & { priority: number; priorityScore: number }> {
  // Filter to only assignments due within the next 7 days
  const thisWeek = assignments.filter(a => {
    const dueDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7 && a.status !== 'Completed';
  });

  // Calculate priority scores
  const withScores = thisWeek.map(a => ({
    ...a,
    priorityScore: calculatePriorityScore(a, chats, now)
  }));

  // Sort by priority score (highest first)
  const sorted = withScores.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign Priority 1, 2, 3 (only top 3 get numbered priorities)
  return sorted.map((item, index) => ({
    ...item,
    priority: index < 3 ? index + 1 : 0 // 0 means no priority label
  }));
}

/**
 * Get priority label text
 */
export function getPriorityLabel(priority: number): string | null {
  if (priority === 0) return null;
  return `Priority ${priority}`;
}

