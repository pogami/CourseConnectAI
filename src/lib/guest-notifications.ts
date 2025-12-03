"use client";

/**
 * Guest notification utilities
 * Handles notifications for guest users (stored in localStorage)
 */

const GUEST_NOTIFICATIONS_KEY = 'guest-notifications';
const GUEST_VISIT_KEY = 'guest-has-visited';

export interface GuestNotification {
  id: string;
  title: string;
  description: string;
  type: 'assignment' | 'exam' | 'message' | 'reminder' | 'system' | 'study_group';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  classId?: string;
  actionUrl?: string;
}

/**
 * Check if this is the first time the guest user has visited
 */
export function isFirstGuestVisit(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(GUEST_VISIT_KEY);
}

/**
 * Mark guest as having visited
 */
export function markGuestAsVisited(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_VISIT_KEY, 'true');
}

/**
 * Get all guest notifications from localStorage
 */
function getGuestNotifications(): GuestNotification[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(GUEST_NOTIFICATIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Error reading guest notifications:', error);
    return [];
  }
}

/**
 * Save guest notifications to localStorage
 */
function saveGuestNotifications(notifications: GuestNotification[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only last 50 notifications
    const limited = notifications.slice(0, 50);
    localStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Error saving guest notifications:', error);
  }
}

/**
 * Create a welcome notification for guest users
 */
export function createWelcomeNotification(): void {
  const notification: GuestNotification = {
    id: `guest-welcome-${Date.now()}`,
    title: "🎉 Welcome to CourseConnect!",
    description: "You're exploring as a guest. Create an account to save your progress and unlock premium features!",
    type: 'system',
    priority: 'high',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/signup'
  };

  const notifications = getGuestNotifications();
  notifications.unshift(notification);
  saveGuestNotifications(notifications);
}

/**
 * Create an AI response notification for guest users
 */
export function createAIResponseNotification(): void {
  const notification: GuestNotification = {
    id: `guest-ai-response-${Date.now()}`,
    title: "💬 New AI Response",
    description: "Your AI tutor has responded to your question. Check it out!",
    type: 'message',
    priority: 'medium',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/dashboard/chat'
  };

  const notifications = getGuestNotifications();
  notifications.unshift(notification);
  saveGuestNotifications(notifications);
}

/**
 * Create a study encouragement notification for guest users
 */
export function createStudyEncouragementNotification(classNames: string[]): void {
  const classList = classNames.length > 0 
    ? classNames.slice(0, 3).join(', ') 
    : 'your courses';
  
  const notification: GuestNotification = {
    id: `guest-study-encouragement-${Date.now()}`,
    title: "📚 Keep Studying!",
    description: `You're doing great with ${classList}! Keep up the excellent work.`,
    type: 'reminder',
    priority: 'low',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/dashboard/chat'
  };

  const notifications = getGuestNotifications();
  notifications.unshift(notification);
  saveGuestNotifications(notifications);
}

/**
 * Create an assignment reminder notification for guest users
 */
export function createAssignmentReminderNotification(assignmentName: string, dueDate?: string): void {
  const description = dueDate 
    ? `${assignmentName} is due soon. Don't forget to complete it!`
    : `Don't forget about ${assignmentName}!`;

  const notification: GuestNotification = {
    id: `guest-assignment-reminder-${Date.now()}`,
    title: "📝 Assignment Reminder",
    description,
    type: 'assignment',
    priority: 'high',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/dashboard/chat'
  };

  const notifications = getGuestNotifications();
  notifications.unshift(notification);
  saveGuestNotifications(notifications);
}


