"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Settings, 
  RotateCcw, 
  Copy, 
  Check,
  Brain,
  User,
  Bot
} from "lucide-react";
import { useChatStore } from "@/hooks/use-chat-store";
import { toast } from "sonner";
import { AIResponse } from '@/components/ai-response';
import { TypingIndicator } from "@/components/typing-indicator";

interface FullPageChatProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  courseTitle?: string;
}

export function FullPageChat({ isOpen, onClose, courseId, courseTitle }: FullPageChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { 
    chats, 
    currentTab, 
    setCurrentTab, 
    sendMessage, 
    resetChat, 
    user 
  } = useChatStore();

  // Use course-specific chat or fallback to general chat
  const chatId = courseId || currentTab || 'private-general-chat';
  const currentChat = chats[chatId];

  // Set the current tab when opening with a course
  useEffect(() => {
    if (isOpen && courseId && courseId !== currentTab) {
      setCurrentTab(courseId);
    }
  }, [isOpen, courseId, currentTab, setCurrentTab]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && currentChat?.messages) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTo({ 
            top: viewport.scrollHeight, 
            behavior: 'smooth' 
          });
        });
      }
    }
  }, [currentChat?.messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      await sendMessage(messageText, chatId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Copied!", {
        description: "Message copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleResetChat = async () => {
    try {
      await resetChat(chatId);
      toast.success("Chat Reset", {
        description: "Conversation history has been cleared",
      });
    } catch (error) {
      console.error('Error resetting chat:', error);
      toast.error("Failed to reset chat", {
        description: "Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className={`absolute inset-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
            isMinimized ? 'h-20' : 'h-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {courseTitle ? `${courseTitle} - AI Chat` : 'AI Assistant'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentChat?.messages?.length || 0} messages
                  </p>
                </div>
              </div>
              {courseId && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Course Chat
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetChat}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-600 dark:text-gray-400"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full">
                  <div className="p-4 space-y-4">
                    {currentChat?.messages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Brain className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-gray-500 dark:text-gray-500 max-w-md">
                          Ask me anything about {courseTitle ? 'this course' : 'your studies'}. 
                          I can help with homework, explain concepts, or answer questions.
                        </p>
                      </div>
                    ) : (
                      currentChat?.messages?.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.sender === 'ai' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                            <Card className={`${
                              message.sender === 'user' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    {message.sender === 'ai' ? (
                                      <AIResponse 
                                        text={message.text} 
                                        isLoading={false}
                                        showCopyButton={false}
                                      />
                                    ) : (
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.text}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(message.text, message.id)}
                                    className={`h-6 w-6 p-0 ${
                                      message.sender === 'user' 
                                        ? 'text-white/70 hover:text-white hover:bg-white/20' 
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                  >
                                    {copiedMessageId === message.id ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                              {message.name} • {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>

                          {message.sender === 'user' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={user?.photoURL || undefined} />
                              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      ))
                    )}
                    
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardContent className="p-3">
                            <TypingIndicator />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    onKeyPress={handleKeyPress}
                    placeholder={
                      courseTitle 
                        ? `Ask anything about ${courseTitle}...`
                        : "Ask me anything about your studies..."
                    }
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

