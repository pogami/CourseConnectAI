"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedChat, SharedChat } from "@/lib/share-service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, Calendar, User, Bot, ArrowRight, Copy, Check, Sparkles, Share2 } from "lucide-react";
import BotResponse from "@/components/bot-response";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CourseConnectLogo } from "@/components/icons/courseconnect-logo";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CCLogo } from "@/components/icons/cc-logo";
import { ExpandableUserMessage } from "@/components/expandable-user-message";
import { MessageTimestamp } from "@/components/message-timestamp";
import { ClientThemeToggle } from "@/components/client-theme-toggle";

export default function SharedChatPage() {
  const params = useParams();
  const id = params?.id as string;
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling past 400px (past the header and metadata section)
      setShowCTA(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchChat = async () => {
      if (id) {
        try {
          const data = await getSharedChat(id);
          setChat(data);
        } catch (error) {
          console.error("Error fetching chat:", error);
        }
      }
      // Add a minimum delay to ensure loading screen is visible
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };
    fetchChat();
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Share this conversation with anyone!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the URL from your browser address bar.",
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
          {/* Static logo – no movement */}
          <CCLogo className="h-20 w-auto md:h-24" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
          >
            CourseConnect <span className="text-blue-600 dark:text-blue-400">AI</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Conversation Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The shared conversation link might be invalid, expired, or has been deleted by the owner.
        </p>
        <Link href="/">
          <Button size="lg" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            Go to CourseConnect
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background Effects from Homepage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base dotted grid */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.3
        }} />
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-gray-950/50" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-transparent dark:border-border/40 bg-transparent dark:bg-gray-950/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 relative transition-transform group-hover:scale-110 duration-300">
              <CourseConnectLogo className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
            </span>
          </Link>
          
          <div className="flex-1 text-center px-4 hidden sm:block bg-transparent">
            <span className="text-sm text-muted-foreground bg-transparent">
              Get instant AI help, analyze your syllabus, and ace every course
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <ClientThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
            <Link href="/signup">
              <Button size="sm" className="font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2">
                Sign Up Free
                <ArrowRight className="w-4 h-4 opacity-50" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 pb-32">
          
          {/* Chat Metadata */}
          <div className="text-center mb-12 space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white"
            >
              {chat.title}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 dark:bg-gray-900/50 border border-border/50 backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5" />
                {format(chat.createdAt, 'MMMM do, yyyy')}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 dark:bg-gray-900/50 border border-border/50 backdrop-blur-sm">
                <MessageSquare className="w-3.5 h-3.5" />
                {chat.messages.length} messages
              </div>
            </motion.div>
          </div>

          {/* Messages */}
          <div className="space-y-8">
            {chat.messages.map((msg, index) => {
              // Improve old welcome messages if they contain the old text
              let messageText = msg.text;
              if (msg.sender === 'bot' && msg.text.includes('all-in-one AI assistant for ALL your courses')) {
                messageText = msg.text
                  .replace(/I'm your all-in-one AI assistant for ALL your courses\./g, "I'm your AI study assistant, here to help you succeed across all your courses.")
                  .replace(/I have access to all (\d+) of your course (syllabus|syllabi), so I can help with any of your classes!/g, (match, count, word) => {
                    const num = parseInt(count);
                    return num === 1 
                      ? "I have access to your course syllabus, so I can provide personalized help for your classes!"
                      : `I have access to all ${num} of your course syllabi, so I can provide personalized help for your classes!`;
                  })
                  .replace(/I can help with:/g, "I can help you with:")
                  .replace(/• Any question from any of your classes/g, "• Questions from any of your classes")
                  .replace(/• Study strategies and explanations/g, "• Study strategies and concept explanations")
                  .replace(/Just ask me anything about any of your classes! 🚀/g, "What would you like to work on today? 🚀");
              }
              
              return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full px-4`}
              >
                <div className={`flex gap-4 ${msg.sender === 'user' ? 'max-w-[85%]' : 'max-w-[85%]'} min-w-0 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {msg.sender === 'bot' ? (
                    <img src="/favicon-32x32.png" alt="CourseConnect AI" className="w-10 h-10 flex-shrink-0 object-contain rounded-full" />
                  ) : (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      {(msg as any).photoURL ? (
                        <AvatarImage src={(msg as any).photoURL} />
                      ) : null}
                      <AvatarFallback className="text-sm font-medium">
                        {msg.name ? msg.name[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Content */}
                  <div className={`${msg.sender === 'user' ? 'text-right' : 'text-left'} min-w-0 w-full group`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {msg.sender === 'user' ? msg.name : (
                          <>CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span></>
                        )}
                      </div>
                      <MessageTimestamp timestamp={msg.timestamp} />
                    </div>
                    
                    {msg.sender === 'user' ? (
                      <div className="flex flex-col items-end gap-2">
                        <div className="relative inline-block bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-full overflow-hidden user-message-bubble shadow-md text-[15px]">
                          <ExpandableUserMessage 
                            content={msg.text}
                            className="text-primary-foreground text-[15px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
                        <BotResponse 
                          content={messageText}
                          className="text-[15px] ai-response leading-relaxed max-w-full overflow-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
            })}
          </div>
        </div>
      </main>

      {/* Floating CTA Bar - Top (appears after scroll) */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 border-b border-transparent dark:border-border/40 bg-transparent dark:bg-gray-950"
          >
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 relative">
                  <CourseConnectLogo className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                  CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
                </span>
              </div>
              
              <div className="flex-1 text-center px-4 hidden sm:block bg-transparent">
                <span className="text-sm text-muted-foreground bg-transparent">
                  Get instant AI help, analyze your syllabus, and ace every course
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <ClientThemeToggle />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Copied!" : "Share"}
                </Button>
                <Link href="/signup">
                  <Button size="sm" className="font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2">
                    Sign Up Free
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

