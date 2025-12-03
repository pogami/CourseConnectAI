
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, Firestore, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
// Socket.IO removed - using Pusher for real-time messaging

// Helper function to get guest display name from localStorage
const getGuestDisplayName = (): string => {
  if (typeof window === 'undefined') return 'Guest User';
  
  try {
    const guestUser = localStorage.getItem('guestUser');
    if (guestUser) {
      const parsed = JSON.parse(guestUser);
      return parsed.displayName || 'Guest User';
    }
  } catch (error) {
    console.warn('Failed to parse guest user from localStorage:', error);
  }
  
  return 'Guest User';
};

export type Message = {
    id?: string;
    sender: "user" | "bot" | "moderator" | "system";
    text: string;
    name: string;
    timestamp: number;
    userId?: string;
    isJoinMessage?: boolean;
    sources?: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
    isSearchRequest?: boolean; // Flag to indicate web search was requested
    file?: {
        name: string;
        size: number;
        type: string;
        url: string;
    };
    files?: Array<{
        name: string;
        size: number;
        type: string;
        url: string;
    }>;
    thinkingSteps?: string[]; // Deprecated: Array of thinking steps (legacy)
    thinkingContent?: string; // Natural language thinking content (stream of consciousness)
};

export type Chat = {
    id: string;
    title: string;
    messages: Message[];
    createdAt?: number;
    updatedAt?: number;
    chatType?: 'private' | 'public' | 'class';
    classGroupId?: string;
    members?: string[];
    disabled?: boolean; // For coming soon features
    courseData?: {
        courseName?: string;
        courseCode?: string;
        professor?: string;
        university?: string;
        semester?: string;
        year?: string;
        department?: string;
        topics?: string[];
        assignments?: Array<{ name: string; dueDate?: string; description?: string }>;
        exams?: Array<{ name: string; date?: string; daysUntil?: number }>;
    };
    // Conversation metadata for AI intelligence
    metadata?: {
        topicsCovered?: string[]; // Topics student has discussed
        strugglingWith?: string[]; // Topics student seems confused about
        quizzesGenerated?: Array<{
            topic: string;
            questions: Array<{ question: string; answer: string }>;
            timestamp: number;
        }>;
        lastStudyPlanDate?: number;
        questionComplexityLevel?: 'basic' | 'intermediate' | 'advanced';
    };
};

interface ChatState {
  chats: Record<string, Chat>;
  currentTab: string | undefined;
  showUpgrade: boolean; // To control the upgrade modal
  isGuest: boolean;
  isStoreLoading: boolean;
  isSendingMessage: boolean; // Loading state for message sending
  isDemoMode: boolean; // Demo mode for Advanced AI features
  trialActivated: boolean; // Whether user has activated their trial
  trialStartDate: number | null; // When the trial started (timestamp)
  trialDaysLeft: number; // Days remaining in trial
  // Real-time messaging handled by Pusher (no longer using Socket.IO)
  addChat: (chatName: string, initialMessage: Message, customChatId?: string, chatType?: 'private' | 'public' | 'class', courseData?: Chat['courseData']) => Promise<void>;
  addMessage: (chatId: string, message: Message, replaceLast?: boolean) => Promise<void>;
  addUserJoinMessage: (chatId: string, userName: string, userId: string) => Promise<void>;
  joinPublicGeneralChat: () => Promise<void>;
  subscribeToChat: (chatId: string) => Promise<void>;
  setCurrentTab: (tabId: string | undefined) => void;
  setShowUpgrade: (show: boolean) => void;
  setIsDemoMode: (isDemo: boolean) => void;
  activateTrial: () => void; // Activate the 14-day trial
  updateTrialDaysLeft: () => void; // Update trial days remaining
  initializeAuthListener: () => () => void; // Returns an unsubscribe function
  clearGuestData: () => void;
  resetChat: (chatId: string) => Promise<void>;
  exportChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  initializeGeneralChats: () => void;
  // Real-time messaging methods (Pusher handles this directly)
  sendRealtimeMessage: (chatId: string, message: Message) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  receiveRealtimeMessage: (chatId: string, message: Message) => void;
}

const getChatId = (chatName: string) => chatName.toLowerCase().replace(/[\\s:]/g, '-');


export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      currentTab: undefined,
      showUpgrade: false,
      isGuest: true,
      isStoreLoading: true,
      isSendingMessage: false,
      isDemoMode: false, // Only enable demo mode when trial is activated
      trialActivated: false, // Trial not activated by default
      trialStartDate: null, // No trial start date initially
      trialDaysLeft: 14, // Full 14 days available
      // Real-time messaging state (handled by Pusher)
      // Track active Firestore subscriptions to avoid duplicates
      _chatSubscriptions: {} as Record<string, () => void>,

      initializeAuthListener: () => {
        console.log("initializeAuthListener called");
        
        // Migrate old chats to add chatType if missing - ENHANCED VERSION
        const migrateOldChats = () => {
          const currentChats = get().chats;
          let needsUpdate = false;
          const updatedChats = { ...currentChats };
          
          Object.keys(updatedChats).forEach(chatId => {
            const chat = updatedChats[chatId];
            
            // Migrate missing chatType
            if (!chat.chatType) {
              console.log('🔧 Migrating old chat:', chatId, 'hasCourseData:', !!chat.courseData);
              // Determine chatType based on chat ID and courseData
              if (chatId === 'public-general-chat') {
                chat.chatType = 'public';
              } else if (chatId.includes('private-general-chat')) {
                chat.chatType = 'private';
              } else if (chat.courseData) {
                chat.chatType = 'class'; // CRITICAL: Class chats have courseData
              } else {
                chat.chatType = 'private';
              }
              needsUpdate = true;
              console.log('✅ Migrated chat to chatType:', chat.chatType);
            }
            
            // FIX: If chatType is 'private' but it's clearly a class chat, fix it
            if (chat.chatType === 'private' && chatId.length > 20 && !chatId.includes('general-chat')) {
              // Check if the title contains course-like patterns
              const titlePattern = /^[A-Z]{2,4}\s*\d{4}|Calculus|Physics|Chemistry|Biology|English|History|Algebra|General|Literature/i;
              if (titlePattern.test(chat.title)) {
                console.log(`🔧 AUTO-FIX: Chat "${chat.title}" (${chatId}) should be 'class', not 'private'`);
                chat.chatType = 'class';
                needsUpdate = true;
              }
            }
          });
          
          if (needsUpdate) {
            console.log('✅ Migrated', Object.keys(updatedChats).filter(id => !currentChats[id]?.chatType).length, 'chats, updating store');
            set({ chats: updatedChats });
          } else {
            console.log('✅ All chats already have chatType, no migration needed');
          }
        };
        
        // Run migration immediately
        migrateOldChats();
        
        // ALSO run migration after a short delay to catch any timing issues
        setTimeout(() => {
          console.log('🔄 Running delayed migration check...');
          migrateOldChats();
        }, 1000);
        
        // Initialize general chats immediately for real-time functionality
        const initializeGeneralChats = (userId?: string) => {
          console.log("initializeGeneralChats called with userId:", userId);
          set((state) => {
            console.log("Setting up chats in store, current state:", { 
              chatsCount: Object.keys(state.chats).length,
              currentTab: state.currentTab,
              isStoreLoading: state.isStoreLoading 
            });
            
            const newState = { ...state };
            
            // Create public-general-chat if it doesn't exist (DISABLED - Coming Soon)
            if (!newState.chats['public-general-chat']) {
              console.log("Creating public-general-chat (disabled)");
              
              // Check if user is developer (replace with your actual user ID)
              const isDeveloper = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 localStorage.getItem('dev-mode') === 'true');
              
              newState.chats['public-general-chat'] = {
                id: 'public-general-chat',
                title: 'Community',
                messages: [{
                  sender: 'bot' as const,
                  name: 'CourseConnect AI',
                  text: isDeveloper 
                    ? '👨‍💻 **Developer Mode: Community Chat Active**\n\nYou have developer access to Community Chat for testing. Regular users will see the "Coming Soon" message.\n\nThis chat is shared across all users for real-time collaboration testing.'
                    : '🚧 **Community Chat Coming Soon!**\n\nWe\'re building an amazing community space! While we finish up, here\'s what you can do:\n\n✅ **Use General Chat** - Get AI help with all your courses\n✅ **Upload Your Syllabus** - Unlock course-specific AI tutoring\n✅ **Report Issues** - Found a bug? Click your profile icon → "Report Issue"\n\nStay tuned for updates! 🎓',
                  timestamp: Date.now()
                }],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                chatType: 'public',
                disabled: !isDeveloper
              } as Chat;
            }
            
            // Create private-general-chat with user-specific ID
            const privateGeneralChatId = userId ? `private-general-chat-${userId}` : 'private-general-chat-guest';
            if (!newState.chats[privateGeneralChatId]) {
              console.log("Creating private general chat:", privateGeneralChatId);
              newState.chats[privateGeneralChatId] = {
                id: privateGeneralChatId,
                title: 'General',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                chatType: 'private'
              } as Chat;
            }
            
            console.log("Chats initialized:", Object.keys(newState.chats));
            return newState;
          });
        };
        
        // Initialize chats immediately with guest mode
        initializeGeneralChats(undefined); // Guest mode
        
        // Immediately set loading to false, enable guest mode, and set default currentTab for real-time chat
        console.log("Setting isStoreLoading to false, isGuest to true, and currentTab to private-general-chat-guest");
        set({ 
          isStoreLoading: false, 
          isGuest: true,
          currentTab: 'private-general-chat-guest' // Set default tab to private guest chat
        });
        
        console.log("Store initialization complete, new state:", {
          isStoreLoading: false,
          isGuest: true,
          currentTab: 'public-general-chat'
        });
        
        // Initialize default chats with clean state (one-time per version)
        const CHAT_VERSION = 'v2.2'; // Changed to v2.2 to force clean reset with join times
        const lastInitVersion = localStorage.getItem('chat-init-version');
        
        // CRITICAL: Set join times BEFORE subscribing to Firestore to prevent old messages from loading
        const currentTime = Date.now();
        if (!localStorage.getItem('chat-join-time-public-general-chat')) {
          localStorage.setItem('chat-join-time-public-general-chat', currentTime.toString());
          console.log('⏰ Set default join time for Community Chat');
        }
        if (!localStorage.getItem('chat-join-time-private-general-chat-guest')) {
          localStorage.setItem('chat-join-time-private-general-chat-guest', currentTime.toString());
          console.log('⏰ Set default join time for Guest General Chat');
        }
        
        if (lastInitVersion !== CHAT_VERSION) {
          console.log('🔄 Initializing default chats with clean state (v2.2)...');
          get().initializeDefaultChats().then(() => {
            localStorage.setItem('chat-init-version', CHAT_VERSION);
            console.log('✅ Default chats initialized with v2.2');
          });
        }

        // Subscribe to Firestore for message persistence (guest mode)
        console.log("Setting up Firestore subscriptions for message persistence (guest)");
        try {
          // Subscribe to public chat (disabled) and guest private chat
          get().subscribeToChat('public-general-chat');
          get().subscribeToChat('private-general-chat-guest');
          console.log("Firestore subscriptions established for guest");
        } catch (error) {
          console.warn("Failed to establish Firestore subscriptions:", error);
        }
        
        // Check if auth is properly initialized
        if (!auth || typeof auth !== 'object' || typeof auth.onAuthStateChanged !== 'function') {
          console.warn("Auth object not properly initialized, using guest mode for real-time chat");
          return () => {}; // Return empty unsubscribe function
        }
        
        console.log("Auth object is properly initialized, setting up auth listener");
        
        const unsubscribe = onAuthStateChanged(auth as Auth, async (user) => {
          try {
            console.log("Auth state changed, user:", user ? "signed in" : "signed out");
            if (user) {
              // User is signed in.
              console.log("User signed in, loading chats...");
              // Clear uploaded syllabi when new user signs in
              if (typeof window !== 'undefined') {
                localStorage.removeItem('uploaded-syllabi');
              }
              set({ isGuest: false, isStoreLoading: false }); // Keep loading false for real-time chat
              
              // Create user-specific private general chat
              const privateGeneralChatId = `private-general-chat-${user.uid}`;
              initializeGeneralChats(user.uid);
              
              // Set join time for user-specific chat BEFORE subscribing
              const userChatJoinTimeKey = `chat-join-time-${privateGeneralChatId}`;
              if (!localStorage.getItem(userChatJoinTimeKey)) {
                localStorage.setItem(userChatJoinTimeKey, Date.now().toString());
                console.log(`⏰ Set default join time for ${privateGeneralChatId}`);
              }
              
              // Switch to user-specific chat
              set({ currentTab: privateGeneralChatId });
              
              // Subscribe to user-specific chat
              get().subscribeToChat(privateGeneralChatId);
              console.log(`✅ Switched to user-specific chat: ${privateGeneralChatId}`);
              
              try {
                const userDocRef = doc(db as Firestore, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const chatIds: string[] = userData.chats || [];
                    const chatsToLoad: Record<string, Chat> = {};

                    for (const chatId of chatIds) {
                         const chatDocRef = doc(db as Firestore, 'chats', chatId);
                         const chatDocSnap = await getDoc(chatDocRef);
                         if (chatDocSnap.exists()) {
                             const chatData = chatDocSnap.data() as Omit<Chat, 'id'>;
                             
                             // SAFETY CHECK: Ensure chatType is set (for backward compatibility)
                             let chatType = chatData.chatType;
                             if (!chatType) {
                               if (chatId === 'public-general-chat') {
                                 chatType = 'public';
                               } else if (chatId.includes('private-general-chat')) {
                                 chatType = 'private';
                               } else if (chatData.courseData) {
                                 chatType = 'class';
                               } else {
                                 chatType = 'private';
                               }
                               console.log(`⚠️ Chat ${chatId} missing chatType on init, inferred as: ${chatType}`);
                             }
                             
                             chatsToLoad[chatId] = { ...chatData, id: chatId, chatType };
                         }
                    }
                    // Merge with existing local chats to preserve any guest chats
                    const currentState = get();
                    const mergedChats = { ...currentState.chats, ...chatsToLoad };
                    set({ chats: mergedChats, isStoreLoading: false });
                } else {
                     // Don't overwrite existing chats if user has no Firestore chats yet
                     const currentState = get();
                     if (Object.keys(currentState.chats).length === 0) {
                         set({ chats: {}, isStoreLoading: false });
                     } else {
                         set({ isStoreLoading: false });
                     }
                }
              } catch (error) {
                console.warn("Failed to load user chats (offline mode):", error);
                // Continue in offline mode - preserve existing chats
                const currentState = get();
                if (Object.keys(currentState.chats).length === 0) {
                    set({ chats: {}, isStoreLoading: false });
                } else {
                    set({ isStoreLoading: false });
                }
              }
            } else {
              // User is signed out. The persisted local state for guests will be used.
              console.log("User signed out, switching to guest mode");
              set({ isGuest: true, isStoreLoading: false });
            }
          } catch (authError) {
            console.warn("Auth state change error (offline mode):", authError);
            // If auth fails completely, fall back to guest mode
            set({ isGuest: true, isStoreLoading: false });
          }
        });
        return unsubscribe;
      },

      addChat: async (chatName, initialMessage, customChatId?: string, chatType: 'private' | 'public' | 'class' = 'private', courseData?: Chat['courseData']) => {
        const chatId = customChatId || getChatId(chatName);
        const { isGuest } = get();
        
        const newChat: Chat = {
          id: chatId,
          title: chatName,
          messages: [initialMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chatType,
          members: chatType !== 'private' ? [] : undefined,
          courseData
        };

        console.log('addChat called:', { chatName, chatId, customChatId, chatType, isGuest, courseData: !!courseData });

        // Ensure initial message text is always a string
        const safeInitialMessage = {
          ...initialMessage,
          text: typeof initialMessage.text === 'string' ? initialMessage.text : JSON.stringify(initialMessage.text)
        };

        // Check if chat already exists
        if (get().chats[chatId]) {
          // Chat exists, just switch to it
          console.log('Chat already exists, switching to:', chatId);
          set({ currentTab: chatId });
          return;
        }

        if (isGuest) {
            // For guest users, just add to local state
            const newChatData = {
                id: chatId,
                title: chatName,
                messages: [safeInitialMessage],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                chatType: chatType || (courseData ? 'class' : 'private'), // FAILSAFE: Ensure chatType is set
                courseData
            };
            
            set((state) => ({
                chats: {
                    ...state.chats,
                    [chatId]: newChatData
                },
                currentTab: chatId
            }));
            
            // Verify the chat was added correctly
            const addedChat = get().chats[chatId];
            console.log('✅ Guest chat added:', {
              chatId,
              providedChatType: chatType,
              finalChatType: addedChat?.chatType,
              hasCourseData: !!addedChat?.courseData,
              fullChat: addedChat
            });
            
            // DOUBLE CHECK: If chatType is STILL undefined, fix it immediately
            if (!addedChat?.chatType) {
              console.error('⚠️ ChatType missing after add! Fixing...');
              set((state) => ({
                chats: {
                  ...state.chats,
                  [chatId]: {
                    ...state.chats[chatId],
                    chatType: courseData ? 'class' : 'private'
                  }
                }
              }));
            }
            
            return;
        }

        // Check if auth is properly initialized before accessing currentUser
        if (!auth || typeof auth !== 'object' || typeof auth.currentUser === 'undefined') {
          console.warn("Auth object not properly initialized, skipping Firestore operations");
          return;
        }
        
        const user = (auth as Auth)?.currentUser;
        if (!user) {
          console.log('No authenticated user, skipping Firestore operations');
          return;
        }

        console.log('User authenticated, persisting chat to Firestore:', user.uid);

        // Optimistically update local state first
        const newChatData = {
            id: chatId,
            title: chatName,
            messages: [safeInitialMessage],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            chatType: chatType || (courseData ? 'class' : 'private'), // FAILSAFE: Ensure chatType is set
            courseData
        };
        
        set((state) => {
            console.log('Adding chat to local state:', { chatId, chatName, chatType: newChatData.chatType });
            return {
                chats: {
                    ...state.chats,
                    [chatId]: newChatData
                },
                currentTab: chatId
            };
        });
        
        // Verify the chat was added correctly
        const addedChat = get().chats[chatId];
        console.log('✅ Logged-in user chat added:', {
          chatId,
          providedChatType: chatType,
          finalChatType: addedChat?.chatType,
          hasCourseData: !!addedChat?.courseData
        });
        
        // DOUBLE CHECK: If chatType is STILL undefined, fix it immediately
        if (!addedChat?.chatType) {
          console.error('⚠️ ChatType missing after add! Fixing...');
          set((state) => ({
            chats: {
              ...state.chats,
              [chatId]: {
                ...state.chats[chatId],
                chatType: courseData ? 'class' : 'private'
              }
            }
          }));
        }

        // Try to persist to Firestore (but don't fail if offline)
        try {
            const chatDocRef = doc(db as Firestore, 'chats', chatId);
            const chatDocSnap = await getDoc(chatDocRef);

            if (!chatDocSnap.exists()) {
                const newChat: Omit<Chat, 'id'> = {
                    title: chatName,
                    messages: [safeInitialMessage],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    chatType: chatType || (courseData ? 'class' : 'private'),
                    courseData: courseData || undefined
                };
                console.log('💾 Saving chat to Firestore:', { chatId, chatType: newChat.chatType, hasCourseData: !!newChat.courseData });
                await setDoc(chatDocRef, newChat);
            }
            
            const userDocRef = doc(db as Firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                chats: arrayUnion(chatId)
            });

            // Start realtime subscription
            await get().subscribeToChat(chatId);
        } catch (error) {
            // Only log non-offline errors to reduce noise
            if (error && typeof error === 'object' && 'code' in error && error.code !== 'unavailable') {
                console.warn("Failed to save chat to firestore:", error);
            }
            // Chat is already saved locally, so continue working
        }
      },

      addMessage: async (chatId, message, replaceLast = false) => {
        console.log('addMessage called:', { chatId, message: { id: message.id, text: message.text, sender: message.sender } });
        const { isGuest } = get();
        // Ensure chat exists locally
        set((state) => {
          if (!state.chats[chatId]) {
            state.chats[chatId] = {
              id: chatId,
              title: chatId === 'public-general-chat' ? 'Community' : chatId,
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chatType: chatId === 'public-general-chat' ? 'public' : 'private'
            } as Chat;
          }
          return state;
        });
        
        // Generate unique ID for message if it doesn't have one
        const generateMessageId = () => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const sessionId = Math.random().toString(36).substr(2, 4);
          return `${timestamp}-${random}-${sessionId}`;
        };
        
        // Ensure message text is always a string and has a unique ID, filter out undefined values
        const safeMessage = {
          id: message.id || generateMessageId(), // Generate ID if missing
          text: typeof message.text === 'string' ? message.text : JSON.stringify(message.text),
          sender: message.sender || 'user',
          name: message.name || getGuestDisplayName(),
          userId: message.userId || 'guest',
          timestamp: message.timestamp || Date.now(),
          // Only include other fields if they're not undefined
          ...(message.avatar && { avatar: message.avatar }),
          ...(message.photoURL && { photoURL: message.photoURL }),
          ...(message.isAI && { isAI: message.isAI }),
          ...(message.metadata && { metadata: message.metadata }),
          ...(message.file && { file: message.file }),
          ...(message.files && { files: message.files }),
          ...(message.sources && { sources: message.sources }),
          ...(message.thinkingSteps && { thinkingSteps: message.thinkingSteps })
        };
        
        // Optimistic update for immediate UI response (with deduplication)
        set((state) => {
          if (!state.chats[chatId]) return state;
          
        // Check if message already exists (by ID first, then by content)
        const existingById = state.chats[chatId].messages.find(m => m.id === safeMessage.id);
        const existingByContent = state.chats[chatId].messages.find(m => 
          m.timestamp === safeMessage.timestamp && 
          m.userId === safeMessage.userId && 
          m.text === safeMessage.text
        );
        
        if (existingById) {
          console.log('Message already exists by ID in addMessage, skipping duplicate:', { 
            id: safeMessage.id, 
            existingId: existingById.id,
            text: safeMessage.text?.substring(0, 50) + '...',
            totalMessages: state.chats[chatId].messages.length
          });
          return state;
        }
        
        if (existingByContent) {
          console.log('Message already exists by content in addMessage, skipping duplicate:', { 
            id: safeMessage.id, 
            existingId: existingByContent.id,
            text: safeMessage.text?.substring(0, 50) + '...',
            totalMessages: state.chats[chatId].messages.length
          });
          return state;
        }
        
        console.log('Adding new message to chat:', { 
          id: safeMessage.id, 
          userId: safeMessage.userId,
          text: safeMessage.text?.substring(0, 50) + '...',
          totalMessages: state.chats[chatId].messages.length + 1
        });
          
          const messages = state.chats[chatId].messages;
          const newMessages = replaceLast ? [...messages.slice(0, -1), safeMessage] : [...messages, safeMessage];
           return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...state.chats[chatId],
                messages: newMessages,
              },
            },
          };
        });

        // Message will be broadcasted via Pusher in the chat component
        console.log('Message added to store:', { 
          messageId: safeMessage.id, 
          userId: safeMessage.userId, 
          userName: safeMessage.name,
          chatId 
        });

        // Persist to Firestore in background (non-blocking) - works for both guest and authenticated users
        try {
            // Don't await this - let it run in background
            const chatDocRef = doc(db as Firestore, 'chats', chatId);
            getDoc(chatDocRef).then(chatDocSnap => {
              if (chatDocSnap.exists()) {
                const currentMessages = chatDocSnap.data().messages || [];
                const newMessages = replaceLast ? [...currentMessages.slice(0, -1), safeMessage] : [...currentMessages, safeMessage];
                return updateDoc(chatDocRef, { messages: newMessages });
              } else {
                // Create the chat doc if missing (especially for public-general-chat)
                const newChat: Omit<Chat, 'id'> = {
                  title: chatId === 'public-general-chat' ? 'Community' : chatId,
                  messages: [safeMessage],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  chatType: chatId === 'public-general-chat' ? 'public' : 'private'
                };
                return setDoc(chatDocRef, newChat);
              }
            }).catch(e => {
                // Only log non-offline errors to reduce noise
                if (e && typeof e === 'object' && 'code' in e && e.code !== 'unavailable') {
                    console.warn("Failed to save message to firestore:", e);
                }
                // Continue working in offline mode - the message is already in local state
            });
        } catch (error) {
            console.warn("Failed to save message to Firestore:", error);
            // Continue in real-time mode even if Firestore fails
        }
      },

      addUserJoinMessage: async (chatId: string, userName: string, userId: string) => {
        const joinMessage: Message = {
          sender: 'system',
          name: 'System',
          text: `${userName} has joined the chat`,
          timestamp: Date.now(),
          userId,
          isJoinMessage: true
        };

        const { addMessage } = get();
        await addMessage(chatId, joinMessage);
      },

      // Ensure public-general-chat exists and subscribe to it
      joinPublicGeneralChat: async () => {
        const chatId = 'public-general-chat';
        const chatTitle = 'Community';
        const { isGuest } = get();

        // Optimistically create locally if missing
        set((state) => {
          if (state.chats[chatId]) return state;
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                id: chatId,
                title: chatTitle,
                messages: [{
                  sender: 'bot',
                  name: 'CourseConnect AI',
                  text: 'Welcome to Community Chat! 🚧 Student collaboration features coming soon. For now, type @ai to get help from our AI tutor.',
                  timestamp: Date.now()
                }],
                chatType: 'public',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                members: []
              }
            },
            currentTab: chatId
          };
        });

        // Firestore: ensure doc exists and subscribe
        try {
          const chatDocRef = doc(db as Firestore, 'chats', chatId);
          const chatDocSnap = await getDoc(chatDocRef);
          if (!chatDocSnap.exists()) {
            await setDoc(chatDocRef, {
              title: chatTitle,
              messages: [{
                sender: 'bot',
                name: 'CourseConnect AI',
                text: 'Welcome to the Public General Chat! Type @ai to ask the AI in this room.',
                timestamp: Date.now()
              }],
              chatType: 'public',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              members: []
            } as Omit<Chat, 'id'>);
          }

          // Subscribe to realtime updates
          await get().subscribeToChat(chatId);
          set({ currentTab: chatId });
        } catch (e) {
          console.warn('joinPublicGeneralChat failed (offline mode ok):', e);
        }
      },

      // Subscribe to a chat document for realtime updates
      subscribeToChat: async (chatId: string) => {
        try {
          const anyState = get() as any;
          if (!anyState._chatSubscriptions) anyState._chatSubscriptions = {};
          if (anyState._chatSubscriptions[chatId]) {
            return; // Already subscribed
          }

          const chatDocRef = doc(db as Firestore, 'chats', chatId);
          
          // Get user's join time for this chat
          const joinTimeKey = `chat-join-time-${chatId}`;
          const userJoinTime = localStorage.getItem(joinTimeKey);
          const currentTime = Date.now();
          
          // If this is the first time joining this chat, set join time
          if (!userJoinTime) {
            localStorage.setItem(joinTimeKey, currentTime.toString());
            console.log(`First time joining ${chatId}, set join time: ${currentTime}`);
          }
          
          const unsubscribe = onSnapshot(chatDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data() as Omit<Chat, 'id'>;
              // Ensure messages text are strings for safety
              const allMessages = (data.messages || []).map((m: any) => ({
                ...m,
                text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text)
              }));
              
              // Filter messages based on user's join time
              const savedJoinTime = localStorage.getItem(joinTimeKey);
              let filteredMessages = allMessages;
              
              if (savedJoinTime) {
                const joinTime = parseInt(savedJoinTime);
                filteredMessages = allMessages.filter((msg: any) => {
                  // Show ONLY messages that have a timestamp and are at/after the join time.
                  // This prevents very old, legacy messages (that might be missing timestamps)
                  // from reappearing after the user resets or re-joins a chat.
                  return typeof msg.timestamp === 'number' && msg.timestamp >= joinTime;
                });
              }
              
              console.log(`Received ${allMessages.length} total messages, showing ${filteredMessages.length} for ${chatId}`);
              
              // SAFETY CHECK: Ensure chatType is set (for backward compatibility with old chats)
              let chatType = data.chatType;
              if (!chatType) {
                if (chatId === 'public-general-chat') {
                  chatType = 'public';
                } else if (chatId.includes('private-general-chat')) {
                  chatType = 'private';
                } else if (data.courseData) {
                  chatType = 'class';
                } else {
                  chatType = 'private';
                }
                console.log(`⚠️ Chat ${chatId} missing chatType, inferred as: ${chatType}`);
              }
              
              set((state) => ({
                chats: {
                  ...state.chats,
                  [chatId]: {
                    id: chatId,
                    ...data,
                    chatType,
                    messages: filteredMessages
                  }
                }
              }));
            }
          }, (error) => {
            console.warn('onSnapshot error for chat', chatId, error);
          });

          anyState._chatSubscriptions[chatId] = unsubscribe;
        } catch (e) {
          console.warn('subscribeToChat failed (offline mode ok):', e);
        }
      },
      setCurrentTab: (tabId) => {
        console.log('setCurrentTab called with:', tabId);
        console.log('Available chats:', Object.keys(get().chats));
        set({ currentTab: tabId });
      },
      setShowUpgrade: (show) => set({ showUpgrade: show }),
      setIsDemoMode: (isDemo) => set({ isDemoMode: isDemo }),
      
      // Trial management functions
      activateTrial: () => {
        const now = Date.now();
        set({ 
          trialActivated: true, 
          trialStartDate: now,
          trialDaysLeft: 14,
          isDemoMode: true // Enable demo mode when trial is activated
        });
        console.log("Trial activated! Started at:", new Date(now).toISOString());
      },
      
      updateTrialDaysLeft: () => {
        const { trialActivated, trialStartDate } = get();
        if (!trialActivated || !trialStartDate) {
          return; // No trial active
        }
        
        const now = Date.now();
        const trialEndTime = trialStartDate + (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
        const timeRemaining = trialEndTime - now;
        
        if (timeRemaining <= 0) {
          // Trial expired
          set({ 
            trialDaysLeft: 0, 
            isDemoMode: false,
            trialActivated: false 
          });
        } else {
          // Calculate days remaining
          const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
          set({ trialDaysLeft: daysRemaining });
        }
      },
      
      clearGuestData: () => {
        // Clear all local storage data
        try {
          // Remove the correct Zustand persist key
          localStorage.removeItem('chat-storage');
          // Also remove any legacy keys
          localStorage.removeItem('cc-chat-store');
          localStorage.removeItem('cc-active-tab');
          localStorage.removeItem('cc-course-context-card');
          
          // Clear guest-specific stats
          const today = new Date().toDateString();
          localStorage.removeItem(`guest-stats-${today}`);
          
          // Clear any guest notifications
          localStorage.removeItem('guest-notifications');
          
          console.log('✅ Cleared all guest data from localStorage');
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        // Reset store state to initial values
        set({ 
          chats: {}, 
          currentTab: undefined,
          isGuest: true,
          isDemoMode: false,
          trialActivated: false,
          trialStartDate: null,
          trialDaysLeft: 14
        });
      },
      
      // Reset Community chat to clean state (both local and Firestore)
      resetCommunityChat: async () => {
        // Check if developer
        const isDeveloper = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || 
           localStorage.getItem('dev-mode') === 'true');

        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: isDeveloper 
            ? '👨‍💻 **Developer Mode: Community Chat Active**\n\nYou have developer access to Community Chat for testing. Regular users will see the "Coming Soon" message.\n\nThis chat is shared across all users for real-time collaboration testing.'
            : '🚧 **Community Chat Coming Soon!**\n\nWe\'re building an amazing community space! While we finish up, here\'s what you can do:\n\n✅ **Use General Chat** - Get AI help with all your courses\n✅ **Upload Your Syllabus** - Unlock course-specific AI tutoring\n✅ **Report Issues** - Found a bug? Click your profile icon → "Report Issue"\n\nStay tuned for updates! 🎓',
          timestamp: Date.now()
        };
        
        // Update local state
        set((state) => ({
          chats: {
            ...state.chats,
            'public-general-chat': {
              id: 'public-general-chat',
              title: 'Community',
              messages: [welcomeMessage],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chatType: 'public',
              disabled: !isDeveloper,
              members: []
            }
          }
        }));
        
        // Clear from Firestore - DELETE then recreate to ensure clean state
        try {
          const db = getFirestore();
          const chatDocRef = doc(db, 'chats', 'public-general-chat');
          
          // First, delete the document completely
          try {
            await deleteDoc(chatDocRef);
            console.log('🗑️ Deleted old Community Chat document');
          } catch (e) {
            console.log('No existing Community Chat document to delete');
          }
          
          // Wait a moment for deletion to propagate
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Then create fresh document
          await setDoc(chatDocRef, {
            title: 'Community',
            messages: [welcomeMessage],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            chatType: 'public',
            disabled: !isDeveloper
          });
          console.log('✅ Community chat reset in Firestore with clean state');
        } catch (error) {
          console.warn('Failed to reset Community chat in Firestore:', error);
        }
        
        console.log('✅ Community chat reset to clean state');
      },

      // Reset General chat to clean state (both local and Firestore)
      resetGeneralChat: async () => {
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: `Welcome to your personal AI tutor! I'm here to help you with any questions about your courses. Upload a syllabus to get started, or ask me anything!`,
          timestamp: Date.now()
        };
        
        // Update local state
        set((state) => ({
          chats: {
            ...state.chats,
            'private-general-chat': {
              id: 'private-general-chat',
              title: 'General',
              messages: [welcomeMessage],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chatType: 'private',
              members: []
            }
          }
        }));
        
        // Clear from Firestore
        try {
          const db = getFirestore();
          const chatDocRef = doc(db, 'chats', 'private-general-chat');
          await setDoc(chatDocRef, {
            title: 'General',
            messages: [welcomeMessage],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            chatType: 'private'
          });
          console.log('✅ General chat reset in Firestore');
        } catch (error) {
          console.warn('Failed to reset General chat in Firestore:', error);
        }
        
        console.log('✅ General chat reset to clean state');
      },

      // Initialize default chats with clean state (clears old messages from Firestore)
      initializeDefaultChats: async () => {
        // Check if developer
        const isDeveloper = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || 
           localStorage.getItem('dev-mode') === 'true');

        const resetTime = Date.now();
        
        const communityWelcome = {
          id: `welcome-${resetTime}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: isDeveloper 
            ? '👨‍💻 **Developer Mode: Community Chat Active**\n\nYou have developer access to Community Chat for testing. Regular users will see the "Coming Soon" message.\n\nThis chat is shared across all users for real-time collaboration testing.'
            : '🚧 **Community Chat Coming Soon!**\n\nWe\'re building an amazing community space! While we finish up, here\'s what you can do:\n\n✅ **Use General Chat** - Get AI help with all your courses\n✅ **Upload Your Syllabus** - Unlock course-specific AI tutoring\n✅ **Report Issues** - Found a bug? Click your profile icon → "Report Issue"\n\nStay tuned for updates! 🎓',
          timestamp: resetTime
        };

        const guestWelcome = {
          id: `welcome-${resetTime + 1}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: `Welcome to your personal AI tutor! I'm here to help you with any questions about your courses. Upload a syllabus to get started, or ask me anything!`,
          timestamp: resetTime
        };

        try {
          const db = getFirestore();
          
          // Reset Community Chat in Firestore
          const communityDocRef = doc(db, 'chats', 'public-general-chat');
          
          // First, delete the document to clear all old data
          try {
            await deleteDoc(communityDocRef);
            console.log('🗑️ Deleted old Community Chat document');
          } catch (e) {
            console.log('No existing Community Chat document to delete');
          }
          
          // Then create fresh document
          await setDoc(communityDocRef, {
            title: 'Community',
            messages: [communityWelcome],
            createdAt: resetTime,
            updatedAt: resetTime,
            chatType: 'public',
            disabled: !isDeveloper
          });
          
          // Update join time for Community Chat to NOW (so old messages won't show)
          localStorage.setItem('chat-join-time-public-general-chat', resetTime.toString());
          console.log(`✅ Set join time for Community Chat to ${resetTime}`);
          
          // Reset Guest General Chat in Firestore
          const guestGeneralDocRef = doc(db, 'chats', 'private-general-chat-guest');
          await setDoc(guestGeneralDocRef, {
            title: 'General',
            messages: [guestWelcome],
            createdAt: resetTime,
            updatedAt: resetTime,
            chatType: 'private'
          });
          
          // Update join time for Guest General Chat to NOW
          localStorage.setItem('chat-join-time-private-general-chat-guest', resetTime.toString());
          console.log(`✅ Set join time for Guest General Chat to ${resetTime}`);
          
          console.log('✅ Default chats initialized in Firestore with clean state');
        } catch (error) {
          console.warn('Failed to initialize default chats in Firestore:', error);
        }
      },
      
      // Complete reset of all chats (both local and Firestore)
      resetAllChats: async () => {
        const { isGuest } = get();
        
        if (isGuest) {
          // For guest users, clear all local storage
          get().clearGuestData();
          console.log('✅ All guest chats reset');
        } else {
          // For logged-in users, reset each chat in Firestore
          const chats = get().chats;
          const resetPromises = Object.keys(chats).map(async (chatId) => {
            try {
              await get().resetChat(chatId);
            } catch (error) {
              console.warn(`Failed to reset chat ${chatId}:`, error);
            }
          });
          
          await Promise.all(resetPromises);
          console.log('✅ All chats reset in Firestore');
        }
      },
      
      resetChat: async (chatId) => {
        const { isGuest } = get();
        const chat = get().chats[chatId];
        if (!chat) return;

        // Clear all messages and add new welcome message based on chat type
        let newWelcomeMessage;
        
        if (chatId === 'public-general-chat') {
          newWelcomeMessage = {
            id: `welcome-${Date.now()}`,
            sender: 'bot' as const,
            name: 'CourseConnect AI',
            text: `Welcome to Community Chat! 🚧 Student collaboration features are coming soon. For now, type @ai to get personalized AI tutoring help!`,
            timestamp: Date.now()
          };
        } else if (chat.chatType === 'class' && chat.courseData) {
          // Course-specific chat reset
          const courseName = chat.courseData.courseName || 'this course';
          const professor = chat.courseData.professor || 'your professor';
          newWelcomeMessage = {
            id: `welcome-${Date.now()}`,
            sender: 'bot' as const,
            name: 'CourseConnect AI',
            text: `Welcome back to your ${courseName} course chat! I'm your AI tutor with full context about your syllabus. I can help you with:\n\n• Course topics and concepts\n• Assignment deadlines and requirements\n• Exam preparation\n• Study strategies\n• Any questions about the course material\n\nWhat would you like to know about ${courseName}?`,
            timestamp: Date.now()
          };
        } else {
          // General private chat reset
          // Count how many class chats exist to personalize the message
          const classChats = Object.values(get().chats).filter(c => c.chatType === 'class');
          const syllabusText = classChats.length > 0 
            ? ` I have access to all ${classChats.length} of your course ${classChats.length === 1 ? 'syllabus' : 'syllabi'}, so I can help with any of your classes!`
            : '';
          
          newWelcomeMessage = {
            id: `welcome-${Date.now()}`,
            sender: 'bot' as const,
            name: 'CourseConnect AI',
            text: `Welcome to General Chat! 👋 I'm your all-in-one AI assistant for ALL your courses.${syllabusText}\n\nI can help with:\n• Any question from any of your classes\n• Homework, assignments, and exam prep\n• Study strategies and explanations\n• Connecting concepts across your courses\n\nJust ask me anything about any of your classes! 🚀`,
            timestamp: Date.now()
          };
        }
        
        const resetMessages = [newWelcomeMessage];

        // Update local state immediately
        const newState = {
          chats: {
            ...get().chats,
            [chatId]: {
              ...get().chats[chatId],
              messages: resetMessages,
              updatedAt: Date.now() // Update timestamp to ensure persistence
            }
          }
        };
        
        set(newState);
        
        // Force persist to save immediately
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const persistedState = {
              chats: newState.chats,
              currentTab: get().currentTab,
              isGuest: get().isGuest,
              isDemoMode: get().isDemoMode,
              trialActivated: get().trialActivated,
              trialStartDate: get().trialStartDate,
              trialDaysLeft: get().trialDaysLeft
            };
            window.localStorage.setItem('chat-storage', JSON.stringify({ state: persistedState, version: 0 }));
            console.log(`✅ Forced persist to localStorage after reset for chat: ${chatId}`);
          } catch (e) {
            console.error('Failed to force persist:', e);
          }
        }

        // Update Firestore - CRITICAL for persistence across reloads
        // Always reset public/private general chats in Firestore, even for guests
        const shouldUpdateFirestore = !isGuest || chatId === 'public-general-chat' || chatId === 'private-general-chat';
        
        if (shouldUpdateFirestore) {
          // First, unsubscribe from Firestore listener to prevent it from overriding our reset
          const anyState = get() as any;
          if (anyState._chatSubscriptions && anyState._chatSubscriptions[chatId]) {
            console.log(`📌 Temporarily unsubscribing from ${chatId} during reset`);
            anyState._chatSubscriptions[chatId]();
            delete anyState._chatSubscriptions[chatId];
          }
          
          const chatDocRef = doc(db as Firestore, 'chats', chatId);
          try {
            // Completely replace the chat document with only the welcome message
            await setDoc(chatDocRef, {
              title: chat.title,
              messages: resetMessages,
              createdAt: chat.createdAt || Date.now(),
              updatedAt: Date.now(),
              chatType: chat.chatType,
              courseData: chat.courseData,
              members: chat.members || []
            }, { merge: false }); // merge: false ensures complete replacement
            
            console.log(`✅ Chat ${chatId} reset successfully in Firestore with only welcome message`);
            
            // Update join time to NOW so only future messages appear
            const joinTimeKey = `chat-join-time-${chatId}`;
            const resetTime = Date.now();
            localStorage.setItem(joinTimeKey, resetTime.toString());
            console.log(`✅ Updated join time for ${chatId} to ${resetTime}`);
            
            // Wait a moment, then re-subscribe to Firestore
            setTimeout(async () => {
              console.log(`📌 Re-subscribing to ${chatId} after reset`);
              await get().subscribeToChat(chatId);
            }, 500);
            
          } catch (error) {
            console.warn("Failed to reset chat in firestore:", error);
            // Even if Firestore fails, local state is already updated
          }
        } else {
          console.log(`✅ Chat ${chatId} reset successfully in local storage`);
          // For guest users, also update join time
          const joinTimeKey = `chat-join-time-${chatId}`;
          const resetTime = Date.now();
          localStorage.setItem(joinTimeKey, resetTime.toString());
          console.log(`✅ Updated join time for ${chatId} to ${resetTime}`);
        }
      },

      exportChat: (chatId) => {
        const chat = get().chats[chatId];
        if (!chat) return;

        const exportData = {
          chatName: chat.title,
          exportDate: new Date().toISOString(),
          messageCount: chat.messages.length,
          messages: chat.messages.map(msg => ({
            sender: msg.sender,
            name: msg.name,
            text: msg.text,
            timestamp: new Date(msg.timestamp).toLocaleString()
          }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}_chat_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      deleteChat: async (chatId) => {
        const { isGuest, currentTab } = get();
        
        // Prevent deletion of general chat
        if (chatId === 'general-chat') {
          console.log('Cannot delete general chat');
          return;
        }
        
        // Update local state
        set((state) => {
          const newChats = { ...state.chats };
          delete newChats[chatId];
          
          // If we're deleting the current tab, switch to another chat or undefined
          let newCurrentTab = currentTab;
          if (currentTab === chatId) {
            const remainingChats = Object.keys(newChats);
            newCurrentTab = remainingChats.length > 0 ? remainingChats[0] : undefined;
          }
          
          return {
            chats: newChats,
            currentTab: newCurrentTab
          };
        });

        // Update Firestore if user is logged in
        if (!isGuest) {
          try {
            // Check if auth is properly initialized before accessing currentUser
            if (!auth || typeof auth !== 'object' || typeof auth.currentUser === 'undefined') {
              console.warn("Auth object not properly initialized, skipping Firestore operations");
              return;
            }
            
            // Remove chat from user's chat list
            const user = (auth as Auth)?.currentUser;
            if (user) {
              const userDocRef = doc(db as Firestore, 'users', user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const chatIds = userData.chats || [];
                const updatedChatIds = chatIds.filter((id: string) => id !== chatId);
                await updateDoc(userDocRef, { chats: updatedChatIds });
              }
            }
          } catch (error) {
            console.warn("Failed to delete chat from firestore:", error);
          }
        }
      },
      
      initializeGeneralChats: () => {
        const { chats } = get();
        
        // Create Private General Chat
        if (!chats['private-general-chat']) {
          const privateGeneralMessage = {
            sender: 'bot' as const,
            name: 'CourseConnect AI',
            text: `Welcome to General Chat! 👋 I'm your personal AI assistant, ready to help with any academic questions. I can help with study support, homework, academic guidance, and any subject. Simply type your question below and I'll provide detailed responses. Ready to learn? Ask me anything! 🚀`,
            timestamp: Date.now()
          };
          
          set((state) => ({
            chats: {
              ...state.chats,
              'private-general-chat': {
                id: 'private-general-chat',
                title: 'General Chat',
                messages: [privateGeneralMessage],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                chatType: 'private'
              }
            },
            currentTab: state.currentTab || 'private-general-chat'
          }));
        }

        // Create Public General Chat
        if (!chats['public-general-chat']) {
          const publicGeneralMessage = {
            sender: 'bot' as const,
            name: 'CourseConnect AI',
            text: `Welcome to Community Chat! 🚧 Student collaboration features are coming soon. For now, type @ai to get personalized AI tutoring help!`,
            timestamp: Date.now()
          };
          
          set((state) => ({
            chats: {
              ...state.chats,
              'public-general-chat': {
                id: 'public-general-chat',
                title: 'Community',
                messages: [publicGeneralMessage],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                chatType: 'public',
                members: []
              }
            }
          }));
        }
      },

      // Real-time messaging methods (Pusher handles this directly)
      
      sendRealtimeMessage: (chatId, message) => {
        // Real-time messaging is now handled by Pusher in the chat component
        console.log('Real-time message handled by Pusher:', { chatId, messageId: message.id });
      },
      
      startTyping: (chatId) => {
        // Typing indicators are now handled by Pusher in the chat component
        console.log('Typing start handled by Pusher:', { chatId });
      },
      
      stopTyping: (chatId) => {
        // Typing indicators are now handled by Pusher in the chat component
        console.log('Typing stop handled by Pusher:', { chatId });
      },
      
      receiveRealtimeMessage: (chatId, message) => {
        // Skip messages from the current user to avoid duplicates
        const { isGuest } = get();
        const currentUserId = isGuest ? 'guest' : (auth as Auth)?.currentUser?.uid;
        
        if (message.userId === currentUserId) {
          return; // Skip silently for performance
        }
        
        // Generate unique ID for incoming message if it doesn't have one
        const generateMessageId = () => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          return `${timestamp}-${random}`;
        };
        
        // Ensure message text is always a string and has a unique ID
        const safeMessage = {
          ...message,
          id: message.id || generateMessageId(),
          text: typeof message.text === 'string' ? message.text : JSON.stringify(message.text)
        };
        
        // Add message to local state (optimized for speed)
        set((state) => {
          // Ensure chat exists
          if (!state.chats[chatId]) {
            state.chats[chatId] = {
              id: chatId,
              title: chatId === 'public-general-chat' ? 'Community' : chatId,
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chatType: chatId === 'public-general-chat' ? 'public' : 'private'
            } as Chat;
          }
          
          // Quick duplicate check by ID only (faster than content check)
          const existingById = state.chats[chatId].messages.find(m => m.id === safeMessage.id);
          if (existingById) {
            return state; // Skip duplicate silently
          }
          
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...state.chats[chatId],
                messages: [...state.chats[chatId].messages, safeMessage],
              },
            },
          };
        });
      },
    }),
    {
      name: 'chat-storage', // This will now store guest chats
      storage: createJSONStorage(() => {
        // Check if localStorage is available (client-side)
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage;
        }
        // Fallback for server-side rendering
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist specific fields, not the entire state (exclude Socket.IO objects)
      partialize: (state) => ({
        chats: state.chats,
        currentTab: state.currentTab,
        isGuest: state.isGuest,
        isDemoMode: state.isDemoMode,
        trialActivated: state.trialActivated,
        trialStartDate: state.trialStartDate,
        trialDaysLeft: state.trialDaysLeft
        // Real-time messaging state handled by Pusher
      })
    }
  )
);

// Initialize the auth listener when the app loads (with error handling)
try {
  if (typeof window !== 'undefined') {
    useChatStore.getState().initializeAuthListener();
  }
} catch (error) {
  console.warn("Failed to initialize auth listener:", error);
}

