import { db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Chat, Message } from '@/hooks/use-chat-store';

export interface SharedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  originalChatId: string;
  sharedAt: number;
}

export const shareChat = async (chat: Chat, userProfilePicture?: string): Promise<string> => {
  try {
    console.log('📤 shareChat: Starting share process', { chatId: chat.id, messageCount: chat.messages?.length });
    
    // Generate a random ID for the shared chat
    const shareId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const shareRef = doc(db, 'shared_chats', shareId);
    console.log('📤 shareChat: Generated share ID', shareId);
    
    // Create a clean copy of messages to remove any non-serializable data or sensitive info if needed
    const cleanMessages = chat.messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      name: msg.sender === 'bot' ? 'CourseConnect AI' : msg.name, // Ensure bot name is consistent
      timestamp: msg.timestamp,
      // Include user profile picture if available (from message, parameter, or chat context)
      photoURL: (msg as any).photoURL || (msg as any).userPhotoURL || (msg.sender === 'user' ? userProfilePicture : undefined) || undefined,
      // Include other safe fields
      sources: msg.sources,
      isSearchRequest: msg.isSearchRequest,
      file: msg.file ? { name: msg.file.name, size: msg.file.size, type: msg.file.type, url: msg.file.url } : undefined,
      files: msg.files?.map(f => ({ name: f.name, size: f.size, type: f.type, url: f.url })),
      // Legacy thinking fields
      thinkingSteps: msg.thinkingSteps,
      thinkingContent: msg.thinkingContent
    }));

    const sharedData: SharedChat = {
      id: shareId,
      title: chat.title,
      messages: cleanMessages as Message[],
      createdAt: chat.createdAt || Date.now(),
      originalChatId: chat.id,
      sharedAt: Date.now()
    };

    // Firestore doesn't accept undefined values, so we clean the object
    const cleanData = JSON.parse(JSON.stringify(sharedData));
    console.log('📤 shareChat: Cleaned data, saving to Firestore...');

    await setDoc(shareRef, cleanData);
    console.log('📤 shareChat: Successfully saved to Firestore', shareId);
    
    return shareId;
  } catch (error) {
    console.error('📤 shareChat: Error occurred', error);
    throw new Error(`Failed to share chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getSharedChat = async (shareId: string): Promise<SharedChat | null> => {
  try {
    const shareRef = doc(db, 'shared_chats', shareId);
    const snap = await getDoc(shareRef);
    
    if (snap.exists()) {
      return snap.data() as SharedChat;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shared chat:', error);
    return null;
  }
};

