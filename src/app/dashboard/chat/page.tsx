"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isMathOrPhysicsContent } from '@/utils/math-detection';
import { AIResponse } from '@/components/ai-response';
import {
  Chatting01Icon,
  UserGroupIcon,
  MoreVerticalIcon,
  Download01Icon,
  RotateLeft01Icon,
  Upload01Icon,
  BookOpen01Icon,
  Delete01Icon,
  Brain01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Globe02Icon,
  Book01Icon,
  SparklesIcon
} from "hugeicons-react";
import { useChatStore } from "@/hooks/use-chat-store";
import { useTextExtraction } from "@/hooks/use-text-extraction";
import { useSmartDocumentAnalysis } from "@/hooks/use-smart-document-analysis";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { FeatureDisabled } from "@/components/feature-disabled";
import { useSentimentAnalysis } from "@/hooks/use-sentiment-analysis";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase/client-simple";
import { doc, getDoc } from "firebase/firestore";
// Pusher removed - real-time features coming soon
// import { usePusherChat } from "@/hooks/use-pusher-chat";
import { TypingIndicator } from "@/components/typing-indicator";
import { OnlineUsersIndicator } from "@/components/online-users-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileInput } from "@/components/ui/mobile-input";
import { ExpandableUserMessage } from "@/components/expandable-user-message";
import { EnhancedChatInput } from "@/components/enhanced-chat-input";
import { MessageTimestamp } from "@/components/message-timestamp";
import BotResponse from "@/components/bot-response";
import { CourseConnectLogo } from "@/components/icons/courseconnect-logo";
import { RippleText } from "@/components/ripple-text";
import { InDepthAnalysis } from "@/components/in-depth-analysis";
import { JoinMessage } from "@/components/join-message";
import { createWelcomeNotification, createAIResponseNotification, createStudyEncouragementNotification, createAssignmentReminderNotification, isFirstGuestVisit, markGuestAsVisited } from "@/lib/guest-notifications";
import { useNotifications } from "@/hooks/use-notifications";
import { WelcomeCard } from "@/components/welcome-card";
import { ThinkingProcess } from '@/components/ui/thinking-process';

// Lightweight debug flag to silence heavy client logs in production
const DEBUG = false;

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

function getSmartThinkingSteps(message: string): string[] {
  const msg = (message || "").toLowerCase();
  const steps = ["Analyzing request context..."];
  
  // Check for syllabus-related questions
  const syllabusKeywords = ["syllabus", "assignment", "due", "deadline", "exam", "test", "quiz", "professor", "class time", "meeting", "office hours", "grade", "grading", "policy", "course", "when is", "what is due", "prioritize", "priority"];
  const isSyllabusQuestion = syllabusKeywords.some(keyword => msg.includes(keyword));
  
  if (isSyllabusQuestion) {
    steps.push("Checking your syllabus...", "Analyzing assignments and deadlines...", "Formulating response...");
  } else if (msg.includes("quiz") || msg.includes("test") || msg.includes("exam")) {
    steps.push("Checking question bank...", "Formulating practice questions...", "Verifying answers...");
  } else if (msg.includes("summar") || msg.includes("explain")) {
    steps.push("Scanning course content...", "Extracting key points...", "Synthesizing summary...");
  } else if (msg.includes("code") || msg.includes("function") || msg.includes("react") || msg.includes("java") || msg.includes("python") || msg.includes("html") || msg.includes("css") || msg.includes("javascript")) {
    steps.push("Analyzing code structure...", "Checking syntax patterns...", "Generating code examples...");
  } else if (msg.includes("math") || msg.includes("calculus") || msg.includes("algebra") || msg.includes("equation")) {
    steps.push("Parsing mathematical expression...", "Applying solving algorithms...", "Verifying step-by-step solution...");
  } else if (msg.includes("essay") || msg.includes("write") || msg.includes("paper")) {
    steps.push("Structuring argument flow...", "Gathering supporting evidence...", "Drafting outlines...");
  } else if (msg.includes("schedule") || msg.includes("plan") || msg.includes("time")) {
     steps.push("Checking calendar events...", "Optimizing study blocks...", "Generating timeline...");
  } else {
    steps.push("Retrieving relevant knowledge...", "Formulating response...", "Formatting output...");
  }
  
  return steps;
}

// Helper function to detect if question is syllabus-related for custom thinking text
function isSyllabusQuestion(message: string): boolean {
  const msg = (message || "").toLowerCase();
  const syllabusKeywords = ["syllabus", "assignment", "due", "deadline", "exam", "test", "quiz", "professor", "class time", "meeting", "office hours", "grade", "grading", "policy", "course", "when is", "what is due", "prioritize", "priority"];
  return syllabusKeywords.some(keyword => msg.includes(keyword));
}

export default function ChatPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");

    // Handle "content" query parameter from OCR page
    useEffect(() => {
        const contentParam = searchParams?.get('content');
        if (contentParam && !inputValue) {
            setInputValue(decodeURIComponent(contentParam));
            // Remove the content param from URL after consuming it
            const newParams = new URLSearchParams(searchParams?.toString());
            newParams.delete('content');
            const newUrl = `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [searchParams, inputValue]);
    const { 
        chats, 
        addMessage, 
        setCurrentTab, 
        currentTab, 
        addChat, 
        addUserJoinMessage,
        isStoreLoading, 
        initializeAuthListener, 
        exportChat, 
        resetChat, 
        deleteChat, 
        initializeGeneralChats,
        sendRealtimeMessage,
        startTyping,
        stopTyping
    } = useChatStore();
    const { isFeatureEnabled } = useFeatureFlags();
    const [user, setUser] = useState<any>(null);
    const { createNotification } = useNotifications(user);
    const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [streamingResponse, setStreamingResponse] = useState("");
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [isStreamingComplete, setIsStreamingComplete] = useState(false);
    // Animated analyzing steps for AI response while processing images/files
    const analyzingSteps = ["Analyzing...", "Extracting...", "Preparing response..."];
    const [analyzingStepIndex, setAnalyzingStepIndex] = useState(0);
    const [isMessagesLoading, setIsMessagesLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [userProfilePicture, setUserProfilePicture] = useState<string>("");
    const [forceLoad, setForceLoad] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef(true);
    const lastScrollTimeRef = useRef(0);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [chatSummary, setChatSummary] = useState<string>('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [copiedSummary, setCopiedSummary] = useState(false);
    // AbortController for stopping AI responses (works for all chat types: General, Class, Public)
    const abortControllerRef = useRef<AbortController | null>(null);
    // New chat creation is disabled here (only via Upload Syllabus)
    const [unreadById, setUnreadById] = useState<Record<string, number>>({});
    const [prevLengths, setPrevLengths] = useState<Record<string, number>>({});

    // Thinking process state
    const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

    useEffect(() => {
        if (isLoading && !streamingResponse) {
             const currentChat = currentTab ? chats[currentTab] : undefined;
             const lastMessage = currentChat?.messages?.at(-1);
             
             // Only generate thinking steps if the last message was from the user (waiting for bot)
             // OR if we just sent a message and are waiting
             const userMessageText = lastMessage?.sender === 'user' ? lastMessage.text : "";
             
             if (userMessageText) {
                 const steps = getSmartThinkingSteps(typeof userMessageText === 'string' ? userMessageText : JSON.stringify(userMessageText));
                 
                 setThinkingSteps([steps[0]]);
                 
                 let i = 1;
                 // Clear any existing interval first
                 const interval = setInterval(() => {
                    if (i < steps.length) {
                        const nextStep = steps[i];
                        setThinkingSteps(prev => {
                            if (prev.includes(nextStep)) return prev;
                            return [...prev, nextStep];
                        });
                        i++;
                    } else {
                        clearInterval(interval);
                    }
                 }, 2000);
                 
                 return () => clearInterval(interval);
             }
        } else {
            // Don't clear steps immediately on loading false so they can be saved to the message
            if (!streamingResponse) {
                 // Only clear if we are truly resetting, not transitioning to streaming/complete
            }
        }
    }, [isLoading, streamingResponse, currentTab, chats]); // Re-run when loading state changes


    // Helper function to get clean chat display name
    const getChatDisplayName = (chatId: string) => {
        const chat = chats[chatId];
        
        // If it's the public general chat, show "Community"
        if (chatId === 'public-general-chat') {
            return 'Community';
        }
        
        // If it's private general chat, show "General Chat"
        if (chatId === 'private-general-chat' || chatId === 'private-general-chat-guest') {
            return 'General Chat';
        }
        
        // If it's a class chat with course data, use course name
        if (chat?.courseData?.courseName) {
            return chat.courseData.courseName;
        }
        
        // If chat has a proper title and it's not the ugly ID, use it
        if (chat?.title && !chat.title.includes('private-general-chat-')) {
            return chat.title;
        }
        
        // Fallback to cleaned chat ID
        const cleaned = chatId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log('Chat display name fallback:', { chatId, cleaned, chat });
        return cleaned;
    };

    // Auto-create welcome notification for guests on first visit
    useEffect(() => {
        try {
            if (isGuest && isFirstGuestVisit()) {
                createWelcomeNotification();
                markGuestAsVisited();
            }
        } catch (error) {
            console.warn('Error creating welcome notification:', error);
        }
    }, [isGuest]);

    // Track if user is away from chat to create AI response notifications
    const [isUserAway, setIsUserAway] = useState(false);
    const [lastAIMessageTime, setLastAIMessageTime] = useState<number>(0);
    
    // Sentiment analysis for empathetic UI (Agent Mode)
    const sentimentAnalysis = useSentimentAnalysis(inputValue);
    
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            setIsUserAway(document.hidden);
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Monitor AI responses and create notifications when user is away
    // DISABLED: User requested to stop getting notifications for AI responses
    // useEffect(() => {
    //     const currentChat = chats[currentTab || 'private-general-chat'];
    //     if (!currentChat?.messages) return;
    //     
    //     const aiMessages = currentChat.messages.filter(msg => msg.sender === 'bot');
    //     if (aiMessages.length > 0) {
    //         const latestAIMessage = aiMessages[aiMessages.length - 1];
    //         const messageTime = latestAIMessage.timestamp || Date.now();
    //         
    //         // If AI responded and user was away, create notification
    //         if (messageTime > lastAIMessageTime && isUserAway) {
    //             if (isGuest) {
    //               createAIResponseNotification();
    //             } else {
    //               // Logged-in: create Firestore notification
    //               createNotification({
    //                 title: 'New message from AI',
    //                 description: 'Your AI assistant has replied while you were away.',
    //                 type: 'message',
    //                 priority: 'low',
    //               } as any);
    //             }
    //             setLastAIMessageTime(messageTime);
    //         }
    //     }
    // }, [chats, currentTab, isGuest, isUserAway, lastAIMessageTime, createNotification]);

    // Create study encouragement notifications based on class chats
    useEffect(() => {
        const classChats = Object.values(chats).filter(chat => chat.chatType === 'class');
        if (classChats.length === 0) return;

        const classNames = classChats.map(chat => chat.courseData?.courseName || 'Unknown Course').filter(Boolean);
        
        // Create study encouragement notification for guests
        if (isGuest) {
            // Check if enough time has passed since last study reminder (5 minutes)
            const lastStudyReminder = localStorage.getItem('last-study-reminder');
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (!lastStudyReminder || (now - parseInt(lastStudyReminder)) > fiveMinutes) {
                // 40% chance to create study reminder
                const shouldCreateReminder = Math.random() < 0.4;
                if (shouldCreateReminder) {
                    createStudyEncouragementNotification(classNames);
                    localStorage.setItem('last-study-reminder', now.toString());
                }
            }
        }
        
        // For logged-in users, we could add similar logic here
        // but we'd need to use the useNotifications hook
    }, [chats, isGuest]);

    // Track scroll position to determine if we should auto-scroll
    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (!viewport) return;

        const handleScroll = () => {
            const distanceFromBottom = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
            // User is at bottom if within 150px
            autoScrollRef.current = distanceFromBottom <= 150;
        };

        viewport.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial position
        
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
        };
    }, [currentTab]);

    // Enable auto-scroll when streaming starts
    useEffect(() => {
        if (streamingMessageId && !streamingResponse) {
            // Just started streaming, enable auto-scroll
            autoScrollRef.current = true;
        }
    }, [streamingMessageId, streamingResponse]);

    // Auto-scroll during streaming - only if user is at bottom
    useEffect(() => {
        if (!streamingResponse) return;
        
        // Only scroll if user is at bottom
        if (!autoScrollRef.current) return;
        
        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTimeRef.current;
        
        // Throttle: only scroll if at least 150ms have passed since last scroll
        if (timeSinceLastScroll < 150) return;
        
        lastScrollTimeRef.current = now;
        
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            // Double-check user hasn't scrolled up
            if (!autoScrollRef.current) return;
            
            const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
            if (viewport) {
                // Check if we're already at bottom (within 10px) to avoid unnecessary scrolls
                const distanceFromBottom = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
                if (distanceFromBottom > 10) {
                    viewport.scrollTo({
                        top: viewport.scrollHeight,
                        behavior: 'auto'
                    });
                }
            } else if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
            }
        });
    }, [streamingResponse]);

    // Clear streaming display when message appears in store to prevent overlap
    useEffect(() => {
        if (!streamingMessageId || !streamingResponse) return;
        
        const currentChat = chats[currentTab || 'private-general-chat'];
        const messageExists = currentChat?.messages?.some(
            msg => msg.id === streamingMessageId && msg.sender === 'bot'
        );
        
        if (messageExists) {
            // Message is now in store, clear streaming state immediately
            setStreamingResponse("");
            setStreamingMessageId(null);
            setIsStreamingComplete(false);
        }
    }, [chats, currentTab, streamingMessageId, streamingResponse]);

    // Pusher integration disabled - real-time features coming soon
    const pusherConnected = false;
    const pusherActiveUsers: any[] = [];
    const pusherTypingUsers: any[] = [];
    const pusherIsAiThinking = false;
    const pusherAvailableChats: any[] = [];
    const pusherSendMessage = () => {};
    const pusherStartTyping = () => {};
    const pusherStopTyping = () => {};
    const joinChat = () => {};
    const leaveChat = () => {};

    // Debug user state changes
    // Force sidebar re-render ONLY when chat count changes (not on every message)
    const chatCount = Object.keys(chats).length;
    const prevChatCountRef = useRef(chatCount);
    
    useEffect(() => {
        if (chatCount !== prevChatCountRef.current) {
            prevChatCountRef.current = chatCount;
            setForceLoad(prev => !prev);
        }
    }, [chatCount]);

    // Loading state for messages
    useEffect(() => {
        // Show skeleton loading when chat changes
        setIsMessagesLoading(true);
        const timer = setTimeout(() => {
            setIsMessagesLoading(false);
        }, 500); // Short delay for smooth loading
        return () => clearTimeout(timer);
    }, [currentTab]);

    useEffect(() => {
        console.log('User state changed:', { 
            user: user ? { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL } : null,
            userName: user?.displayName || user?.email || 'Guest User',
            userPhotoURL: user?.photoURL
        });
    }, [user]);

    // Debug Pusher state - disabled (real-time features coming soon)
    // useEffect(() => {
    //     console.log('Pusher state changed:', {
    //         isConnected: pusherConnected,
    //         activeUsers: pusherActiveUsers.length,
    //         typingUsers: pusherTypingUsers.length,
    //         isAiThinking: pusherIsAiThinking,
    //         currentTab
    //     });
    // }, [pusherConnected, pusherActiveUsers, pusherTypingUsers, pusherIsAiThinking, currentTab]);

    // Track if we're in a reset operation
    const isResettingRef = useRef(false);
    
    // Immediate fallback to set currentTab if undefined (only on initial load, not during reset)
    useEffect(() => {
        if (!currentTab && !isStoreLoading && Object.keys(chats).length > 0 && !isResettingRef.current) {
            console.log('Immediate fallback: Setting currentTab to public-general-chat');
            setCurrentTab('public-general-chat');
        }
    }, [currentTab, isStoreLoading, setCurrentTab, chats]);

    const copyToClipboard = async (text: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Auto-scroll to bottom function
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Auto-scroll when page loads or messages change (but not when switching tabs)
    useEffect(() => {
        // Only auto-scroll when chats change, not when currentTab changes
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [chats]);

    // Auto-scroll when new messages are added
    useEffect(() => {
        if (currentTab && chats[currentTab]) {
            scrollToBottom();
        }
    }, [chats]);

    // Auto-scroll when switching to a different tab
    useEffect(() => {
        if (currentTab && chats[currentTab]) {
            // Small delay to ensure the new tab content is rendered
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [currentTab]);

    // Pusher state is managed directly by the usePusherChat hook

    // Initialize general chats when component mounts
    useEffect(() => {
        try {
            const idle = (cb: () => void) => {
                if (typeof (window as any).requestIdleCallback === 'function') {
                    (window as any).requestIdleCallback(cb, { timeout: 1200 });
                } else {
                    setTimeout(cb, 0);
                }
            };
            idle(() => {
                try {
                    initializeGeneralChats();
                } catch (error) {
                    console.warn('Failed to initialize general chats (non-critical):', error);
                    // Don't crash - app can work without this
                }
            });
        } catch (error) {
            console.warn('Error setting up general chats initialization:', error);
        }
    }, [initializeGeneralChats]);

    // Handle URL parameters for specific chat tabs (only on initial load)
    const urlProcessedRef = useRef(false);
    useEffect(() => {
        // Only process URL parameters once on initial load
        if (urlProcessedRef.current) return;
        
        const tabParam = searchParams.get('tab');
        const chatIdParam = searchParams.get('chatId');
        let targetChatId = chatIdParam || tabParam;
        
        // Map friendly alias to internal general chat id
        if (targetChatId === 'general') {
            const generalIds = ['private-general-chat', 'public-general-chat', 'private-general-chat-guest'];
            targetChatId = generalIds.find(id => !!chats[id]) || 'private-general-chat-guest';
        }
        
        if (targetChatId && !isStoreLoading) {
            urlProcessedRef.current = true;
            if (DEBUG) console.log('URL parameter found (initial load):', { tabParam, chatIdParam, targetChatId });
            if (chats[targetChatId]) {
                if (DEBUG) console.log('Chat exists, switching to:', targetChatId);
                setCurrentTab(targetChatId);
                try { localStorage.setItem('cc-active-tab', targetChatId); } catch {}
            } else {
                if (DEBUG) console.log('Chat not found, waiting for it to be created:', targetChatId);
                const start = Date.now();
                const interval = setInterval(() => {
                    if (chats[targetChatId] || Date.now() - start > 5000) {
                        if (chats[targetChatId]) {
                            if (DEBUG) console.log('Chat created, switching to:', targetChatId);
                            setCurrentTab(targetChatId);
                            try { localStorage.setItem('cc-active-tab', targetChatId); } catch {}
                        } else {
                            if (DEBUG) console.log('Chat creation timeout, staying on current tab');
                        }
                        clearInterval(interval);
                    }
                }, 150);
                return () => clearInterval(interval);
            }
        } else if (!targetChatId && !isStoreLoading) {
            // No URL parameter, mark as processed
            urlProcessedRef.current = true;
        }
        
        // Handle prefill parameter on initial load
        const prefillParam = searchParams.get('prefill');
        if (prefillParam && currentTab) {
            setTimeout(() => {
                setInputValue(decodeURIComponent(prefillParam));
                // Focus the input so user can edit or send
                const inputElement = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]') as HTMLInputElement | HTMLTextAreaElement;
                if (inputElement) {
                    setTimeout(() => {
                        inputElement.focus();
                        // Move cursor to end
                        if (inputElement.setSelectionRange) {
                            const length = inputElement.value.length;
                            inputElement.setSelectionRange(length, length);
                        }
                    }, 100);
                }
            }, 300);
        }
    }, [searchParams, chats, setCurrentTab, isStoreLoading, setInputValue]);

    // Respond to subsequent URL param changes to switch chats seamlessly
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        const chatIdParam = searchParams.get('chatId');
        const prefillParam = searchParams.get('prefill');
        let targetChatId = chatIdParam || tabParam;
        if (targetChatId === 'general') {
            const generalIds = ['private-general-chat', 'public-general-chat', 'private-general-chat-guest'];
            targetChatId = generalIds.find(id => !!chats[id]) || 'private-general-chat-guest';
        }
        if (!targetChatId) return;
        if (currentTab === targetChatId) {
            // If already on the correct tab, just set prefill if present
            if (prefillParam) {
                setInputValue(decodeURIComponent(prefillParam));
                // Focus the input so user can edit or send
                setTimeout(() => {
                    const inputElement = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]') as HTMLInputElement | HTMLTextAreaElement;
                    if (inputElement) {
                        inputElement.focus();
                        // Move cursor to end
                        if (inputElement.setSelectionRange) {
                            const length = inputElement.value.length;
                            inputElement.setSelectionRange(length, length);
                        }
                    }
                }, 100);
            }
            return;
        }
        if (chats[targetChatId] || !isStoreLoading) {
            setCurrentTab(targetChatId);
            try { localStorage.setItem('cc-active-tab', targetChatId); } catch {}
            // Set prefill after tab switch
            if (prefillParam) {
                setTimeout(() => {
                    setInputValue(decodeURIComponent(prefillParam));
                    // Focus the input so user can edit or send
                    setTimeout(() => {
                        const inputElement = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]') as HTMLInputElement | HTMLTextAreaElement;
                        if (inputElement) {
                            inputElement.focus();
                            // Move cursor to end
                            if (inputElement.setSelectionRange) {
                                const length = inputElement.value.length;
                                inputElement.setSelectionRange(length, length);
                            }
                        }
                    }, 200);
                }, 100);
            }
        }
    }, [searchParams, currentTab, chats, isStoreLoading, setCurrentTab, setInputValue]);

    // Ensure auth listener is initialized with offline handling
    useEffect(() => {
        try {
            if (DEBUG) console.log('Initializing auth listener...');
            // Check if we're online before initializing auth listener
            const idle = (cb: () => void) => {
                if (typeof (window as any).requestIdleCallback === 'function') {
                    (window as any).requestIdleCallback(cb, { timeout: 1200 });
                } else {
                    setTimeout(cb, 0);
                }
            };
            idle(() => {
                try {
                    if (navigator.onLine) {
                        const unsubscribe = initializeAuthListener();
                        if (DEBUG) console.log('Auth listener initialized, unsubscribe function:', typeof unsubscribe);
                    } else {
                        if (DEBUG) console.log('Offline mode - skipping auth listener initialization');
                    }
                } catch (authError) {
                    console.warn('Auth listener initialization error (non-critical):', authError);
                    // Don't crash - guest mode can work without auth
                }
            });
        } catch (error) {
            console.warn('Failed to initialize auth listener:', error);
            // Force load if auth fails - don't crash the app
            setTimeout(() => {
                if (DEBUG) console.log('Auth failed, forcing load');
                setForceLoad(true);
            }, 1000);
        }
    }, [initializeAuthListener]);

    // Handle online/offline state changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            if (DEBUG) console.log('Back online - reinitializing auth listener');
            try {
                initializeAuthListener();
            } catch (error) {
                console.warn('Failed to reinitialize auth listener:', error);
            }
        };

        const handleOffline = () => {
            if (DEBUG) console.log('Gone offline - continuing in offline mode');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [initializeAuthListener]);

    // Safely handle auth state
    useEffect(() => {
        try {
            // Check for guest user first (before Firebase auth)
            const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
            if (guestData) {
                try {
                    const parsedGuest = JSON.parse(guestData);
                    setUser(parsedGuest);
                    setIsGuest(true);
                    console.log('Guest user detected from localStorage:', parsedGuest.displayName);
                } catch (parseError) {
                    console.warn('Failed to parse guest user data:', parseError);
                }
            }

            if (auth && typeof auth.onAuthStateChanged === 'function') {
                const unsubscribe = auth.onAuthStateChanged(
                    async (user: any) => {
                        try {
                            setUser(user);
                            // Check if user is guest/anonymous - also check localStorage for guest data
                            const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
                            const isGuestUser = user?.isAnonymous || user?.isGuest || (guestData !== null);
                            setIsGuest(isGuestUser);
                            
                            // Load profile picture for authenticated users (Firestore first, then auth.photoURL fallback)
                            if (user && !user.isGuest && !user.isAnonymous) {
                                try {
                                    const userDocRef = doc(db, "users", user.uid);
                                    const userDocSnap = await getDoc(userDocRef);
                                    if (userDocSnap.exists()) {
                                        const userData = userDocSnap.data();
                                        if (userData.profilePicture) {
                                            setUserProfilePicture(userData.profilePicture);
                                        } else if (user.photoURL) {
                                            setUserProfilePicture(user.photoURL);
                                        } else {
                                            setUserProfilePicture("");
                                        }
                                    } else if (user.photoURL) {
                                        setUserProfilePicture(user.photoURL);
                                    } else {
                                        setUserProfilePicture("");
                                    }
                                } catch (error) {
                                    console.warn("Error loading profile picture (non-critical):", error);
                                }
                            } else if (user && (user.isGuest || user.isAnonymous)) {
                            // Load profile picture from localStorage for guest users
                            try {
                                const guestData = localStorage.getItem('guestUser');
                                if (guestData) {
                                    const parsed = JSON.parse(guestData);
                                    if (parsed.profilePicture) {
                                        setUserProfilePicture(parsed.profilePicture);
                                    }
                                }
                            } catch (error) {
                                console.error("Error loading guest profile picture:", error);
                            }
                        } else {
                            setUserProfilePicture("");
                        }
                        } catch (userError) {
                            console.warn("Error in auth state change handler (non-critical):", userError);
                            // Don't crash - continue with guest mode if available
                            const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
                            if (guestData) {
                                try {
                                    const parsedGuest = JSON.parse(guestData);
                                    setUser(parsedGuest);
                                    setIsGuest(true);
                                } catch (e) {
                                    // Ignore parse errors
                                }
                            }
                        }
                    },
                    (error: any) => {
                        console.warn("Auth state error in chat page:", error);
                        setUser(null);
                        // Check localStorage for guest user even on auth error
                        const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
                        setIsGuest(guestData !== null);
                    }
                );
                return unsubscribe;
            } else {
                setUser(null);
                // Check localStorage for guest user even if auth not available
                const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
                setIsGuest(guestData !== null);
            }
        } catch (authError) {
            console.warn("Auth initialization error in chat page:", authError);
            setUser(null);
            // Check localStorage for guest user even on auth error
            const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
            setIsGuest(guestData !== null);
        }
    }, []);

    // Listen for profile picture changes
    useEffect(() => {
        const handleProfilePictureChange = (event: CustomEvent) => {
            const { profilePicture } = event.detail;
            if (profilePicture) {
                setUserProfilePicture(profilePicture);
            }
        };

        window.addEventListener('profilePictureChanged', handleProfilePictureChange as EventListener);
        
        return () => {
            window.removeEventListener('profilePictureChanged', handleProfilePictureChange as EventListener);
        };
    }, []);

    // Get current chat
    const currentChat = currentTab ? chats[currentTab] : null;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollAreaRef.current) {
                const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    // Use requestAnimationFrame to ensure DOM is updated
                    requestAnimationFrame(() => {
                        viewport.scrollTo({ 
                            top: viewport.scrollHeight, 
                            behavior: 'smooth' 
                        });
                    });
                }
            }
        };
        
        // Small delay to ensure message is rendered
        const timeoutId = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeoutId);
    }, [currentChat?.messages, isLoading]);

    // Track unread counts per chat
    useEffect(() => {
        const nextPrev: Record<string, number> = { ...prevLengths };
        const nextUnread: Record<string, number> = { ...unreadById };
        for (const [id, chat] of Object.entries(chats)) {
            const len = chat.messages?.length || 0;
            const prev = nextPrev[id] ?? 0;
            if (len > prev) {
                const delta = len - prev;
                if (id !== (currentTab || 'private-general-chat')) {
                    nextUnread[id] = Math.min(99, (nextUnread[id] ?? 0) + delta);
                }
                nextPrev[id] = len;
            }
        }
        setPrevLengths(nextPrev);
        setUnreadById(nextUnread);
    }, [chats, currentTab]);

    // Clear unread when switching to a tab
    useEffect(() => {
        if (!currentTab) return;
        setUnreadById((m) => ({ ...m, [currentTab]: 0 }));
    }, [currentTab]);


    // Initialize general chat if it doesn't exist and set current tab
    useEffect(() => {
        // Initialize general chats if they don't exist
        initializeGeneralChats();
        
        // Prefer last used tab or public-general-chat
        if (!currentTab) {
            let last = '';
            try { last = localStorage.getItem('cc-active-tab') || ''; } catch {}
            if (last && chats[last]) {
                setCurrentTab(last);
            } else if (chats['public-general-chat']) {
                setCurrentTab('public-general-chat');
            } else {
                // Default to private general chat and ensure it's properly initialized
                setCurrentTab('private-general-chat');
                console.log('Setting default chat to private-general-chat');
            }
        }
    }, [initializeGeneralChats, currentTab, setCurrentTab, chats]);

    // Ensure the current tab has a proper chat object
    useEffect(() => {
        if (currentTab && !chats[currentTab]) {
            console.log('Current tab exists but chat object is missing:', currentTab);
            // Re-initialize general chats to ensure the chat object exists
            initializeGeneralChats();
        }
    }, [currentTab, chats, initializeGeneralChats]);

    // Force load after 2 seconds to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isStoreLoading || !currentTab) {
                console.log('ChatPage - Force loading after timeout, currentTab:', currentTab);
                setForceLoad(true);
                // Also initialize auth listener as fallback
                try {
                    initializeAuthListener();
                } catch (error) {
                    console.warn('Failed to initialize auth listener as fallback:', error);
                }
                
                // Force set currentTab if it's undefined
                if (!currentTab) {
                    console.log('Force setting currentTab to public-general-chat');
                    setCurrentTab('public-general-chat');
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [isStoreLoading, currentTab, initializeAuthListener, setCurrentTab]);

    // Generate unique message ID with better uniqueness
    const generateMessageId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const sessionId = Math.random().toString(36).substr(2, 4);
        return `${timestamp}-${random}-${sessionId}`;
    };

    // Keyboard shortcuts for tab switching and focusing input
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMod = e.ctrlKey || e.metaKey;
            if (!isMod) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const ids = Object.keys(chats);
                if (ids.length === 0) return;
                const current = currentTab || 'private-general-chat';
                const idx = Math.max(0, ids.indexOf(current));
                const next = e.key === 'ArrowRight' ? ids[Math.min(idx + 1, ids.length - 1)] : ids[Math.max(idx - 1, 0)];
                if (next) { setCurrentTab(next); try { localStorage.setItem('cc-active-tab', next); } catch {} }
            }
            if (e.key.toLowerCase() === 'enter') {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
                input?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [chats, currentTab, setCurrentTab]);

    const handleSendMessage = async (shouldCallAI: boolean = true, aiResponseType: 'concise' | 'detailed' | 'conversational' | 'analytical' = 'concise') => {
        if (!inputValue.trim()) return;

        const messageText = inputValue.trim();

        // If this chat was opened with a ?prefill= param (e.g. from the dashboard),
        // clear that query param as soon as the user sends the first message so
        // it doesn't keep re-populating the input on re-render.
        try {
            const prefillParam = searchParams.get('prefill');
            if (prefillParam) {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.delete('prefill');
                router.replace(currentUrl.pathname + currentUrl.search);
            }
        } catch (e) {
            // Fail silently if we can't touch the URL (SSR, etc.)
        }
        const currentChat = chats[currentTab || 'private-general-chat'];
        const isPublicChat = currentChat?.chatType === 'public';
        const isClassChat = currentChat?.chatType === 'class';

        // Check if search mode is enabled (globe icon was clicked)
        let searchModeEnabled = false;
        if (typeof document !== 'undefined') {
            const bodyAttr = document.body.getAttribute('data-search-mode');
            const storageFlag = typeof window !== 'undefined' ? localStorage.getItem('web-search-enabled') : null;
            searchModeEnabled = bodyAttr === 'true' || storageFlag === 'true';
        }

        // Check if AI chat is disabled
        if (!isFeatureEnabled('aiChat') && shouldCallAI) {
            const userMessage = {
                id: generateMessageId(),
                text: messageText,
                sender: 'user' as const,
                name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
                userId: user?.uid || 'guest',
                timestamp: Date.now(),
            };
            
            const botMessage = {
                id: `system-${Date.now()}`,
                text: "⚠️ **AI Chat is Currently Unavailable**\n\nOur AI assistant is temporarily disabled for maintenance. We're working to bring it back online as soon as possible.\n\nPlease check back later. Thank you for your patience! 🛠️",
                sender: 'bot' as const,
                name: 'System',
                timestamp: Date.now(),
            };
            
            addMessage(currentTab || 'private-general-chat', userMessage);
            setTimeout(() => {
                addMessage(currentTab || 'private-general-chat', botMessage);
            }, 300);
            
            setInputValue('');
            return;
        }

        // Check if community chat is disabled
        if (!isFeatureEnabled('communityChat') && isPublicChat) {
            const userMessage = {
                id: generateMessageId(),
                text: messageText,
                sender: 'user' as const,
                name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
                userId: user?.uid || 'guest',
                timestamp: Date.now(),
            };
            
            const botMessage = {
                id: `system-${Date.now()}`,
                text: "⚠️ **Community Chat is Currently Unavailable**\n\nCommunity chat is temporarily disabled for maintenance. We're working to restore it as soon as possible.\n\nPlease try again later. Thank you for your understanding! 🛠️",
                sender: 'bot' as const,
                name: 'System',
                timestamp: Date.now(),
            };
            
            addMessage(currentTab || 'private-general-chat', userMessage);
            setTimeout(() => {
                addMessage(currentTab || 'private-general-chat', botMessage);
            }, 300);
            
            setInputValue('');
            return;
        }

        // Determine if this message mentions AI
        const hasAIMention = messageText.includes('@ai') || messageText.includes('@AI');
        
        // For public chats, only call AI if explicitly mentioned
        // For class chats (syllabus-based), always call AI
        // For private chats, use shouldCallAI setting
        const shouldCallAIFinal = isClassChat ? true : (isPublicChat ? hasAIMention : shouldCallAI);

        console.log('Chat type detection:', {
            chatType: currentChat?.chatType,
            isClassChat,
            isPublicChat,
            hasAIMention,
            shouldCallAIFinal,
            message: messageText.substring(0, 50)
        });

        const userMessage = {
            id: generateMessageId(),
            text: messageText,
            sender: 'user' as const,
            name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
            userId: user?.uid || 'guest',
            timestamp: Date.now()
        };

        // Clear input immediately to prevent spam
        setInputValue("");

        // Stop typing indicator when message is sent
        if (currentTab) {
            pusherStopTyping();
        }

        // Set loading state immediately for instant thinking animation
        if (shouldCallAIFinal) {
            console.log('Setting isLoading to true for message:', messageText);
            setIsLoading(true);
        }

        // Send message via Pusher for real-time broadcasting (this will update other tabs)
        pusherSendMessage();

        // Add user message immediately for instant UI response (non-blocking)
        addMessage(currentTab || 'private-general-chat', userMessage).catch(console.error);

        // Only get AI response if appropriate
        if (shouldCallAIFinal) {
            let timeoutId: NodeJS.Timeout | null = null;
            // Declare variables in outer scope so they're accessible in catch blocks
            let fullResponse = "";
            let sources: any[] = [];
            let metadata: any = null;
            let searchModeEnabledBeforeAPI = false;
            
            try {
                // Get AI response via API call with enhanced error handling
                let aiResponse;
                try {
                    // Use streaming endpoint for all chats (real-time responses)
                    const apiEndpoint = '/api/chat/stream';
                    console.log(`Making streaming API call to ${apiEndpoint}...`, { isClassChat, hasCourseData: !!currentChat?.courseData });
                    
                    // Get userId from logged-in user (notifications only work for authenticated users)
                    const effectiveUserId = user?.uid;
                    
                    // Check search mode before API call
                    if (typeof document !== 'undefined') {
                        const bodyAttr = document.body.getAttribute('data-search-mode');
                        const storageFlag = typeof window !== 'undefined' ? localStorage.getItem('web-search-enabled') : null;
                        searchModeEnabledBeforeAPI = bodyAttr === 'true' || storageFlag === 'true';
                    }
                    const requestBody: any = {
                            question: messageText,
                            context: currentChat?.title || 'General Chat',
                            conversationHistory: currentChat?.messages?.slice(-10).map(msg => ({
                                role: msg.sender === 'user' ? 'user' : 'assistant',
                                content: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)
                            })) || [],
                            shouldCallAI: shouldCallAIFinal,
                        isPublicChat: isPublicChat,
                        userId: effectiveUserId,
                        chatId: currentTab,
                        chatTitle: currentChat?.title,
                        isSearchRequest: searchModeEnabledBeforeAPI,
                        aiResponseType: aiResponseType // Add AI response type (auto, agent, manual)
                    };

                    // Add course data for class chats (stream endpoint will handle it)
                    if (isClassChat && currentChat?.courseData) {
                        requestBody.courseData = currentChat.courseData;
                        requestBody.chatId = currentTab;
                        requestBody.metadata = currentChat.metadata;
                        console.log('Including course data in streaming request:', {
                            courseName: currentChat.courseData.courseName,
                            courseCode: currentChat.courseData.courseCode,
                            hasMetadata: !!currentChat.metadata
                        });
                    }
                    
                    // For General Chat: Include ALL syllabi from all class chats
                    if (currentTab?.includes('private-general-chat')) {
                        const allClassChats = Object.values(chats).filter(chat => chat.chatType === 'class' && chat.courseData);
                        if (allClassChats.length > 0) {
                            requestBody.allSyllabi = allClassChats.map(chat => ({
                                courseName: chat.courseData?.courseName || chat.title,
                                courseCode: chat.courseData?.courseCode,
                                professor: chat.courseData?.professor,
                                topics: chat.courseData?.topics,
                                exams: chat.courseData?.exams,
                                assignments: chat.courseData?.assignments
                            }));
                            console.log('General Chat: Including ALL syllabi from', allClassChats.length, 'class chats');
                        }
                    }
                    
                    // Create streaming message ID
                    const tempMessageId = generateMessageId();
                    setStreamingMessageId(tempMessageId);
                    setStreamingResponse("");
                    setIsStreamingComplete(false);
                    
                    // Create AbortController for manual stop (works for all chat types)
                    const abortController = new AbortController();
                    abortControllerRef.current = abortController;
                    
                    // Combine manual abort with timeout
                    timeoutId = setTimeout(() => abortController.abort(), 35000);
                    
                    const response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'CourseConnect-Client/1.0',
                        },
                        body: JSON.stringify(requestBody),
                        signal: abortController.signal
                    });

                    console.log('API response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('API error response:', errorText);
                        throw new Error(`API call failed: ${response.status} - ${errorText}`);
                    }

                    // Handle streaming response
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();

                    if (!reader) {
                        throw new Error('No reader available for streaming');
                    }

                    // Reset variables for this stream
                    fullResponse = "";
                    sources = [];
                    metadata = null;
                    let buffer = "";

                    try {
                        while (true) {
                            // Check if aborted before reading
                            if (abortController.signal.aborted) {
                                console.log('🛑 Stream aborted by user - closing reader');
                                reader.cancel().catch(() => {}); // Cancel the reader
                                break;
                            }
                            
                            const { done, value } = await reader.read();

                            if (done) {
                                break;
                            }

                            const chunk = decoder.decode(value, { stream: true });
                            buffer += chunk;
                            const lines = buffer.split("\n");
                            buffer = lines.pop() || ""; // Keep incomplete line in buffer

                            for (const line of lines) {
                                if (!line.trim()) continue;
                                
                                try {
                                // Handle SSE format: "data: {...}"
                                let data;
                                if (line.startsWith("data: ")) {
                                    const jsonStr = line.slice(6).trim();
                                    if (jsonStr === "[DONE]") {
                                        continue;
                                    }
                                    data = JSON.parse(jsonStr);
                                } else {
                                    // Handle JSON lines format
                                    data = JSON.parse(line);
                                }

                                // Handle different response formats - prioritize streaming format
                                if (data.type === "content" && data.content) {
                                    // Stream content chunks incrementally
                                    fullResponse += data.content;
                                    setStreamingResponse(fullResponse);
                                } else if (data.type === "done") {
                                    // Finalize - don't replace the streamed text, just collect metadata
                                    // fullResponse already contains all the streamed chunks, keep it as-is
                                    // Only use fullResponse/answer from done message if we somehow got no chunks
                                    if (fullResponse.trim() === '') {
                                        // Fallback: use done message content only if we got no chunks
                                        if (data.fullResponse) {
                                            fullResponse = data.fullResponse;
                                            setStreamingResponse(fullResponse);
                                        } else if (data.answer) {
                                            fullResponse = data.answer;
                                            setStreamingResponse(fullResponse);
                                        }
                                    }
                                    // fullResponse already has the accumulated streamed text, don't replace it
                                    if (data.sources) sources = data.sources;
                                    if (data.metadata) metadata = data.metadata;
                                } else if (data.type === "status") {
                                    // Update status if needed
                                    console.log('Streaming status:', data.message);
                                } else if (data.answer && !data.type) {
                                    // Handle legacy SSE format with answer field (only if no type)
                                    fullResponse = data.answer;
                                    setStreamingResponse(fullResponse);
                                    if (data.sources) sources = data.sources;
                                    if (data.metadata) metadata = data.metadata;
                                } else if (data.success === false && data.error) {
                                    // Handle error responses
                                    console.error('Streaming API error:', data.error);
                                    throw new Error(data.error || 'Failed to generate response');
                                }
                                } catch (e) {
                                    // Skip invalid JSON lines, but log for debugging
                                    if (line.trim() && !line.startsWith("data: ")) {
                                        console.warn('Failed to parse streaming line:', line.substring(0, 100));
                                    }
                                }
                            }
                        }
                    } catch (readError: any) {
                        // Handle reader cancellation or errors
                        if (readError?.name === 'AbortError' || abortController.signal.aborted) {
                            console.log('🛑 Stream reading aborted');
                            reader.cancel().catch(() => {}); // Ensure reader is cancelled
                            // If aborted, save what we have and return early
                            if (fullResponse.trim()) {
                                const messageId = tempMessageId || generateMessageId();
                                const aiMessage = {
                                    id: messageId,
                                    text: fullResponse,
                                    sender: 'bot' as const,
                                    name: 'CourseConnect AI',
                                    timestamp: Date.now(),
                                    sources: sources || undefined,
                                    isSearchRequest: searchModeEnabledBeforeAPI || false
                                };
                                await addMessage(currentTab || 'private-general-chat', aiMessage);
                                
                                // Clear streaming state
                                setStreamingResponse("");
                                setStreamingMessageId(null);
                                setIsStreamingComplete(false);
                            }
                            
                            // Clear abort controller
                            if (timeoutId) clearTimeout(timeoutId);
                            abortControllerRef.current = null;
                            setIsLoading(false);
                            return; // Exit early - don't continue processing
                        } else {
                            throw readError;
                        }
                    } finally {
                        // Always close the reader when done
                        try {
                            reader.releaseLock();
                        } catch (e) {
                            // Reader may already be released
                        }
                    }

                    // Check if aborted before continuing
                    if (abortControllerRef.current?.signal.aborted) {
                        console.log('🛑 Stream was aborted - skipping final processing');
                        setIsLoading(false);
                        return;
                    }

                    // Disable search mode after successful API call
                    if (searchModeEnabled) {
                        document.body.removeAttribute('data-search-mode');
                        console.log('Search mode disabled after API call');
                    }
                    
                    // Track conversation metadata for class chats
                    if (isClassChat && metadata && currentTab) {
                        const currentChat = chats[currentTab];
                        if (currentChat) {
                            const currentMetadata = currentChat.metadata || {};
                            
                            // Update topics covered
                            const existingTopics = currentMetadata.topicsCovered || [];
                            const newTopics = metadata.topicsCovered || [];
                            const mergedTopics = Array.from(new Set([...existingTopics, ...newTopics]));
                            
                            // Update complexity level
                            const updatedMetadata = {
                                ...currentMetadata,
                                topicsCovered: mergedTopics,
                                questionComplexityLevel: metadata.questionComplexity || currentMetadata.questionComplexityLevel,
                                // Add struggling topics if confusion detected
                                strugglingWith: metadata.isConfused && newTopics.length > 0
                                    ? Array.from(new Set([...(currentMetadata.strugglingWith || []), ...newTopics]))
                                    : currentMetadata.strugglingWith
                            };
                            
                            // Update chat metadata in store (this would need to be persisted to Firebase in production)
                            console.log('Updated conversation metadata:', updatedMetadata);
                        }
                    }
                    
                    // Use exactly what was streamed - fullResponse has been accumulating chunks
                    // Don't replace it with anything from the done message
                    // Ensure we have a valid response
                    if (!fullResponse || fullResponse.trim() === '') {
                        console.warn('Streaming response was empty, using fallback');
                        fullResponse = "I'm having some trouble processing your request right now. Please try again in a moment.";
                    }
                    // fullResponse already contains exactly what was streamed, use it as-is
                    
                    // Use the streaming message ID if we have one, otherwise generate new one
                    const messageId = streamingMessageId || generateMessageId();
                    
                    const aiMessage = {
                        id: messageId,
                        text: fullResponse,
                        sender: 'bot' as const,
                        name: 'CourseConnect AI',
                        timestamp: Date.now(),
                        sources: sources || undefined,
                        isSearchRequest: searchModeEnabledBeforeAPI || false
                    };

                    // Add message to chat store first so it appears in the list
                    await addMessage(currentTab || 'private-general-chat', aiMessage);
                    
                    // Clear streaming state immediately to prevent overlap
                    // Use requestAnimationFrame to ensure DOM has updated
                    requestAnimationFrame(() => {
                        setStreamingResponse("");
                        setStreamingMessageId(null);
                        setIsStreamingComplete(false);
                    });
                    
                    // Update metadata if provided
                    if (metadata && currentTab) {
                        const currentChat = chats[currentTab];
                        if (currentChat) {
                            const currentMetadata = currentChat.metadata || {};
                            const updatedMetadata = {
                                ...currentMetadata,
                                ...(metadata.topicsCovered && {
                                    topicsCovered: Array.from(new Set([...(currentMetadata.topicsCovered || []), ...(metadata.topicsCovered || [])]))
                                }),
                                ...(metadata.questionComplexity && {
                                    questionComplexityLevel: metadata.questionComplexity
                                }),
                                ...(metadata.strugglingWith && {
                                    strugglingWith: Array.from(new Set([...(currentMetadata.strugglingWith || []), ...(metadata.strugglingWith || [])]))
                                })
                            };
                            useChatStore.setState((state) => ({
                                chats: {
                                    ...state.chats,
                                    [currentTab]: {
                                        ...state.chats[currentTab],
                                        metadata: updatedMetadata
                                    }
                                }
                            }));
                        }
                    }
                    
                    // Clear abort controller on success
                    if (timeoutId) clearTimeout(timeoutId);
                    abortControllerRef.current = null;
                } catch (apiError: any) {
                    // Check if user manually aborted before clearing ref
                    const wasAborted = apiError?.name === 'AbortError' || abortControllerRef.current?.signal.aborted;
                    
                    // Clear timeout and abort controller on error
                    if (timeoutId) clearTimeout(timeoutId);
                    abortControllerRef.current = null;
                    
                    // Don't show error if user manually aborted
                    if (wasAborted) {
                        console.log('AI response stopped by user');
                        setIsLoading(false);
                        setStreamingResponse("");
                        setStreamingMessageId(null);
                        return;
                    }
                    
                    console.warn("API call failed, using enhanced fallback:", apiError);
                    
                    // Clear streaming state on error
                    setStreamingResponse("");
                    setStreamingMessageId(null);
                    
                    // Enhanced fallback based on error type
                    let fallbackMessage = "I'm having trouble processing your request right now. Please try again in a moment.";
                    
                    if (apiError instanceof Error) {
                        if (apiError.name === 'TimeoutError' || apiError.message.includes('timeout')) {
                            fallbackMessage = "This is taking longer than usual. Please try again in a moment.";
                        } else if (apiError.message.includes('network') || apiError.message.includes('fetch')) {
                            fallbackMessage = "I'm temporarily unavailable. Please try again in a moment.";
                        }
                    }
                    
                    const aiMessage = {
                        id: generateMessageId(),
                        text: fallbackMessage,
                        sender: 'bot' as const,
                        name: 'CourseConnect AI',
                        timestamp: Date.now(),
                        sources: undefined,
                        isSearchRequest: false
                    };

                    // Add fallback AI response
                    await addMessage(currentTab || 'private-general-chat', aiMessage);
                }
            } catch (error) {
                console.error('AI Error:', error);
                const errorMessage = {
                    id: generateMessageId(),
                    text: "I'm having trouble processing your request right now. Please try again in a moment.",
                    sender: 'bot' as const,
                    name: 'CourseConnect AI',
                    timestamp: Date.now()
                };
                await addMessage(currentTab || 'private-general-chat', errorMessage);
            } finally {
                console.log('Setting isLoading to false');
                setIsLoading(false);
            }
        }
    };

    const handleSearchSelect = async (searchType: string, query: string) => {
        console.log('🔍 handleSearchSelect called:', { searchType, query, currentTab, isLoading });
        if (!currentTab || isLoading) {
            console.log('🔍 handleSearchSelect: Early return due to missing currentTab or isLoading');
            return;
        }
        
        // Send the message with search flag (no @search prefix needed)
        setInputValue(query);
        
        // Send the message with search flag
        await handleSendMessageWithSearch(query);
    };

    const handleSendMessageWithSearch = async (query: string) => {
        console.log('🔍 handleSendMessageWithSearch called:', { query, currentTab, isLoading });
        if (!query.trim() || !currentTab || isLoading) {
            console.log('🔍 handleSendMessageWithSearch: Early return');
            return;
        }
        
        const messageText = query.trim();
        const currentChat = chats[currentTab || 'private-general-chat'];
        const isPublicChat = currentChat?.chatType === 'public';
        const isClassChat = currentChat?.chatType === 'class';

        // Determine if this message mentions AI
        const hasAIMention = messageText.includes('@ai') || messageText.includes('@AI');
        
        // For public chats, only call AI if explicitly mentioned
        // For class chats (syllabus-based), always call AI
        // For private chats, use shouldCallAI setting
        const shouldCallAIFinal = isClassChat ? true : (isPublicChat ? hasAIMention : true);

        const userMessage = {
            id: generateMessageId(),
            text: messageText,
            sender: 'user' as const,
            name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
            userId: user?.uid || 'guest',
            timestamp: Date.now()
        };

        // Clear input immediately to prevent spam
        setInputValue("");

        // Stop typing indicator when message is sent
        if (currentTab) {
            pusherStopTyping();
        }

        // Set loading state immediately for instant thinking animation
        if (shouldCallAIFinal) {
            console.log('Setting isLoading to true for search message:', messageText);
            setIsLoading(true);
        }

        // Send message via Pusher for real-time broadcasting (this will update other tabs)
        pusherSendMessage();

        // Add user message immediately for instant UI response (non-blocking)
        addMessage(currentTab || 'private-general-chat', userMessage).catch(console.error);

        // Only get AI response if appropriate
        if (shouldCallAIFinal) {
            try {
                // Get AI response via API call with enhanced error handling
                let aiResponse;
                try {
                    // Determine if this is a class chat and use appropriate endpoint
                    const apiEndpoint = isClassChat ? '/api/chat/class' : '/api/chat';
                    console.log(`Making API call to ${apiEndpoint}...`, { isClassChat, hasCourseData: !!currentChat?.courseData });
                    
                    // Get userId from logged-in user (notifications only work for authenticated users)
                    const effectiveUserId = user?.uid;
                    
                    const requestBody: any = {
                            question: messageText,
                            context: currentChat?.title || 'General Chat',
                            conversationHistory: currentChat?.messages?.slice(-10).map(msg => ({
                                role: msg.sender === 'user' ? 'user' : 'assistant',
                                content: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)
                            })) || [],
                            shouldCallAI: shouldCallAIFinal,
                        isPublicChat: isPublicChat, // Only true for community chat, not class chats
                        userId: effectiveUserId, // Add userId for notification (works for both guest and logged-in users)
                        chatId: currentTab, // Add chatId for notification
                        chatTitle: currentChat?.title, // Add chatTitle for notification
                        isSearchRequest: true // Flag to indicate this is a search request
                    };
                    
                    console.log('🔍 Search request body created:', { 
                        question: requestBody.question, 
                        isSearchRequest: requestBody.isSearchRequest,
                        shouldCallAI: requestBody.shouldCallAI 
                    });

                    // Add course data for class chats
                    if (isClassChat && currentChat?.courseData) {
                        requestBody.courseData = currentChat.courseData;
                        requestBody.chatId = currentTab;
                        requestBody.metadata = currentChat.metadata; // Send metadata for persistent memory
                        console.log('Including course data:', {
                            courseName: currentChat.courseData.courseName,
                            courseCode: currentChat.courseData.courseCode,
                            hasMetadata: !!currentChat.metadata
                        });
                    }
                    
                    // For General Chat: Include ALL syllabi from all class chats
                    if (currentTab?.includes('private-general-chat')) {
                        const allClassChats = Object.values(chats).filter(chat => chat.chatType === 'class' && chat.courseData);
                        if (allClassChats.length > 0) {
                            requestBody.allSyllabi = allClassChats.map(chat => ({
                                courseName: chat.courseData?.courseName || chat.title,
                                courseCode: chat.courseData?.courseCode,
                                professor: chat.courseData?.professor,
                                topics: chat.courseData?.topics,
                                exams: chat.courseData?.exams,
                                assignments: chat.courseData?.assignments
                            }));
                        }
                    }
                    
                    console.log('Making API request with body:', {
                        question: requestBody.question.substring(0, 50) + '...',
                        context: requestBody.context,
                        conversationHistory: requestBody.conversationHistory.length,
                        isSearchRequest: requestBody.isSearchRequest
                    });
                    
                    const response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('API response received:', {
                        success: data.success,
                        answerLength: data.answer?.length || 0,
                        provider: data.provider,
                        sources: data.sources?.length || 0
                    });
                    
                    // Check if the response has an error field
                    if (data.error) {
                        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
                    }
                    
                    // Update conversation metadata if available
                    if (data.metadata) {
                        const currentMetadata = currentChat?.metadata || {};
                        const updatedMetadata = {
                            ...currentMetadata,
                            topicsCovered: data.metadata.topicsCovered || currentMetadata.topicsCovered,
                            strugglingWith: data.metadata.strugglingWith || currentMetadata.strugglingWith
                        };
                        
                        // Update chat metadata in store (this would need to be persisted to Firebase in production)
                        console.log('Updated conversation metadata:', updatedMetadata);
                    }
                    
                    aiResponse = data;
                } catch (apiError) {
                    console.warn("API call failed, using enhanced fallback:", apiError);
                    
                    // Enhanced fallback based on error type
                    let fallbackMessage = "I'm having trouble processing your request right now. Please try again in a moment.";
                    
                    if (apiError instanceof Error) {
                        if (apiError.name === 'TimeoutError' || apiError.message.includes('timeout')) {
                            fallbackMessage = "This is taking longer than usual. Please try again in a moment.";
                        } else if (apiError.message.includes('network') || apiError.message.includes('fetch')) {
                            fallbackMessage = "I'm temporarily unavailable. Please try again in a moment.";
                        }
                    }
                    
                    aiResponse = {
                        answer: fallbackMessage,
                        provider: 'fallback',
                        success: true
                    };
                }
                
                // Debug logging to see what aiResponse contains
                console.log('ChatPage - aiResponse:', aiResponse, 'type:', typeof aiResponse, 'answer type:', typeof (aiResponse as any)?.answer);

                // Ensure we always have a string for the message text
                let responseText = 'I apologize, but I couldn\'t generate a response.';
                
                if (aiResponse && typeof aiResponse === 'object') {
                    const responseObj = aiResponse as any;
                    // Check for error first
                    if (responseObj.error) {
                        // If we have an error, use a helpful message instead of the generic one
                        responseText = `I'm having trouble processing your request right now. ${responseObj.details ? responseObj.details : 'Please try again in a moment.'}`;
                    } else if (responseObj.answer && typeof responseObj.answer === 'string') {
                        responseText = responseObj.answer;
                    } else if (responseObj.response && typeof responseObj.response === 'string') {
                        responseText = responseObj.response;
                    } else if (responseObj.success === false) {
                        // API explicitly returned failure
                        responseText = 'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question.';
                    } else {
                        // Log for debugging
                        console.warn('Unexpected response structure:', responseObj);
                        responseText = 'I apologize, but I couldn\'t generate a proper response.';
                    }
                } else if (typeof aiResponse === 'string') {
                    responseText = aiResponse;
                }
                
                const aiMessage = {
                    id: generateMessageId(),
                    text: responseText || 'I apologize, but I couldn\'t generate a response.',
                    sender: 'bot' as const,
                    name: 'CourseConnect AI',
                    timestamp: Date.now(),
                    sources: aiResponse?.sources || undefined,
                    isSearchRequest: (aiResponse as any)?.isSearchRequest || false // Flag to indicate web search was requested
                };

                // Add AI response
                await addMessage(currentTab || 'private-general-chat', aiMessage);

                // Real-time AI response broadcasting is now handled in the chat store
            } catch (error) {
                console.error('AI Error:', error);
                const errorMessage = {
                    id: generateMessageId(),
                    text: "I'm having trouble processing your request right now. Please try again in a moment.",
                    sender: 'bot' as const,
                    name: 'CourseConnect AI',
                    timestamp: Date.now()
                };
                await addMessage(currentTab || 'private-general-chat', errorMessage);
            } finally {
                console.log('Setting isLoading to false');
                setIsLoading(false);
            }
        }
    };

    const { extractText, isExtracting } = useTextExtraction({
        onExtractionComplete: async (result, fileName) => {
            // Add extracted text as a message
            const extractedTextMessage = {
                id: generateMessageId(),
                text: `📄 **Text extracted from ${fileName}**\n\n${result.text}`,
                sender: 'bot' as const,
                name: 'CourseConnect AI',
                timestamp: Date.now()
            };
            await addMessage(currentTab || 'private-general-chat', extractedTextMessage);
        },
        onExtractionError: (error, fileName) => {
            console.error('Text extraction failed:', error);
        }
    });

    const { analyzeDocument, isAnalyzing } = useSmartDocumentAnalysis({
        onAnalysisComplete: async (result, fileName) => {
            // Store the extracted text for chat context
            // Support multiple documents per chat (for multiple lecture pages)
            const currentChatId = currentTab || 'private-general-chat';
            const storageKey = `document-content-${currentChatId}`;
            const documentData = {
                fileName,
                extractedText: result.extractedText,
                summary: result.summary,
                fileType: result.fileType,
                metadata: result.metadata,
                timestamp: Date.now()
            };
            
            // Get existing documents (support both array and single document for backward compatibility)
            const existingData = sessionStorage.getItem(storageKey);
            let documents: any[] = [];
            
            if (existingData) {
                try {
                    const parsed = JSON.parse(existingData);
                    documents = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    console.warn('Failed to parse existing documents, starting fresh');
                    documents = [];
                }
            }
            
            // Add new document to the array
            documents.push(documentData);
            
            console.log('💾 STORING DOCUMENT DATA (Multiple Documents Support):', {
                fileName: documentData.fileName,
                extractedTextLength: documentData.extractedText?.length || 0,
                extractedTextPreview: documentData.extractedText?.substring(0, 300) || 'NO CONTENT',
                summary: documentData.summary,
                storageKey: storageKey,
                chatId: currentChatId,
                totalDocuments: documents.length
            });
            
            // Store as array to support multiple documents
            sessionStorage.setItem(storageKey, JSON.stringify(documents));

            // Verify storage worked
            const verificationCheck = sessionStorage.getItem(storageKey);
            if (verificationCheck) {
                const verifiedData = JSON.parse(verificationCheck);
                const verifiedDocs = Array.isArray(verifiedData) ? verifiedData : [verifiedData];
                console.log('✅ VERIFICATION: Document stored successfully');
                console.log(`Total documents in storage: ${verifiedDocs.length}`);
                console.log('Latest document:', verifiedDocs[verifiedDocs.length - 1]?.fileName);
                console.log('Latest document text length:', verifiedDocs[verifiedDocs.length - 1]?.extractedText?.length || 0);
            } else {
                console.error('❌ VERIFICATION FAILED: Document not stored in sessionStorage');
            }

            // Add AI analysis as a message with proper formatting
            const analysisMessage = {
                id: generateMessageId(),
                text: `**📄 Document Analysis: ${fileName}**\n\n${result.summary || 'Analysis completed successfully.'}\n\n*Document content loaded - ask me anything about it!*`,
                sender: 'bot' as const,
                name: 'CourseConnect AI',
                timestamp: Date.now()
            };
            await addMessage(currentTab || 'private-general-chat', analysisMessage);
        },
        onAnalysisError: (error, fileName) => {
            console.error('Document analysis failed:', error);
            // Add error message
            const errorMessage = {
                id: generateMessageId(),
                text: `❌ **Analysis Failed for ${fileName}**\n\nSorry, I couldn't analyze this file. Please try uploading a different file or check if the file format is supported.`,
                sender: 'bot' as const,
                name: 'CourseConnect AI',
                timestamp: Date.now()
            };
            addMessage(currentTab || 'private-general-chat', errorMessage);
        }
    });

    const handleFileUpload = async (file: File) => {
        try {
            // Check if the file is an image
            const isImage = file.type.startsWith('image/');
            
            // Get current chat's course data for context validation
            const currentChat = currentTab ? chats[currentTab] : null;
            const courseData = currentChat?.courseData || null;
            const isClassChat = currentChat?.chatType === 'class';
            
            // For class chats with images, validate BEFORE uploading
            if (isImage && isClassChat && courseData) {
                setIsLoading(true);
                
                // Convert image to base64 for validation
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const base64Image = e.target?.result as string;
                        const base64Data = base64Image.split(',')[1];
                        
                        // Validate image relevance first
                        const validationResponse = await fetch('/api/chat/vision', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: 'Validate image relevance',
                                image: base64Data,
                                mimeType: file.type,
                                courseData: courseData,
                            }),
                        });
                        
                        if (!validationResponse.ok) {
                            throw new Error('Validation failed');
                        }
                        
                        const validationData = await validationResponse.json();
                        
                        // If image is not related, show error and don't upload
                        if (validationData.isNotRelated) {
                            setIsLoading(false);
                            toast.error("Image Not Related to Course", {
                                description: validationData.response,
                                duration: 5000,
                            });
                            
                            // Offer to navigate to General Chat
                            const errorMessage = {
                                id: generateMessageId(),
                                text: validationData.response,
                                sender: 'bot' as const,
                                name: 'CourseConnect AI',
                                timestamp: Date.now()
                            };
                            await addMessage(currentTab || 'private-general-chat', errorMessage);
                            return;
                        }
                        
                        // Image is related, proceed with upload
                        const fileUrl = URL.createObjectURL(file);
                        const userText = inputValue.trim();
                        
                        const uploadMessage = {
                            id: generateMessageId(),
                            text: userText,
                            sender: 'user' as const,
                            name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
                            timestamp: Date.now(),
                            file: {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: fileUrl
                            }
                        };
                        
                        setInputValue('');
                        await addMessage(currentTab || 'private-general-chat', uploadMessage);
                        
                        // Now do full analysis
                        const analysisPrompt = userText || 'Please analyze this image. Extract any text (OCR), solve problems shown, or explain concepts in detail. Use LaTeX for math.';
                        const analysisResponse = await fetch('/api/chat/vision', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: analysisPrompt,
                                image: base64Data,
                                mimeType: file.type,
                                courseData: courseData,
                            }),
                        });
                        
                        if (!analysisResponse.ok) {
                            throw new Error('Analysis failed');
                        }
                        
                        const analysisData = await analysisResponse.json();
                        
                        const analysisMessage = {
                            id: generateMessageId(),
                            text: analysisData.response,
                            sender: 'bot' as const,
                            name: 'CourseConnect AI',
                            timestamp: Date.now()
                        };
                        await addMessage(currentTab || 'private-general-chat', analysisMessage);
                        setIsLoading(false);
                        
                    } catch (error) {
                        console.error('🚨 Image processing error:', error);
                        setIsLoading(false);
                        toast.error("Processing Failed", {
                            description: "Could not process the image. Please try again.",
                        });
                    }
                };
                reader.readAsDataURL(file);
                return; // Exit early for class chat image validation
            }
            
            // For non-class chats or non-image files, proceed normally
            const fileUrl = URL.createObjectURL(file);
            const userText = inputValue.trim();

            // Create message with both image and text
            const uploadMessage = {
                id: generateMessageId(),
                text: userText, // Include user's typed message
                sender: 'user' as const,
                name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
                timestamp: Date.now(),
                file: {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: fileUrl
                }
            };

            // Clear input field
            setInputValue('');

            // Add upload message immediately (non-blocking)
            await addMessage(currentTab || 'private-general-chat', uploadMessage);

            // Handle image files with GPT-4o Vision (for non-class chats)
            if (isImage) {
                // Show loading state only for AI analysis
                setIsLoading(true);
                
                // Convert image to base64
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const base64Image = e.target?.result as string;
                        const base64Data = base64Image.split(',')[1]; // Remove data:image/...;base64, prefix

                        console.log('🖼️ Analyzing image...');

                        // Use user's text as prompt if provided, otherwise use default
                        const analysisPrompt = userText || 'Please analyze this image. Extract any text (OCR), solve problems shown, or explain concepts in detail. Use LaTeX for math.';

                        // Call vision API (no courseData for general chats)
                        const response = await fetch('/api/chat/vision', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: analysisPrompt,
                                image: base64Data,
                                mimeType: file.type,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error('Vision API request failed');
                        }

                        const data = await response.json();
                        console.log('✅ Analysis complete!');

                        // Add AI response message
                        const analysisMessage = {
                            id: generateMessageId(),
                            text: data.response,
                            sender: 'bot' as const,
                            name: 'CourseConnect AI',
                            timestamp: Date.now()
                        };
                        await addMessage(currentTab || 'private-general-chat', analysisMessage);

                    } catch (error) {
                        console.error('🚨 Analysis error:', error);
                        const errorMessage = {
                            id: generateMessageId(),
                            text: `❌ **Analysis Failed**\n\nSorry, I couldn't analyze this image. Please try again.`,
                            sender: 'bot' as const,
                            name: 'CourseConnect AI',
                            timestamp: Date.now()
                        };
                        await addMessage(currentTab || 'private-general-chat', errorMessage);
                    } finally {
                        setIsLoading(false);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // Use smart document analysis for non-image files
                setIsLoading(true);
            await analyzeDocument(file);
                setIsLoading(false);
            }

        } catch (error) {
            console.error('File upload error:', error);
            toast.error("Upload failed", {
                description: "There was an error uploading your file. Please try again.",
            });
            setIsLoading(false);
        }
    };

    // Handler functions for menu actions
    const handleExportChat = () => {
        try {
            exportChat(currentTab || 'private-general-chat');
            toast.success("Chat Exported", {
                description: "Chat has been exported and downloaded.",
            });
        } catch (error) {
            toast.error("Export Failed", {
                description: "Could not export the chat. Please try again.",
            });
        }
    };

    const handleGenerateSummary = async () => {
        if (!currentTab || !chats[currentTab]) return;
        
        setIsGeneratingSummary(true);
        setShowSummaryDialog(true);
        setChatSummary('');
        
        try {
            const currentChat = chats[currentTab];
            const messages = currentChat.messages || [];
            
            if (messages.length === 0) {
                setChatSummary('This chat has no messages yet. Start a conversation to get a summary!');
                setIsGeneratingSummary(false);
                return;
            }
            
            // Prepare chat content for summarization
            // Include all messages except system messages and empty messages
            console.log('📝 Generating summary for chat:', currentTab, 'Messages count:', messages.length);
            console.log('📝 Message senders:', messages.map((m: any) => m.sender));
            
            const chatContent = messages
                .filter((msg: any) => {
                    // Filter out system messages and welcome messages
                    if (msg.sender === 'system') {
                        console.log('⏭️ Filtering out system message');
                        return false;
                    }
                    if (msg.sender === 'bot' && msg.text?.includes('Welcome')) {
                        console.log('⏭️ Filtering out welcome message');
                        return false;
                    }
                    
                    // Include messages with actual content
                    const text = msg.text || msg.content || '';
                    const hasContent = text.trim().length > 0;
                    if (!hasContent) {
                        console.log('⏭️ Filtering out empty message from sender:', msg.sender);
                    }
                    return hasContent;
                })
                .map((msg: any) => {
                    // Include all message types: user, bot, ai
                    const sender = msg.sender === 'user' ? 'You' : 'AI';
                    const text = msg.text || msg.content || '';
                    console.log('✅ Including message from:', msg.sender, 'Length:', text.length);
                    return `${sender}: ${text}`;
                })
                .join('\n\n');
            
            console.log('📝 Final chat content length:', chatContent.length, 'characters');
            
            const response = await fetch('/api/chat/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: currentTab,
                    chatTitle: currentChat.title || getChatDisplayName(currentTab),
                    messages: chatContent,
                    courseData: currentChat.courseData,
                    chatType: currentChat.chatType
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Summary API error:', errorData);
                throw new Error(errorData.error || `Failed to generate summary (${response.status})`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to generate summary');
            }
            setChatSummary(data.summary || 'Unable to generate summary.');
        } catch (error: any) {
            console.error('Error generating summary:', error);
            setChatSummary('Failed to generate summary. Please try again.');
            toast.error("Summary Failed", {
                description: "Could not generate chat summary. Please try again.",
            });
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleResetChat = async () => {
        // Close dialog immediately
        setShowResetDialog(false);
        
        const chatToReset = currentTab || 'private-general-chat';
        
        try {
            // Set flag to prevent any navigation during reset
            isResettingRef.current = true;
            
            // Store current tab to ensure it doesn't change
            const preservedTab = chatToReset;
            
            console.log('🔄 RESET CHAT STARTED:', chatToReset);
            console.log('🔄 Messages before reset:', chats[chatToReset]?.messages?.length || 0);
            console.log('🔄 Setting reset flag to prevent navigation');
            
            // Force set currentTab BEFORE reset to lock it in place
            setCurrentTab(preservedTab);
            
            await resetChat(chatToReset);
            
            console.log('🔄 RESET CHAT COMPLETED');
            console.log('🔄 Messages after reset:', chats[chatToReset]?.messages?.length || 0);
            
            // Force currentTab again after reset
            setCurrentTab(preservedTab);
            
            // Save to localStorage explicitly multiple times to ensure it sticks
            try {
                localStorage.setItem('cc-active-tab', preservedTab);
                console.log('🔄 Saved active tab to localStorage:', preservedTab);
            } catch {}
            
            // Wait for state to settle, then clear the flag
            setTimeout(() => {
                isResettingRef.current = false;
                console.log('🔄 Reset flag cleared');
                
                // Final check - if somehow tab changed, force it back
                if (currentTab !== preservedTab) {
                    console.log('🔄 Final tab restore to:', preservedTab);
                    setCurrentTab(preservedTab);
                }
            }, 1000);
            
            toast.success("Chat Reset", {
                description: "Chat has been reset to its initial state.",
            });
            
            // Scroll to top to show welcome message
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } catch (error) {
            isResettingRef.current = false;
            console.error('❌ Reset chat error:', error);
            toast.error("Reset Failed", {
                description: "Could not reset the chat. Please try again.",
            });
        }
    };

    const handleDeleteChat = async () => {
        // Close dialog immediately
        setShowDeleteDialog(false);
        
        try {
            const toDelete = currentTab || 'private-general-chat';
            await deleteChat(toDelete);
            toast.success("Chat Deleted", {
                description: "Chat has been permanently deleted.",
            });
            // Redirect to another available chat instead of dashboard
            const ids = Object.keys(chats).filter(id => id !== toDelete);
            const fallback = ids.includes('public-general-chat')
                ? 'public-general-chat'
                : (ids.includes('private-general-chat') ? 'private-general-chat' : ids[0]);
            if (fallback) {
                setCurrentTab(fallback);
                try { localStorage.setItem('cc-active-tab', fallback); } catch {}
            } else {
                // If none, fallback to private-general-chat implicitly
                setCurrentTab('private-general-chat');
                try { localStorage.setItem('cc-active-tab', 'private-general-chat'); } catch {}
            }
        } catch (error) {
            toast.error("Delete Failed", {
                description: "Could not delete the chat. Please try again.",
            });
        }
    };

    // Get class chats (non-general chats)
    const classChats = Object.entries(chats).filter(([id, chat]) => id !== 'private-general-chat' && id !== 'public-general-chat');
    const generalChat = chats[currentTab || 'private-general-chat'];
    const pageHeaderTitle = currentTab ? getChatDisplayName(currentTab) : 'Chat';

    // Debug logging
    if (DEBUG) {
        console.log('ChatPage - isStoreLoading:', isStoreLoading, 'forceLoad:', forceLoad, 'chats:', Object.keys(chats), 'currentTab:', currentTab);
        console.log('ChatPage - classChats:', classChats);
        console.log('ChatPage - generalChat:', generalChat);
        console.log('ChatPage - isLoading:', isLoading, 'lastMessageSender:', generalChat?.messages?.at(-1)?.sender);
    }
    // console.log('ChatPage - Pusher state:', { isConnected: pusherConnected, activeUsers: pusherActiveUsers.length, typingUsers: pusherTypingUsers.length, isAiThinking: pusherIsAiThinking });

    // Show loading state while chat store is initializing (but not if force loaded)
    if (isStoreLoading && !forceLoad) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-primary mx-auto mb-4"></div>
                    <h2 className="text-lg font-semibold mb-2">Loading Chat</h2>
                    <p className="text-sm text-muted-foreground mb-4">Please wait while we prepare your chat</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex flex-col w-full h-full max-w-full overflow-hidden">
                <div className="mb-4 px-4 lg:px-0 mt-4 lg:mt-0">
                    <div className="flex items-center justify-between">
                        <div className="max-w-full">
                            <h1 className="text-2xl lg:text-3xl font-bold mb-1 truncate">
                                {currentTab === 'public-general-chat' ? 'Community' : (currentTab ? getChatDisplayName(currentTab) : 'Class Chat')}
                            </h1>
                            <p className="text-sm lg:text-base text-muted-foreground line-clamp-1 lg:line-clamp-none">
                                {currentTab === 'public-general-chat' 
                                    ? 'Connect with classmates and get AI-powered help.'
                                    : 'Personalized AI tutoring tailored to your syllabus.'}
                            </p>
                        </div>
                        {/* Real-time status indicator */}
                        {currentTab === 'public-general-chat' && (
                            <OnlineUsersIndicator 
                                users={pusherActiveUsers}
                                isConnected={pusherConnected}
                                showAvatars={true}
                                maxVisible={5}
                            />
                        )}
                    </div>
                </div>


                {/* Chat Interface - Full Width */}
                <div className="w-full flex-1 flex">
                    {/* Chat Sidebar - HIDDEN FOR NOW, will implement better later */}
                    <div className="hidden w-64 flex-shrink-0 chat-sidebar bg-transparent">
                        <div className="h-full flex flex-col">
                            <div className="pb-3 p-4">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Chatting01Icon className="h-5 w-5" />
                                    Chats
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="h-full overflow-y-auto">
                                    <div className="p-4 space-y-2">
                                        {(() => {
                                            // Always show permanent chats first
                                            const permanentChats = [
                                                {
                                                    chatId: 'private-general-chat',
                                                    title: 'General Chat',
                                                    userCount: 1, // Always show as available
                                                    isActive: true,
                                                    isPermanent: true
                                                }
                                                // Community chat hidden
                                                // {
                                                //     chatId: 'public-general-chat',
                                                //     title: (typeof window !== 'undefined' && 
                                                //            (window.location.hostname === 'localhost' || 
                                                //             localStorage.getItem('dev-mode') === 'true'))
                                                //            ? 'Community (Dev Mode)' 
                                                //            : 'Community (Coming Soon)',
                                                //     userCount: 0,
                                                //     isActive: true,
                                                //     isPermanent: true,
                                                //     disabled: !(typeof window !== 'undefined' && 
                                                //                (window.location.hostname === 'localhost' || 
                                                //                 localStorage.getItem('dev-mode') === 'true'))
                                                // }
                                            ];

                                            // Get other active chats from pusher
                                            const otherChats = pusherAvailableChats
                                                .filter(chat => chat.isActive && !chat.chatId.includes('general-chat'))
                                                .sort((a, b) => {
                                                    // Sort by user count (descending), then by title
                                                    if (a.userCount !== b.userCount) {
                                                        return b.userCount - a.userCount;
                                                    }
                                                    return a.title.localeCompare(b.title);
                                                });

                                            // Get local class chats that aren't in pusher chats yet
                                            console.log('🔍 SIDEBAR: All chats:', Object.keys(chats));
                                            console.log('🔍 SIDEBAR: Chats with details:', Object.entries(chats).map(([id, chat]) => ({
                                                id,
                                                title: chat.title,
                                                chatType: chat.chatType,
                                                hasCourseData: !!chat.courseData
                                            })));
                                            
                                            const localClassChats = Object.values(chats)
                                                .filter(chat => {
                                                    // Show if it has courseData (it's a class chat) OR if chatType is 'class'
                                                    const isClass = chat.chatType === 'class' || !!chat.courseData;
                                                    const notInPusher = !otherChats.some(pusherChat => pusherChat.chatId === chat.id);
                                                    const notGeneralChat = chat.id !== 'private-general-chat' && 
                                                                          chat.id !== 'public-general-chat' &&
                                                                          chat.id !== 'private-general-chat-guest' &&
                                                                          !chat.id.includes('private-general-chat-');
                                                    
                                                    console.log(`🔍 SIDEBAR: Chat "${chat.title}" (${chat.id}):`);
                                                    console.log(`  chatType: "${chat.chatType}", hasCourseData: ${!!chat.courseData}`);
                                                    console.log(`  ✓ isClass: ${isClass}`);
                                                    console.log(`  ✓ notInPusher: ${notInPusher}`);
                                                    console.log(`  ✓ notGeneralChat: ${notGeneralChat}`);
                                                    console.log(`  ➡️ SHOULD SHOW: ${isClass && notInPusher && notGeneralChat}`);
                                                    
                                                    return isClass && notInPusher && notGeneralChat;
                                                })
                                                .map(chat => ({
                                                    chatId: chat.id,
                                                    title: chat.title,
                                                    userCount: 1,
                                                    isActive: true,
                                                    isPermanent: false
                                                }))
                                                .sort((a, b) => a.title.localeCompare(b.title));
                                            
                                            console.log('🔍 SIDEBAR: Local class chats filtered:', localClassChats);


                                            // Combine permanent chats with other chats and local class chats
                                            const allChats = [...permanentChats, ...otherChats, ...localClassChats];

                                            return allChats.map(chat => {
                                                const isPublic = chat.chatId === 'public-general-chat';
                                                const isPrivate = chat.chatId === 'private-general-chat';
                                                const unread = unreadById[chat.chatId] ?? 0;
                                                const isActive = currentTab === chat.chatId;
                                                
                                                // Determine category and color for class chats
                                                const getCategory = (title: string) => {
                                                    const lowerTitle = title.toLowerCase();
                                                    if (lowerTitle.includes('music') || lowerTitle.includes('mua')) return { name: 'Music', color: 'purple' };
                                                    if (lowerTitle.includes('math') || lowerTitle.includes('calculus') || lowerTitle.includes('algebra') || lowerTitle.includes('geometry')) return { name: 'Math', color: 'blue' };
                                                    if (lowerTitle.includes('english') || lowerTitle.includes('literature') || lowerTitle.includes('writing') || lowerTitle.includes('eng')) return { name: 'English', color: 'pink' };
                                                    if (lowerTitle.includes('science') || lowerTitle.includes('biology') || lowerTitle.includes('chemistry') || lowerTitle.includes('physics')) return { name: 'Science', color: 'green' };
                                                    if (lowerTitle.includes('history') || lowerTitle.includes('social') || lowerTitle.includes('hist')) return { name: 'History', color: 'amber' };
                                                    if (lowerTitle.includes('art') || lowerTitle.includes('design') || lowerTitle.includes('drawing')) return { name: 'Art', color: 'rose' };
                                                    if (lowerTitle.includes('computer') || lowerTitle.includes('coding') || lowerTitle.includes('programming') || lowerTitle.includes('cs')) return { name: 'Tech', color: 'cyan' };
                                                    return { name: 'Class', color: 'slate' };
                                                };
                                                
                                                const isClassChat = !isPublic && !isPrivate;
                                                const category = isClassChat ? getCategory(chat.title) : null;
                                                
                                                const getCategoryColorClasses = (color: string) => {
                                                    const colors: Record<string, string> = {
                                                        purple: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300 border border-purple-500/30',
                                                        blue: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300 border border-blue-500/30',
                                                        pink: 'bg-pink-500/20 text-pink-700 dark:bg-pink-500/30 dark:text-pink-300 border border-pink-500/30',
                                                        green: 'bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 border border-green-500/30',
                                                        amber: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300 border border-amber-500/30',
                                                        rose: 'bg-rose-500/20 text-rose-700 dark:bg-rose-500/30 dark:text-rose-300 border border-rose-500/30',
                                                        cyan: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/30 dark:text-cyan-300 border border-cyan-500/30',
                                                        slate: 'bg-slate-500/20 text-slate-700 dark:bg-slate-500/30 dark:text-slate-300 border border-slate-500/30'
                                                    };
                                                    return colors[color] || colors.slate;
                                                };
                                                
                                                return (
                                                    <button
                                                        key={chat.chatId}
                                                        onClick={() => { 
                                                            setCurrentTab(chat.chatId); 
                                                            try { localStorage.setItem('cc-active-tab', chat.chatId); } catch {} 
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 !bg-transparent ${
                                                            isActive 
                                                                ? 'border-2 border-dotted border-blue-500 dark:border-blue-400' 
                                                                : 'border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                                                        }`}
                                                        style={{ background: 'transparent !important' }}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {isPrivate ? (
                                                                <Chatting01Icon className="h-4 w-4" />
                                                            ) : isPublic ? (
                                                                <Globe02Icon className="h-4 w-4" />
                                                            ) : (
                                                                <BookOpen01Icon className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium truncate">
                                                                    {getChatDisplayName(chat.chatId)}
                                                                </span>
                                                                {isPublic && (
                                                                    <span className="inline-flex items-center text-[10px] px-2 py-1 rounded-md font-semibold bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300 border border-emerald-500/30">
                                                                        Live
                                                                    </span>
                                                                )}
                                                                {isPrivate && (
                                                                    <span className="inline-flex items-center text-[10px] px-2 py-1 rounded-md font-semibold bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300 border border-blue-500/30">
                                                                        AI
                                                                    </span>
                                                                )}
                                                                {category && (
                                                                    <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded-md font-semibold ${getCategoryColorClasses(category.color)}`}>
                                                                        {category.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs truncate text-muted-foreground">
                                                                {isPrivate ? (
                                                                    'AI Assistant • Private'
                                                                ) : isPublic ? (
                                                                    <>
                                                                        <div className="font-medium mb-0.5 text-muted-foreground/80">
                                                                            Connect with students • Share knowledge • Study together
                                                                        </div>
                                                                        <div>
                                                                            {chat.userCount} user{chat.userCount !== 1 ? 's' : ''} online
                                                                            {pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage && (
                                                                                <span className="ml-2">
                                                                                    • {pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text.length > 30 
                                                                                        ? pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text.substring(0, 30) + '...' 
                                                                                        : pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {chat.userCount} user{chat.userCount !== 1 ? 's' : ''} online
                                                                        {pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage && (
                                                                            <span className="ml-2">
                                                                                • {pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text.length > 30 
                                                                                    ? pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text.substring(0, 30) + '...' 
                                                                                    : pusherAvailableChats.find((c: any) => c.chatId === chat.chatId)?.lastMessage?.text}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {unread > 0 && (
                                                            <div className="flex-shrink-0">
                                                                <span className="inline-flex items-center justify-center text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-white text-red-600 font-extrabold shadow-lg border-2 border-red-600 dark:bg-red-500 dark:text-white dark:border-red-500">
                                                                    {unread > 9 ? '9+' : unread}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="pb-3 flex-shrink-0 px-4 border-b border-border/50">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base">{currentTab ? getChatDisplayName(currentTab) : 'Loading...'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {currentChat?.chatType === 'class' 
                                                        ? 'AI-powered course assistance' 
                                                        : 'Get help with any topic'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleGenerateSummary}
                                                className="h-9 px-4 text-xs font-semibold bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:via-blue-500/20 hover:to-indigo-500/20 border border-blue-200/70 dark:border-blue-900/60 text-blue-700 dark:text-blue-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-full"
                                                disabled={isGeneratingSummary}
                                            >
                                                {isGeneratingSummary ? 'Generating...' : 'Generate AI Summary'}
                                            </Button>
                                            {currentChat?.chatType === 'class' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    <UserGroupIcon className="h-3 w-3 mr-1" />
                                                    Class Chat
                                                </Badge>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-transparent hover:text-current">
                                                        <MoreVerticalIcon className="h-4 w-4" />
                                                        <span className="sr-only">Chat options</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={handleExportChat}>
                                                    <Download01Icon className="h-4 w-4 mr-2" />
                                                    Export Chat
                                                </DropdownMenuItem>
                                                {!currentChat?.disabled && (
                                                <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
                                                    <RotateLeft01Icon className="h-4 w-4 mr-2" />
                                                    Reset Chat
                                                </DropdownMenuItem>
                                                )}
                                                {currentTab !== 'private-general-chat' && currentTab !== 'private-general-chat-guest' && !currentTab?.startsWith('private-general-chat-') && currentTab !== 'public-general-chat' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                                                            <Delete01Icon className="h-4 w-4 mr-2" />
                                                            Delete Chat
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                    {/* New chat modal removed: chats are created via Upload Syllabus only */}
                                    <ScrollArea className="h-[calc(100vh-200px)] scrollbar-hide" ref={scrollAreaRef}>
                                        <div className="space-y-6 pb-4 w-full px-4">
                                            {/* Skeleton Loading */}
                                            {isMessagesLoading ? (
                                                <div className="space-y-6 py-4">
                                                    {/* Bot Message Skeleton */}
                                                    <div className="flex gap-3 items-start">
                                                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <Skeleton className="h-4 w-24" />
                                                            <div className="space-y-2">
                                                                <Skeleton className="h-4 w-full" />
                                                                <Skeleton className="h-4 w-[90%]" />
                                                                <Skeleton className="h-4 w-[80%]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* User Message Skeleton */}
                                                    <div className="flex gap-3 items-start justify-end">
                                                        <div className="flex-1 space-y-2 flex flex-col items-end">
                                                            <Skeleton className="h-4 w-24" />
                                                            <Skeleton className="h-16 w-[60%]" />
                                                        </div>
                                                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                                    </div>
                                                    {/* Bot Message Skeleton */}
                                                    <div className="flex gap-3 items-start">
                                                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <Skeleton className="h-4 w-24" />
                                                            <div className="space-y-2">
                                                                <Skeleton className="h-4 w-full" />
                                                                <Skeleton className="h-4 w-[95%]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                            {/* Welcome Card - show for first message and if it's a welcome message */}
                                            {(() => {
                                                const currentChat = chats[currentTab || 'private-general-chat-guest'];
                                                const isClassChat = currentChat?.chatType === 'class';
                                                const isGeneralChat = currentTab === 'private-general-chat' || currentTab === 'private-general-chat-guest' || currentTab === 'public-general-chat';
                                                
                                                // Show WelcomeCard for class chats
                                                if (isClassChat && currentChat?.messages?.length === 1 && 
                                                    currentChat.messages[0]?.sender === 'bot' && 
                                                    currentChat.messages[0]?.text?.includes('Welcome')) {
                                                    return (
                                                        <WelcomeCard 
                                                            chatType="class"
                                                            courseData={currentChat.courseData}
                                                            onQuickAction={(action) => {
                                                                setInputValue(action);
                                                                setTimeout(() => {
                                                                    const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
                                                                    if (input) {
                                                                        input.focus();
                                                                        input.setSelectionRange(input.value.length, input.value.length);
                                                                    }
                                                                }, 100);
                                                            }}
                                                        />
                                                    );
                                                }
                                                
                                                // Show WelcomeCard for general chats
                                                if (isGeneralChat && generalChat?.messages?.length === 1 && 
                                                    generalChat.messages[0]?.sender === 'bot' && 
                                                    generalChat.messages[0]?.text?.includes('Welcome')) {
                                                    return (
                                                        <WelcomeCard 
                                                            chatType={currentTab === 'public-general-chat' ? 'community' : 'general'}
                                                            onQuickAction={(action) => {
                                                                setInputValue(action);
                                                                setTimeout(() => {
                                                                    const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
                                                                    if (input) {
                                                                        input.focus();
                                                                        input.setSelectionRange(input.value.length, input.value.length);
                                                                    }
                                                                }, 100);
                                                            }}
                                                        />
                                                    );
                                                }
                                                
                                                return null;
                                            })()}
                                            
                                            {/* Render messages for current chat */}
                                            {(() => {
                                                const currentChat = chats[currentTab || 'private-general-chat-guest'];
                                                const isClassChat = currentChat?.chatType === 'class';
                                                const isGeneralChat = currentTab === 'private-general-chat' || currentTab === 'private-general-chat-guest' || currentTab === 'public-general-chat';
                                                
                                                // Use currentChat for class chats, generalChat for general chats
                                                const messagesToRender = isClassChat ? currentChat?.messages : generalChat?.messages;
                                                
                                                return messagesToRender?.map((message, index) => {
                                                const messageKey = message.id || `fallback-${index}-${message.timestamp}`;
                                                // Ensure unique key by including index
                                                const uniqueKey = `msg-${messageKey}-${index}`;
                                                if (deletedMessageIds.has(messageKey)) {
                                                    return (
                                                        <div key={uniqueKey} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full px-4`}>
                                                            <div className={`flex gap-4 ${message.sender === 'user' ? 'max-w-[80%]' : 'max-w-[80%]'} min-w-0 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                {message.sender === 'bot' ? (
                                                                    <img src="/favicon-32x32.png" alt="AI" className="w-10 h-10 flex-shrink-0 object-contain rounded-full" />
                                                                ) : (
                                                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                                                        {message.sender === 'user' && !isGuest && userProfilePicture ? (
                                                                            <AvatarImage src={userProfilePicture} />
                                                                        ) : null}
                                                                        <AvatarFallback className="text-sm font-medium">
                                                                            {message.sender === 'user' ? (
                                                                                isGuest ? 'G' : (user?.displayName?.[0] || user?.email?.[0] || 'U')
                                                                            ) : null}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                <div className={`${message.sender === 'user' ? 'text-right' : 'text-left'} min-w-0`}>
                                                                    <div className="bg-muted/30 border border-border/50 rounded-2xl px-3 py-2 text-xs italic text-muted-foreground">
                                                                        You deleted this message
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                // Handle system messages (join notifications)
                                                if (message.sender === 'system') {
                                                    return (
                                                        <JoinMessage 
                                                            key={`join-${messageKey}-${index}`}
                                                            message={message}
                                                        />
                                                    );
                                                }
                                                
                                                // Skip the welcome message - we show the interactive card instead
                                                if (message.sender === 'bot' && message.text?.includes('Welcome')) {
                                                    return null;
                                                }
                                                
                                                return (
                                                <div key={uniqueKey} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full px-4`}>
                                                    <div className={`flex gap-4 ${message.sender === 'user' ? 'max-w-[80%]' : 'max-w-[80%]'} min-w-0 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        {message.sender === 'bot' ? (
                                                            <img src="/favicon-32x32.png" alt="AI" className="w-10 h-10 flex-shrink-0 object-contain rounded-full" />
                                                        ) : (
                                                            <Avatar className="w-10 h-10 flex-shrink-0">
                                                                {message.sender === 'user' && !isGuest && userProfilePicture ? (
                                                                    <AvatarImage src={userProfilePicture} />
                                                                ) : null}
                                                                <AvatarFallback className="text-sm font-medium">
                                                                    {message.sender === 'user' ? (
                                                                        message.name ? message.name[0].toUpperCase() : 'U'
                                                                    ) : null}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        {message.sender === 'user' ? (
                                                            <ContextMenu>
                                                            <ContextMenuTrigger asChild>
                                                            <div className="text-right min-w-0 group">
                                                                <div className="flex items-center justify-end gap-2 mb-1">
                                                                    <div className="text-sm text-gray-600 font-medium">
                                                                        {message.name}
                                                                    </div>
                                                                    <MessageTimestamp timestamp={message.timestamp} />
                                                                </div>
                                                                {/* Show file preview and/or text bubble */}
                                                                <div className="flex flex-col items-end gap-2">
                                                                    {/* Show file(s) preview if exists */}
                                                                    {((message as any).files || (message as any).file) && (
                                                                        <div className={`${((message as any).files || [(message as any).file]).filter(Boolean).length === 1 ? 'max-w-sm' : 'grid grid-cols-2 gap-2 max-w-sm'}`}>
                                                                            {/* Support old single-file shape */}
                                                                            {((message as any).files || [(message as any).file]).filter(Boolean).map((f: any, idx: number) => (
                                                                                <div key={idx} className="relative rounded-xl overflow-hidden shadow-md border border-primary/20">
                                                                                    {f.type?.startsWith('image/') ? (
                                                                                        <img src={f.url} alt={f.name} className="w-full h-32 object-cover" />
                                                                                    ) : (
                                                                                        <div className="px-3 py-2 flex items-center gap-2 text-xs bg-primary/10">
                                                                                            <Book01Icon className="h-4 w-4 text-primary" />
                                                                                            <span className="font-medium truncate">{f.name}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {/* Show text bubble if text exists */}
                                                                    {message.text && message.text.trim() && (
                                                                        <div className="relative inline-block bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-full overflow-hidden user-message-bubble shadow-md text-[15px]">
                                                                            <ExpandableUserMessage 
                                                                                content={typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
                                                                                className="text-primary-foreground text-[15px]"
                                                                            />
                                                                            {/* Remove copy button on user messages; use context menu instead */}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            </ContextMenuTrigger>
                                                            <ContextMenuContent>
                                                                <ContextMenuItem onClick={() => copyToClipboard(typeof message.text === 'string' ? message.text : JSON.stringify(message.text), messageKey)}>Copy</ContextMenuItem>
                                                                <ContextMenuItem onClick={() => setDeletedMessageIds(prev => new Set(prev).add(messageKey))}>Delete</ContextMenuItem>
                                                            </ContextMenuContent>
                                                            </ContextMenu>
                                                        ) : (
                                                            <ContextMenu>
                                                            <ContextMenuTrigger asChild>
                                                            <div className="text-left min-w-0 group">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                                                        {message.name}
                                                                        {(() => {
                                                                            // Check if this is a bot message and if the previous user message contained math
                                                                            const previousMessage = index > 0 ? generalChat?.messages[index - 1] : null;
                                                                            const userAskedMathQuestion = previousMessage && 
                                                                                previousMessage.sender === 'user' && 
                                                                                isMathOrPhysicsContent(typeof previousMessage.text === 'string' ? previousMessage.text : JSON.stringify(previousMessage.text));
                                                                            
                                                                            // Only show math analysis if bot responded to a math question AND response contains math
                                                                            const shouldShowMathAnalysis = userAskedMathQuestion && 
                                                                                isMathOrPhysicsContent(typeof message.text === 'string' ? message.text : JSON.stringify(message.text));
                                                                            
                                                                            return shouldShowMathAnalysis ? (
                                                                                <InDepthAnalysis 
                                                                                    question={typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
                                                                                    conversationHistory={(generalChat?.messages || []).map(msg => ({
                                                                                        sender: msg.sender === 'system' ? 'bot' : msg.sender,
                                                                                        text: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)
                                                                                    }))}
                                                                                />
                                                                            ) : null;
                                                                        })()}
                                                                    </div>
                                                                    {message.timestamp && <MessageTimestamp timestamp={message.timestamp} />}
                                                                </div>
                                                                
                                                                {/* Show completed thought process if available */}
                                                                {(message as any).thinkingSteps && (message as any).thinkingSteps.length > 0 && (
                                                                    <div className="mb-2 -mt-1">
                                                                        <ThinkingProcess 
                                                                            status="complete"
                                                                            defaultOpen={false}
                                                                        />
                                                                    </div>
                                                                )}

                        <BotResponse 
                            content={typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}    
                                                                    className="text-[15px] ai-response leading-relaxed max-w-full overflow-hidden"
                            sources={message.sources}
                            isSearchRequest={(message as any).isSearchRequest || false}
                            messageId={message.id}
                            onSendMessage={async (msg) => {
                              // Use the same handleSendMessage logic but with the follow-up question text
                              // Set the input value and immediately trigger send
                              setInputValue(msg);
                              // Use requestAnimationFrame to ensure state is updated before sending
                              requestAnimationFrame(() => {
                                handleSendMessage(true);
                              });
                            }}
                            onFeedback={(feedback) => {
                              // Store feedback in localStorage
                              console.log('📊 Feedback callback triggered:', feedback);
                              try {
                                const existingFeedback = JSON.parse(localStorage.getItem('cc-ai-feedback') || '[]');
                                console.log('📊 Existing feedback:', existingFeedback);
                                const newFeedback = {
                                  ...feedback,
                                  chatId: currentTab,
                                  timestamp: Date.now()
                                };
                                existingFeedback.push(newFeedback);
                                localStorage.setItem('cc-ai-feedback', JSON.stringify(existingFeedback));
                                console.log('📊 Feedback saved successfully! Total count:', existingFeedback.length);
                                console.log('📊 Saved feedback data:', newFeedback);
                                
                                // Trigger custom event for real-time updates
                                window.dispatchEvent(new CustomEvent('feedbackAdded', { detail: newFeedback }));
                              } catch (e) {
                                console.error('❌ Failed to save feedback:', e);
                              }
                            }}
                                                                />
                                                            </div>
                                                            </ContextMenuTrigger>
                                                            <ContextMenuContent>
                                                                <ContextMenuItem onClick={() => copyToClipboard(typeof message.text === 'string' ? message.text : JSON.stringify(message.text), messageKey)}>Copy</ContextMenuItem>
                                                            </ContextMenuContent>
                                                            </ContextMenu>
                                                        )}
                                                                </div>
                                                            </div>
                                            );
                                                });
                                            })()}
                                            </>
                                            )}
                                            
                                            {/* Scroll target for auto-scroll */}
                                            <div ref={messagesEndRef} />
                                            
                                            {/* AI Thinking Animation - Integrated text (no bubble) */}
                                            {isLoading && generalChat?.messages?.at(-1)?.sender !== 'bot' && !streamingResponse && (
                                                <div className="flex gap-3 justify-start w-full px-4 animate-in slide-in-from-bottom-2 duration-300">
                                                    <div className="flex gap-4 max-w-[80%] min-w-0 flex-row">
                                                        {/* Avatar - show while thinking */}
                                                        <img src="/favicon-32x32.png" alt="AI" className="w-10 h-10 flex-shrink-0 object-contain rounded-full" />
                                                        <div className="text-left min-w-0 group">
                                                            {/* Name - show while thinking */}
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                                                    CourseConnect AI
                                                                </div>
                                                            </div>
                                                            <div className="mb-2 mt-1">
                                                                <ThinkingProcess 
                                                                    status="thinking"
                                                                    defaultOpen={true}
                                                                    customText={(() => {
                                                                        // Get the last user message to check if it's syllabus-related
                                                                        const lastUserMessage = generalChat?.messages?.filter(m => m.sender === 'user')?.at(-1);
                                                                        const messageText = typeof lastUserMessage?.text === 'string' ? lastUserMessage.text : JSON.stringify(lastUserMessage?.text || '');
                                                                        return isSyllabusQuestion(messageText) ? "checking your syllabus..." : undefined;
                                                                    })()}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Streaming Response - Show with full UI when complete */}
                                            {/* Only show if message doesn't exist in store yet (to avoid duplicates) */}
                                            {streamingResponse && !(() => {
                                                const currentChat = chats[currentTab || 'private-general-chat'];
                                                const lastMessage = currentChat?.messages?.[currentChat.messages.length - 1];
                                                // Hide streaming if we already have this message in the store
                                                return lastMessage && lastMessage.sender === 'bot' && lastMessage.id === streamingMessageId;
                                            })() && (
                                                <div className={`flex gap-3 justify-start w-full px-4 ${isStreamingComplete ? '' : 'animate-in slide-in-from-bottom-2 duration-300'}`}>
                                                    <div className="flex gap-4 max-w-[80%] min-w-0 flex-row">
                                                        {/* Avatar - always show during streaming */}
                                                        <img src="/favicon-32x32.png" alt="AI" className="w-10 h-10 flex-shrink-0 object-contain rounded-full" />
                                                        <div className="text-left min-w-0 group">
                                                            {/* Name and timestamp - always show during streaming */}
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                                                    CourseConnect AI
                                                                </div>
                                                                {isStreamingComplete && <MessageTimestamp timestamp={Date.now()} />}
                                                            </div>
                                                            {isStreamingComplete && (
                                                              <div className="mb-4">
                                                                <ThinkingProcess 
                                                                    status="complete"
                                                                    defaultOpen={false}
                                                                />
                                                              </div>
                                                            )}
                                                            {/* BotResponse with copy and feedback buttons */}
                                                            <BotResponse 
                                                                content={streamingResponse}
                                                                className="text-[15px] ai-response leading-relaxed max-w-full overflow-hidden"
                                                                messageId={streamingMessageId || undefined}
                                                                onFeedback={(feedback) => {
                                                                    console.log('📊 Feedback callback triggered:', feedback);
                                                                    try {
                                                                        const existingFeedback = JSON.parse(localStorage.getItem('cc-ai-feedback') || '[]');
                                                                        const newFeedback = [...existingFeedback, {
                                                                            ...feedback,
                                                                            chatId: currentTab,
                                                                            timestamp: Date.now()
                                                                        }];
                                                                        localStorage.setItem('cc-ai-feedback', JSON.stringify(newFeedback));
                                                                        window.dispatchEvent(new CustomEvent('feedbackAdded', { detail: newFeedback }));
                                                                    } catch (e) {
                                                                        console.error('❌ Failed to save feedback:', e);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Real-time typing indicator - compact design */}
                                            {pusherTypingUsers.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="flex gap-3 justify-start"
                                                >
                                                    <div className="flex gap-3 max-w-[90%] min-w-0 flex-row">
                                                        <Avatar className="w-6 h-6 flex-shrink-0">
                                                            <AvatarImage src="" />
                                                            <AvatarFallback className="bg-muted/50 text-muted-foreground text-xs">
                                                                <UserGroupIcon className="w-2.5 h-2.5" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <TypingIndicator users={pusherTypingUsers.filter(typingUser => typingUser.userId !== (user?.uid || 'guest'))} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                    
                                    {/* Floating Input Field */}
                                    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 pointer-events-auto px-4 flex justify-center">
                                        <div 
                                            id="chat-input"
                                            className={cn(
                                                "relative flex items-center gap-2 px-3 py-1.5 shadow-lg border-2 glassmorphism-input transition-all duration-300",
                                                "w-full max-w-full sm:max-w-[900px] sm:w-auto sm:min-w-[600px]",
                                                // Sentiment-based purple border for empathetic states (Agent Mode)
                                                sentimentAnalysis.sentiment !== 'neutral' && sentimentAnalysis.confidence > 0.1
                                                  ? "!border-purple-500 !dark:border-purple-400 !shadow-[0_0_20px_rgba(168,85,247,0.6)] !dark:shadow-[0_0_20px_rgba(192,132,252,0.6)] ring-4 ring-purple-500/30 dark:ring-purple-400/30"
                                                  : "border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 hover:shadow-xl"
                                            )}
                                            style={{ 
                                                borderRadius: '24px', 
                                                minHeight: '44px', 
                                                height: 'auto'
                                            }}
                                        >
                                            <div className="w-full">
                                                <EnhancedChatInput
                                            isClassChat={Boolean(currentTab && chats[currentTab!]?.chatType === 'class')}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                // Start typing indicator
                                                if (currentTab && e.target.value.length > 0) {
                                                    pusherStartTyping();
                                                } else if (currentTab) {
                                                    pusherStopTyping();
                                                }
                                            }}
                                            onSend={handleSendMessage}
                                            onSearchSelect={handleSearchSelect}
                                            onFileUpload={handleFileUpload}
                                            isSending={isLoading}
                                            onStop={() => {
                                                // Stop AI response for all chat types (General, Class, Public)
                                                console.log('🛑 Stop button clicked - aborting AI response');
                                                
                                                // Capture current streaming values before clearing
                                                const currentStreamingResponse = streamingResponse;
                                                const currentStreamingMessageId = streamingMessageId;
                                                
                                                if (abortControllerRef.current) {
                                                    abortControllerRef.current.abort();
                                                    abortControllerRef.current = null;
                                                }
                                                
                                                // Immediately stop loading and clear streaming state
                                                setIsLoading(false);
                                                setStreamingResponse("");
                                                setStreamingMessageId(null);
                                                
                                                // If there's a streaming message, finalize it with what we have
                                                if (currentStreamingResponse && currentStreamingMessageId && currentStreamingResponse.trim()) {
                                                    const finalMessage = {
                                                        id: currentStreamingMessageId,
                                                        text: currentStreamingResponse,
                                                        sender: 'bot' as const,
                                                        name: 'CourseConnect AI',
                                                        timestamp: Date.now(),
                                                        sources: undefined,
                                                        isSearchRequest: false
                                                    };
                                                    
                                                    // Add the partial message to chat
                                                    addMessage(currentTab || 'private-general-chat', finalMessage).catch(console.error);
                                                }
                                                
                                                console.log('✅ AI response stopped successfully');
                                            }}
                                            onFileProcessed={async (payload: any) => {
                                                // payload: { files: File[], text: string }
                                                const files: File[] = payload?.files || [];
                                                const userText = (payload?.text || inputValue || '').trim();
                                                if (files.length === 0) return;

                                                // Build one user message with a grid of attachments
                                                const attachments = await Promise.all(files.map(async (f) => ({
                                                    name: f.name,
                                                    size: f.size,
                                                    type: f.type,
                                                    url: URL.createObjectURL(f)
                                                })));

                                                const uploadMessage = {
                                                    id: generateMessageId(),
                                                    text: userText,
                                                    sender: 'user' as const,
                                                    name: isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous'),
                                                    timestamp: Date.now(),
                                                    files: attachments
                                                };

                                                setInputValue('');
                                                await addMessage(currentTab || 'private-general-chat', uploadMessage);

                                                // Analyze the first file with AI
                                                const first = files[0];
                                                if (first) {
                                                    setIsLoading(true);
                                                    
                                                    if (first.type.startsWith('image/')) {
                                                        // Handle image analysis with vision API
                                                        const reader = new FileReader();
                                                        reader.onload = async (e) => {
                                                            try {
                                                                const base64Image = e.target?.result as string;
                                                                const base64Data = base64Image.split(',')[1];
                                                                const analysisPrompt = userText || 'Please analyze this image. Extract any text (OCR), solve problems shown, or explain concepts in detail. Use LaTeX for math.';
                                                                await fetch('/api/chat/vision', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ message: analysisPrompt, image: base64Data, mimeType: first.type })
                                                                }).then(res => res.json()).then(async (data) => {
                                                                    const aiText = data?.answer || data?.response || 'I analyzed the image and extracted relevant information.';
                                                                    await addMessage(currentTab || 'private-general-chat', { id: generateMessageId(), text: aiText, sender: 'bot', name: 'CourseConnect AI', timestamp: Date.now() });
                                                                }).catch(async () => {
                                                                    await addMessage(currentTab || 'private-general-chat', { id: generateMessageId(), text: 'Failed to analyze the image. Please try again.', sender: 'bot', name: 'CourseConnect AI', timestamp: Date.now() });
                                                                }).finally(() => setIsLoading(false));
                                                            } catch {
                                                                setIsLoading(false);
                                                            }
                                                        };
                                                        reader.readAsDataURL(first);
                                                    } else {
                                                        // Handle any file type with appropriate analysis
                                                        try {
                                                            const fileType = first.type;
                                                            let analysisPrompt = userText;
                                                            
                                                            if (!analysisPrompt) {
                                                                // Generate appropriate prompt based on file type
                                                                if (fileType.includes('pdf')) {
                                                                    analysisPrompt = 'Analyze this PDF document and provide insights about its content, structure, and key information.';
                                                                } else if (fileType.includes('word') || fileType.includes('document')) {
                                                                    analysisPrompt = 'Analyze this Word document and provide insights about its content, structure, and key information.';
                                                                } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
                                                                    analysisPrompt = 'Analyze this Excel spreadsheet and provide insights about the data, structure, and key findings.';
                                                                } else if (fileType.includes('text') || fileType.includes('plain')) {
                                                                    analysisPrompt = 'Analyze this text file and provide insights about its content and key information.';
                                                                } else if (fileType.includes('json')) {
                                                                    analysisPrompt = 'Analyze this JSON file and provide insights about its structure, data, and key information.';
                                                                } else if (fileType.includes('csv')) {
                                                                    analysisPrompt = 'Analyze this CSV file and provide insights about the data, structure, and key findings.';
                                                                } else if (fileType.includes('zip') || fileType.includes('archive')) {
                                                                    analysisPrompt = 'I received an archive file. I can help you with questions about it, but I cannot directly analyze compressed files.';
                                                                } else {
                                                                    analysisPrompt = `Analyze this ${first.name} file (${fileType}) and provide insights about its content and purpose.`;
                                                                }
                                                            }
                                                            
                                                            // Try document analysis API for supported file types (PDF, DOCX, TXT)
                                                            if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') || fileType.includes('text') || fileType.includes('plain') || first.name.toLowerCase().endsWith('.pdf') || first.name.toLowerCase().endsWith('.docx') || first.name.toLowerCase().endsWith('.txt')) {
                                                                const formData = new FormData();
                                                                formData.append('file', first);
                                                                formData.append('prompt', analysisPrompt);
                                                                
                                                                // Add course data if this is a class chat
                                                                const currentChat = chats[currentTab || 'private-general-chat'];
                                                                const isClassChat = currentChat?.chatType === 'class';
                                                                if (isClassChat && currentChat?.courseData) {
                                                                    formData.append('courseData', JSON.stringify(currentChat.courseData));
                                                                }
                                                                
                                                                try {
                                                                    const response = await fetch('/api/ai/analyze-document', {
                                                                        method: 'POST',
                                                                        body: formData
                                                                    });
                                                                    
                                                                    if (!response.ok) {
                                                                        const errorText = await response.text().catch(() => 'Unknown error');
                                                                        let errorData;
                                                                        try {
                                                                            errorData = JSON.parse(errorText);
                                                                        } catch {
                                                                            errorData = { analysis: `I received your ${first.name} file. I'm processing it now - you can ask me questions about it!` };
                                                                        }
                                                                        const aiText = errorData?.analysis || `I received your ${first.name} file. I can help you with questions about it!`;
                                                                        await addMessage(currentTab || 'private-general-chat', { 
                                                                            id: generateMessageId(), 
                                                                            text: aiText, 
                                                                            sender: 'bot', 
                                                                            name: 'CourseConnect AI', 
                                                                            timestamp: Date.now() 
                                                                        });
                                                                        return;
                                                                    }
                                                                    
                                                                    const responseText = await response.text();
                                                                    if (!responseText || responseText.trim() === '') {
                                                                        throw new Error('Empty response from server');
                                                                    }
                                                                    
                                                                    let data;
                                                                    try {
                                                                        data = JSON.parse(responseText);
                                                                    } catch (parseError) {
                                                                        console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200));
                                                                        throw new Error('Invalid JSON response from server');
                                                                    }
                                                                    
                                                                    const aiText = data?.analysis || data?.response || `I analyzed the ${first.name} file.`;
                                                                    await addMessage(currentTab || 'private-general-chat', { 
                                                                        id: generateMessageId(), 
                                                                        text: aiText, 
                                                                        sender: 'bot', 
                                                                        name: 'CourseConnect AI', 
                                                                        timestamp: Date.now() 
                                                                    });
                                                                } catch (fetchError) {
                                                                    console.error('Document analysis fetch error:', fetchError);
                                                                    await addMessage(currentTab || 'private-general-chat', { 
                                                                        id: generateMessageId(), 
                                                                        text: `I received your ${first.name} file. I'm processing it now - you can ask me questions about it!`, 
                                                                        sender: 'bot', 
                                                                        name: 'CourseConnect AI', 
                                                                        timestamp: Date.now() 
                                                                    });
                                                                }
                                                            } else {
                                                                // For unsupported file types, provide a helpful message
                                                                await addMessage(currentTab || 'private-general-chat', { 
                                                                    id: generateMessageId(), 
                                                                    text: `I received your ${first.name} file (${fileType}). While I can't directly analyze this file type, I can help you with questions about it or assist with related topics!`, 
                                                                    sender: 'bot', 
                                                                    name: 'CourseConnect AI', 
                                                                    timestamp: Date.now() 
                                                                });
                                                            }
                                                        } catch (fileError) {
                                                            console.error('File processing error:', fileError);
                                                            await addMessage(currentTab || 'private-general-chat', { 
                                                                id: generateMessageId(), 
                                                                text: `I received your ${first.name} file. I'm processing it now - you can ask me questions about it!`, 
                                                                sender: 'bot', 
                                                                name: 'CourseConnect AI', 
                                                                timestamp: Date.now() 
                                                            });
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    }
                                                }
                                            }}
                                            placeholder={
                                                currentChat?.disabled 
                                                    ? "🚧 Community Chat coming soon! Use General Chat for AI help."
                                                    : currentChat?.chatType === 'class' 
                                                    ? `Ask anything about ${currentChat?.title || 'this course'}...`
                                                    : currentTab === 'private-general-chat'
                                                    ? 'Ask anything about your courses...'
                                                    : 'Chat with classmates or @ai for help...'
                                            }
                                            disabled={currentChat?.disabled || false}
                                            className="w-full"
                                            isPublicChat={currentTab === 'public-general-chat'}
                                            />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* AI Disclaimer */}
                                    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                            CourseConnect AI may make mistakes. Please verify important information.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        {/* Reset Chat Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateLeft01Icon className="h-5 w-5 text-orange-500" />
                        Reset Chat
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to reset this chat? This will clear all messages and conversation history. The AI will no longer remember previous questions or context from this conversation. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowResetDialog(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleResetChat}
                    >
                        Reset Chat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete Chat Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Delete01Icon className="h-5 w-5 text-destructive" />
                        Delete Chat
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to permanently delete this chat? This will remove all messages and conversation history. The AI will no longer remember any previous questions or context from this conversation. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteChat}
                    >
                        Delete Chat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* AI Summary Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Chat Summary
                    </DialogTitle>
                    <DialogDescription>
                        AI-generated summary of your conversation
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    {isGeneratingSummary ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                            <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin"></div>
                            <p className="text-sm text-muted-foreground">Generating summary...</p>
                        </div>
                    ) : chatSummary ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {chatSummary}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No summary available.</p>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowSummaryDialog(false)}
                    >
                        Close
                    </Button>
                    {chatSummary && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                navigator.clipboard.writeText(chatSummary);
                                setCopiedSummary(true);
                                setTimeout(() => setCopiedSummary(false), 2000);
                                toast.success("Copied", {
                                    description: "Summary copied to clipboard",
                                });
                            }}
                        >
                            {copiedSummary ? (
                                <>
                                    <CheckmarkCircle01Icon className="h-4 w-4 mr-2" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy01Icon className="h-4 w-4 mr-2" />
                                    Copy
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* Admin dashboard available at /dashboard/admin - for developers only */}
        </>
    );
}