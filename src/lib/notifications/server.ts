// Temporarily disabled for build
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
    
    console.log(`✅ Notification created for user ${userId}: ${title}`);
    
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
}

/**
 * Create an AI response notification
 * Specialized function for when AI responds in chat
 */
export async function createAIResponseNotification(
  userId: string,
  aiResponse: string,
  chatId: string,
  chatTitle?: string
) {
  try {
    // Get first sentence or 100 chars of AI response for description
    const description = aiResponse
      .split(/[.!?]/)[0]
      .substring(0, 100)
      .trim() + '...';

    const title = chatTitle 
      ? `New message in ${chatTitle}`
      : 'New message from CourseConnect AI';

    return await createNotification({
      userId,
      title,
      description,
      type: 'message',
      priority: 'medium',
      chatId,
      actionUrl: `/dashboard/chat?id=${chatId}`
    });
  } catch (error) {
    console.error('Error creating AI response notification:', error);
    return null;
  }
}

