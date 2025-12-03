"use client";

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  writeBatch,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client-simple';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'assignment' | 'exam' | 'message' | 'reminder' | 'system' | 'study_group';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  classId?: string;
  actionUrl?: string;
  userId: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  createNotification: (data: {
    title: string;
    description: string;
    type: Notification['type'];
    priority: Notification['priority'];
    classId?: string;
    actionUrl?: string;
  }) => Promise<string>;
}

export function useNotifications(user: User | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedNotifications: Notification[] = [];
          snapshot.forEach((doc) => {
            fetchedNotifications.push({
              id: doc.id,
              ...doc.data(),
            } as Notification);
          });
          setNotifications(fetchedNotifications);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching notifications:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notifications listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((docSnapshot) => {
        const notificationRef = doc(db, 'notifications', docSnapshot.id);
        batch.update(notificationRef, {
          isRead: true,
          updatedAt: new Date(),
        });
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach((docSnapshot) => {
        const notificationRef = doc(db, 'notifications', docSnapshot.id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      throw err;
    }
  }, [user]);

  const createNotification = useCallback(async (data: {
    title: string;
    description: string;
    type: Notification['type'];
    priority: Notification['priority'];
    classId?: string;
    actionUrl?: string;
  }) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        userId: user.uid,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        classId: data.classId || null,
        actionUrl: data.actionUrl || null,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
  };
}

