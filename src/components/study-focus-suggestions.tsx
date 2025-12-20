"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookOpen, Target, ArrowRight, Check, AlertCircle, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/hooks/use-chat-store';
import { auth } from '@/lib/firebase/client-simple';
import BotResponse from '@/components/bot-response';

interface StudySuggestion {
  title: string;
  description: string;
  course: string;
  actionUrl: string;
  type: 'topic' | 'assignment' | 'review' | 'focus';
  priority: 'high' | 'medium' | 'low';
  focusPoints?: string[];
  undiscussedTopics?: string[];
}

export function StudyFocusSuggestions() {
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<StudySuggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { chats } = useChatStore();
  const [user, setUser] = useState<any>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const router = useRouter();
  const isFetchingRef = useRef(false);
  const lastChatsHashRef = useRef<string>('');
  const getIcon = (type: StudySuggestion['type']) => {
    switch (type) {
      case 'assignment':
        return <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      case 'review':
        return <BookOpen className="w-5 h-5 text-purple-500 dark:text-purple-300" />;
      case 'focus':
        return <Target className="w-5 h-5 text-blue-500 dark:text-blue-300" />;
      case 'topic':
      default:
        return <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-300" />;
    }
  };

  useEffect(() => {
    if (auth && typeof (auth as any).onAuthStateChanged === 'function') {
      const unsubscribe = (auth as any).onAuthStateChanged((user: any) => {
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

  // Calculate total message count to detect changes
  const currentMessageCount = Object.values(chats).reduce((total: number, chat: any) => {
    return total + (chat.messages?.length || 0);
  }, 0);

  useEffect(() => {
    // Create a hash of chat IDs and message counts to detect actual changes
    const chatsHash = Object.keys(chats)
      .sort()
      .map(chatId => {
        const chat = chats[chatId];
        return `${chatId}:${(chat.messages || []).length}`;
      })
      .join('|');

    // Skip if already fetching or if chats haven't actually changed
    if (isFetchingRef.current || (chatsHash === lastChatsHashRef.current && currentMessageCount === lastMessageCount)) {
      return;
    }

    // Update the hash
    lastChatsHashRef.current = chatsHash;

    const fetchSuggestions = async () => {
      if (Object.keys(chats).length === 0) {
        setIsLoading(false);
        return;
      }

      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard/ai-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chats,
            userId: user?.uid || 'guest'
          }),
        }).catch((fetchError) => {
          // Handle network errors
          throw new Error('Network error: Unable to connect to server');
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }

        const data = await response.json().catch((parseError) => {
          throw new Error('Invalid response from server');
        });

        if (data.success && data.suggestions) {
          // Filter out study patterns and focus on chat-based suggestions
          const studySuggestions = data.suggestions
            .filter((s: any) => 
              s.type !== 'pattern' && // Remove study patterns
              (s.type === 'ai-recommendation' || 
               s.type === 'review' || 
               s.type === 'progression' ||
               s.type === 'topic' ||
               s.type === 'dependency')
            )
            .slice(0, 3) // Show top 3
            .map((s: any) => ({
              title: s.title,
              description: s.description,
              course: s.course || 'Course',
              actionUrl: s.actionUrl,
              type: s.type === 'review' ? 'review' : s.type === 'progression' ? 'topic' : 'focus',
              priority: s.priority || 'medium',
              focusPoints: s.focusPoints || [], // Add bullet points if available
              undiscussedTopics: s.undiscussedTopics || [] // Add undiscussed topics
            }));
          
          // Only update if suggestions actually changed
          setSuggestions(prev => {
            const prevHash = prev.map((s: StudySuggestion) => `${s.title}:${s.course}`).sort().join('|');
            const newHash = studySuggestions.map((s: StudySuggestion) => `${s.title}:${s.course}`).sort().join('|');
            if (prevHash === newHash) {
              return prev; // No change, return previous state
            }
            return studySuggestions;
          });
          setLastMessageCount(currentMessageCount);
        } else {
          // API returned success: false or no suggestions
          setSuggestions([]);
        }
      } catch (err: any) {
        // Silently fail - don't show error to user, just don't show suggestions
        setSuggestions([]);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Debounce to avoid rapid successive calls
    const timer = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [chats, user, currentMessageCount, lastMessageCount]);

  // Check if there are any class chats with syllabi uploaded
  const hasClassChats = Object.values(chats).some((chat: any) => 
    chat.chatType === 'class' && chat.courseData
  );

  // Don't show if no class chats with syllabi
  if (!hasClassChats) {
    return null;
  }

  // Don't show if empty or still loading - just return null (no skeleton)
  if (isLoading || suggestions.length === 0) {
    return null;
  }

  // Check if a topic has been discussed in any chat and get metadata
  const getTopicInfo = (topic: string): { discussed: boolean; lastDiscussed?: Date; frequency: number } => {
    if (!topic || topic.trim().length === 0) return { discussed: false, frequency: 0 };
    
    // Normalize topic name for matching (lowercase, remove extra spaces)
    const normalizedTopic = topic.toLowerCase().trim();
    const topicWords = normalizedTopic.split(/\s+/).filter(w => w.length > 2); // Filter out short words
    
    // Get all messages from all chats with timestamps
    const allMessages = Object.values(chats).flatMap((chat: any) => 
      (chat.messages || []).map((msg: any) => ({
        text: (msg.text || msg.content || '').toLowerCase(),
        timestamp: msg.timestamp || 0
      }))
    );
    
    let discussed = false;
    let lastDiscussed: Date | undefined;
    let frequency = 0;
    
    // Check if topic appears in any message
    for (const message of allMessages) {
      const messageText = message.text;
      let matches = false;
      
      // Check for exact topic match (case-insensitive)
      if (messageText.includes(normalizedTopic)) {
        matches = true;
      } else {
        // Check if significant words from topic appear in message
        const matchingWords = topicWords.filter(word => 
          messageText.includes(word) || 
          messageText.includes(word + 's') || // Handle plurals
          messageText.includes(word + 'es') ||
          messageText.includes(word + 'ing')
        );
        
        if (topicWords.length >= 3) {
          // For longer topics, require at least 60% word match
          if (matchingWords.length >= Math.ceil(topicWords.length * 0.6)) {
            matches = true;
          }
        } else if (topicWords.length >= 2) {
          // For shorter topics, require at least 2 words to match
          if (matchingWords.length >= 2) {
            matches = true;
          }
        } else if (topicWords.length === 1) {
          // Single word topics - check for exact match or close variations
          const word = topicWords[0];
          if (messageText.includes(word) && word.length > 4) {
            matches = true;
          }
        }
      }
      
      if (matches) {
        discussed = true;
        frequency++;
        const msgDate = new Date(message.timestamp);
        if (!lastDiscussed || msgDate > lastDiscussed) {
          lastDiscussed = msgDate;
        }
      }
    }
    
    return { discussed, lastDiscussed, frequency };
  };

  const isTopicDiscussed = (topic: string): boolean => {
    return getTopicInfo(topic).discussed;
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            AI Study Recommendations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalized focus areas based on your recent activity
          </p>
        </div>
        
        <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {suggestions.map((suggestion, idx) => {
            const styleConfig = [
              { 
                gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20', 
                border: 'border-amber-200 dark:border-amber-800', 
                text: 'text-amber-700 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-950/30'
              },
              { 
                gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20', 
                border: 'border-blue-200 dark:border-blue-800', 
                text: 'text-blue-700 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-950/30'
              },
              { 
                gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20', 
                border: 'border-emerald-200 dark:border-emerald-800', 
                text: 'text-emerald-700 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/30'
              }
            ][idx % 3];
            
            return (
            <div key={idx}>
              <Card 
                className={`relative overflow-hidden border ${styleConfig.border} bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full`}
                onClick={() => {
                  setSelectedSuggestion(suggestion);
                  setIsDialogOpen(true);
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${styleConfig.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                
                <CardHeader className="pb-3 flex-shrink-0 relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${styleConfig.text}`}>
                      {suggestion.type === 'review' ? 'Review' : suggestion.type === 'topic' ? 'Concept' : 'Focus'}
                    </span>
                    <div className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {suggestion.course}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {suggestion.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between relative z-10 pt-0">
                  <div className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                      {suggestion.description}
                    </p>
                    
                    {/* Interactive-looking focus points */}
                    {suggestion.focusPoints && suggestion.focusPoints.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {suggestion.focusPoints.slice(0, 2).map((point, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                            <div className={`w-1.5 h-1.5 rounded-full ${styleConfig.text.replace('text-', 'bg-')}`} />
                            <span className="line-clamp-1">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50 dark:border-gray-800/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {suggestion.course}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      Open Chat
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            );
          })}
        </div>
      </div>

      {/* Dialog for full suggestion details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-800">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                {selectedSuggestion && getIcon(selectedSuggestion.type)}
              </div>
              <span>{selectedSuggestion?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-blue-600 dark:text-blue-400">
              {selectedSuggestion?.course}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedSuggestion?.description}
              </p>
            </div>
            
            {/* Full bullet points list - compact */}
            {selectedSuggestion?.focusPoints && selectedSuggestion.focusPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Key Objectives
                </h4>
                <div className="space-y-2">
                  {selectedSuggestion.focusPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {point}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Clickable undiscussed topics - compact */}
            {selectedSuggestion?.undiscussedTopics && selectedSuggestion.undiscussedTopics.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Topics to Cover
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSuggestion.undiscussedTopics.map((topic, idx) => {
                    // Extract chatId from actionUrl
                    const chatIdMatch = selectedSuggestion.actionUrl.match(/tab=([^&]+)/);
                    const chatId = chatIdMatch ? chatIdMatch[1] : '';
                    const topicQuestion = `Help me understand ${topic}`;
                    const topicUrl = `/dashboard/chat?tab=${chatId}&prefill=${encodeURIComponent(topicQuestion)}`;
                    
                    const topicInfo = getTopicInfo(topic);
                    const discussed = topicInfo.discussed;
                    
                    return (
                      <button
                        key={idx}
                        className={`
                          relative group px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                          ${discussed 
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" 
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                          }
                        `}
                        onClick={() => {
                          setIsDialogOpen(false);
                          router.push(topicUrl);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          {discussed ? <Check className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500" />}
                          <span className="truncate max-w-[120px]">{topic}</span>
                          {topicInfo.frequency > 1 && (
                            <span className="text-[10px] opacity-60">x{topicInfo.frequency}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 rounded-xl px-6"
              onClick={() => {
                if (selectedSuggestion) {
                  if (selectedSuggestion.actionUrl.startsWith('/')) {
                    router.push(selectedSuggestion.actionUrl);
                  } else {
                    window.location.href = selectedSuggestion.actionUrl;
                  }
                  setIsDialogOpen(false);
                }
              }}
            >
              Start Session
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
