// Lazy imports for Firebase Admin to avoid build errors
// import { db } from '@/lib/firebase/server';
// import { Timestamp } from 'firebase-admin/firestore';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  description: string;
  type: 'assignment' | 'exam' | 'message' | 'reminder' | 'system' | 'study_group';
  priority?: 'low' | 'medium' | 'high';
  classId?: string;
  actionUrl?: string;
  chatId?: string;
}

/**
 * Create a notification for a user
 * Server-side only - uses Firebase Admin SDK
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const {
      userId,
      title,
      description,
      type,
      priority = 'medium',
      classId,
      actionUrl,
      chatId
    } = params;

    if (!userId) {
      console.warn('Cannot create notification: userId is required');
      return null;
    }

    // Lazy import Firebase Admin to avoid build errors
    const { getDb } = await import('@/lib/firebase/server');
    const { Timestamp } = await import('firebase-admin/firestore');
    const db = await getDb();

    if (!db || typeof db.collection !== 'function') {
      console.warn('Firebase not configured, notification not created');
      return null;
    }

    const notificationData = {
      userId,
      title,
      description: description.substring(0, 200), // Limit description length
      type,
      priority,
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...(classId && { classId }),
      ...(actionUrl && { actionUrl }),
      ...(chatId && { chatId })
    };

    const notificationRef = await db.collection('notifications').add(notificationData);
    const notificationId = notificationRef.id;

    console.log(`✅ Notification created: ${notificationId} for user ${userId}`);
    return { id: notificationId, success: true };
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    return { id: null, success: false, error: error.message };
  }
}

/**
 * Create an AI response notification
 * Specialized function for when AI responds in chat
 */
export async function createAIResponseNotification(
  userId: string,
  aiResponse: string,
  chatId?: string,
  classId?: string
) {
  if (!userId) {
    console.warn('Cannot create AI response notification: userId is required');
    return null;
  }

  // Truncate response for notification
  const truncatedResponse = aiResponse.length > 150 
    ? aiResponse.substring(0, 150) + '...' 
    : aiResponse;

  return createNotification({
    userId,
    title: '💬 New AI Response',
    description: truncatedResponse,
    type: 'message',
    priority: 'low',
    chatId,
    classId,
    actionUrl: chatId ? `/dashboard/chat?tab=${chatId}` : '/dashboard/chat'
  });
}
