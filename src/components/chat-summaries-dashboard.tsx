"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen, Loader2, ChevronRight, Check, Clock, TrendingUp, FileText, BarChart3, MoreHorizontal } from 'lucide-react';
import BotResponse from '@/components/bot-response';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/hooks/use-chat-store';
import { auth } from '@/lib/firebase/client-simple';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

interface ChatSummary {
  chatId: string;
  chatName: string;
  summary: string;
  messageCount: number;
  courseCode?: string;
}

export function ChatSummariesDashboard() {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ChatSummary | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { chats } = useChatStore();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const isFetchingRef = useRef(false);
  const lastChatsHashRef = useRef<string>('');
  const hasInitiallyFetchedRef = useRef(false);

  useEffect(() => {
    // Get user
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
      });
      return unsubscribe;
    } else {
      const guestUser = localStorage.getItem('guestUser');
      if (guestUser) {
        try {
          setUser(JSON.parse(guestUser));
        } catch (e) {
          setUser(null);
        }
      }
    }
  }, []);

  // Function to fetch summary for a single chat
  const fetchChatSummary = async (chat: any): Promise<ChatSummary | null> => {
    const messages = chat.messages || [];
    
    if (messages.length === 0) {
      return null;
    }

    // Add timeout to each request - reduced for faster feedback
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Limit message content to avoid huge payloads
      const recentMessages = messages.slice(-50); // Last 50 messages
      const chatContent = recentMessages
        .map((msg: any) => {
          const sender = msg.sender === 'user' ? 'You' : 'AI';
          const text = (msg.text || msg.content || '').substring(0, 500); // Limit message length
          return `${sender}: ${text}`;
        })
        .join('\n\n');

      // Set timeout
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Determine chat title for API - explicitly handle general chat
      const isGeneralChatForAPI = chat.id === 'private-general-chat';
      const chatTitle = isGeneralChatForAPI 
        ? 'General Chat'
        : (chat.courseData?.courseCode || chat.title || 'General Chat');

      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chat.id,
          chatTitle: chatTitle,
          messages: chatContent,
          courseData: chat.courseData,
          chatType: chat.chatType
        }),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Check if API returned an error
      if (!data.success || !data.summary) {
        return null;
      }
      
      // Determine chat name - explicitly handle general chat
      const isGeneralChat = chat.id === 'private-general-chat';
      const chatName = isGeneralChat 
        ? 'General Chat'
        : (chat.courseData?.courseCode || chat.title || 'General Chat');
      
      // Only return if we have a valid summary
      if (!data.summary || data.summary.trim().length === 0) {
        return null;
      }

      return {
        chatId: chat.id,
        chatName: chatName,
        summary: data.summary.trim(),
        messageCount: messages.length,
        courseCode: chat.courseData?.courseCode
      };
    } catch (error: any) {
      // Clear timeout in case of error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Silently handle AbortError (timeout or manual abort)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return null;
      }
      
      // Only log non-abort errors for debugging
      if (error && !error?.name?.includes('Abort')) {
        console.warn('Error fetching chat summary:', error);
      }
      
      return null;
    }
  };

  useEffect(() => {
    // Don't fetch if user isn't loaded yet
    if (!user && !localStorage.getItem('guestUser')) {
      return;
    }

    // Create a hash of chat IDs and message counts to detect actual changes
    const chatsHash = Object.keys(chats)
      .sort()
      .map(chatId => {
        const chat = chats[chatId];
        return `${chatId}:${(chat.messages || []).length}:${chat.messages?.[chat.messages.length - 1]?.timestamp || 0}`;
      })
      .join('|');

    // Skip if already fetching
    if (isFetchingRef.current) {
      return;
    }

    // Always allow initial fetch, but skip if chats haven't changed after that
    if (hasInitiallyFetchedRef.current && chatsHash === lastChatsHashRef.current) {
      // But ensure loading is off if we have summaries
      if (summaries.length > 0) {
        setIsLoading(false);
      }
      return;
    }

    // Update the hash
    lastChatsHashRef.current = chatsHash;

    const fetchSummaries = async () => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      
      setIsLoading(true);
      const classChats = Object.values(chats).filter((chat: any) => chat.chatType === 'class');
      const generalChat = chats['private-general-chat'];

      if (classChats.length === 0 && (!generalChat || (generalChat.messages || []).length === 0)) {
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      try {
        // Filter chats with messages and limit to most recent 5 chats (to make room for General Chat)
        const chatsWithMessages = classChats
          .filter((chat: any) => (chat.messages || []).length > 0)
          .sort((a: any, b: any) => {
            // Sort by most recent message
            const aLastMsg = a.messages?.[a.messages.length - 1]?.timestamp || 0;
            const bLastMsg = b.messages?.[b.messages.length - 1]?.timestamp || 0;
            return bLastMsg - aLastMsg;
          })
          .slice(0, 5); // Limit to 5 most recent chats (General Chat will be 6th)

        // Build list of all chats to fetch (General Chat first, then class chats)
        const chatsToFetch: any[] = [];
        if (generalChat && (generalChat.messages || []).length > 0) {
          chatsToFetch.push(generalChat);
        }
        chatsToFetch.push(...chatsWithMessages);

        // If no chats to fetch, clear loading immediately
        if (chatsToFetch.length === 0) {
          setIsLoading(false);
          isFetchingRef.current = false;
          return;
        }

        // Fetch summaries progressively - show results as they come in
        const allSummaries: ChatSummary[] = [];
        
        // Add overall timeout to prevent infinite loading (20 seconds total - reduced)
        const overallTimeout = setTimeout(() => {
          setIsLoading(false);
          isFetchingRef.current = false;
          // Show whatever summaries we have so far
          if (allSummaries.length > 0) {
            setSummaries(allSummaries);
          }
        }, 20000);
        
        try {
          // Process summaries one by one to show progressive loading
          for (let i = 0; i < chatsToFetch.length; i++) {
            const chat = chatsToFetch[i];
            
            try {
              const summary = await fetchChatSummary(chat);
              if (summary && summary.summary && summary.summary.trim().length > 0) {
                // Add to list maintaining order (General Chat first)
                const isGeneral = chat.id === 'private-general-chat';
                if (isGeneral) {
                  allSummaries.unshift(summary);
                } else {
                  allSummaries.push(summary);
                }
                
                // Update state immediately with partial results
                setSummaries([...allSummaries]);
                
                // Hide loading once we have at least one summary
                if (allSummaries.length === 1) {
                  setIsLoading(false);
                }
              }
            } catch (error) {
              // Skip failed summaries and continue
            }
          }
        } finally {
          // Always clear timeout and loading state
          clearTimeout(overallTimeout);
          setIsLoading(false);
          
          // Mark that we've done initial fetch
          hasInitiallyFetchedRef.current = true;
          
          // Final update with all summaries (even if empty)
          setSummaries(allSummaries);
        }
      } catch (err: any) {
        setIsLoading(false);
        isFetchingRef.current = false;
        hasInitiallyFetchedRef.current = true; // Mark as fetched even on error
        // Ensure we show empty state if there's an error
        setSummaries([]);
      } finally {
        // Double-check loading is off
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Debounce to avoid rapid successive calls
    const timer = setTimeout(fetchSummaries, 500);
    return () => clearTimeout(timer);
  }, [chats, user]);

  // Auto-update General Chat summary when messages change (no refresh needed)
  const lastGeneralChatMessageCountRef = useRef<number>(0);
  useEffect(() => {
    const generalChat = chats['private-general-chat'];
    if (!generalChat || (generalChat.messages || []).length === 0) {
      lastGeneralChatMessageCountRef.current = 0;
      return;
    }

    const currentMessageCount = (generalChat.messages || []).length;
    // Skip if message count hasn't changed
    if (currentMessageCount === lastGeneralChatMessageCountRef.current) {
      return;
    }

    lastGeneralChatMessageCountRef.current = currentMessageCount;

    // Debounce updates to avoid too frequent API calls
    const updateTimer = setTimeout(async () => {
      // Check if we're already fetching to avoid duplicate calls
      if (isFetchingRef.current) {
        return;
      }
      
      const newSummary = await fetchChatSummary(generalChat);
      if (newSummary) {
        setSummaries(prev => {
          // Only update if the summary actually changed
          const existing = prev.find(s => s.chatId === 'private-general-chat');
          if (existing && existing.messageCount === newSummary.messageCount) {
            return prev; // No change
          }
          // Update or add General Chat summary
          const otherSummaries = prev.filter(s => s.chatId !== 'private-general-chat');
          return [newSummary, ...otherSummaries];
        });
      }
    }, 2000); // Wait 2 seconds after last message change

    return () => clearTimeout(updateTimer);
  }, [chats['private-general-chat']?.messages?.length, chats['private-general-chat']?.messages?.[chats['private-general-chat']?.messages?.length - 1]?.timestamp]);

  // Show loading state with simple skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Recent Discussions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading summaries...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if empty
  if (summaries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Recent Discussions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-generated summaries of your chats
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {summaries.map((summary, idx) => {
            const isGeneralChat = summary.chatId === 'private-general-chat';
            // Get last message timestamp for recency
            const chat = chats[summary.chatId];
            const lastMessage = chat?.messages?.[chat.messages.length - 1];
            const lastMessageTime = lastMessage?.timestamp ? new Date(lastMessage.timestamp) : null;
            
            const getTimeAgo = (date: Date): string => {
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);
              
              if (diffMins < 60) return `${diffMins}m ago`;
              if (diffHours < 24) return `${diffHours}h ago`;
              return `${diffDays}d ago`;
            };
            
            // Enhanced visual design with varied gradients
            const styleConfig = isGeneralChat 
              ? { 
                  gradient: 'from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10', 
                  iconColor: 'text-purple-600 dark:text-purple-400', 
                  iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                  accentBorder: 'border-purple-200 dark:border-purple-800'
                }
              : { 
                  gradient: 'from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10', 
                  iconColor: 'text-blue-600 dark:text-blue-400', 
                  iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                  accentBorder: 'border-blue-200 dark:border-blue-800'
                };
            
            return (
              <motion.div
                key={summary.chatId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
              <Card 
                  className={`group relative overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col`}
                onClick={() => {
                  setSelectedSummary(summary);
                  setShowSummaryDialog(true);
                }}
              >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${isGeneralChat ? 'from-purple-500 to-indigo-500' : 'from-blue-500 to-cyan-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-start justify-between mb-1">
                      <div className={`p-2 rounded-xl ${styleConfig.iconBg} ${styleConfig.iconColor}`}>
                        {isGeneralChat ? <MessageSquare className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                    </div>
                    {lastMessageTime && (
                        <div className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(lastMessageTime)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-white truncate pr-2">
                        {summary.chatName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {summary.messageCount} messages
                  </CardDescription>
                    </div>
                </CardHeader>
                  
                  <CardContent className="relative flex-1 flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3 font-medium">
                          "{summary.summary}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        View Details
                      </span>
                      <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors ${styleConfig.iconColor}`}>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
              </CardContent>
            </Card>
              </motion.div>
          );
          })}
        </div>
      </div>

      {/* Summary Detail Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-800">
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold">
                {selectedSummary?.chatName}
            </DialogTitle>
            </div>
            <DialogDescription className="flex items-center gap-2 text-sm">
              {selectedSummary && (
                <>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedSummary.messageCount} messages</span>
                  <span>•</span>
                  <span>Generated by AI</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pt-6 pr-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 leading-relaxed text-sm text-gray-700 dark:text-gray-300">
                <BotResponse 
                  content={selectedSummary?.summary || ''} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <Button
              variant="outline"
              className="text-gray-500"
              onClick={() => setShowSummaryDialog(false)}
            >
              Close
            </Button>
                <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                  onClick={() => {
                    setShowSummaryDialog(false);
                if (selectedSummary) {
                    router.push(`/dashboard/chat?tab=${selectedSummary.chatId}`);
                }
                  }}
                >
              Continue Chat
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
