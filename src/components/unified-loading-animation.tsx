"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RippleText } from './ripple-text';
import { MessageSquare, Users, BookOpen, Sparkles } from 'lucide-react';
import { CCLogo } from '@/components/icons/cc-logo';

type LoadingMode = 'fullscreen' | 'inline' | 'transition';

interface UnifiedLoadingAnimationProps {
  mode?: LoadingMode;
  className?: string;
  title?: string;
  fromPage?: string;
  toPage?: string;
  showProgress?: boolean;
  text?: string;
}

export function UnifiedLoadingAnimation({ 
  mode = 'inline',
  className = "", 
  title = "Class Chat",
  fromPage = "Dashboard",
  toPage = "Class Chat",
  showProgress = true,
  text = "Loading..."
}: UnifiedLoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: MessageSquare, text: "Connecting to chat...", color: "text-blue-500" },
    { icon: Users, text: "Loading classmates...", color: "text-green-500" },
    { icon: BookOpen, text: "Preparing course materials...", color: "text-purple-500" },
    { icon: Sparkles, text: "Initializing AI assistant...", color: "text-yellow-500" }
  ];

  useEffect(() => {
    if (mode === 'fullscreen' || mode === 'transition') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (mode === 'transition' ? 3 : 2);
        });
      }, mode === 'transition' ? 30 : 50);

      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'fullscreen') {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 800);

      return () => clearInterval(stepInterval);
    }
  }, [mode, steps.length]);

  // Inline mode - simple and compact
  if (mode === 'inline') {
    return (
      <div className={`flex items-center space-x-2 p-4 ${className}`}>
        <div className="flex space-x-1">
          <RippleText
            text={text}
            className="text-sm text-muted-foreground"
          />
        </div>
      </div>
    );
  }

  // Transition mode - page transition animation
  if (mode === 'transition') {
    return (
      <div className={`fixed inset-0 z-50 bg-white dark:bg-gray-950 flex items-center justify-center ${className}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
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

  // Fullscreen mode - complete loading experience
  return (
    <div className={`fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
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

// Convenience exports for backward compatibility
export const ChatLoadingAnimation = (props: Omit<UnifiedLoadingAnimationProps, 'mode'>) => (
  <UnifiedLoadingAnimation {...props} mode="fullscreen" />
);

export const MessageLoadingAnimation = (props: Omit<UnifiedLoadingAnimationProps, 'mode'>) => (
  <UnifiedLoadingAnimation {...props} mode="inline" />
);

export const ChatTransitionLoader = (props: Omit<UnifiedLoadingAnimationProps, 'mode'>) => (
  <UnifiedLoadingAnimation {...props} mode="transition" />
);
