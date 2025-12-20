"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight01Icon } from "hugeicons-react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  FolderUploadIcon,
  CommandIcon,
  CheckmarkCircle01Icon,
  Chatting01Icon,
  FlashIcon,
  ChartBarLineIcon,
  SparklesIcon
} from "hugeicons-react";
import { useChatStore } from "@/hooks/use-chat-store";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actions: string[];
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "welcome",
    title: "Welcome to CourseConnect AI",
    description: "Your AI-powered study companion that helps you excel in every course.",
    icon: <img src="/apple-touch-icon.png" alt="CourseConnect" className="size-8" style={{ imageRendering: 'high-quality' }} />,
    actions: [
      "Upload your course syllabi to get personalized AI tutoring",
      "Ask questions and get instant help with homework",
      "Generate practice quizzes and flashcards automatically",
      "Track all assignments and deadlines in one place"
    ],
    color: "blue"
  },
  {
    id: "command-menu",
    title: "Navigate with Speed",
    description: "Press ⌘K (Mac) or Ctrl+K (Windows) from anywhere to open the command menu.",
    icon: <CommandIcon className="size-8" />,
    actions: [
      "Instantly jump between your courses and chats",
      "Quickly navigate to upload, flashcards, or settings",
      "Search and access all features without using your mouse"
    ],
    color: "purple"
  },
  {
    id: "upload",
    title: "Upload & Organize",
    description: "Upload your course documents and let AI extract all the important information automatically.",
    icon: <FolderUploadIcon className="size-8" />,
    actions: [
      "Drag and drop PDF, DOCX, or image files of your syllabus",
      "AI automatically extracts course name, professor, topics, and deadlines",
      "Your course chat is created instantly with all the information organized"
    ],
    color: "cyan"
  },
  {
    id: "ai-tutor",
    title: "Your Personal AI Tutor",
    description: "Get instant help tailored to your specific courses. The AI knows your syllabus and can answer course-specific questions.",
    icon: <Chatting01Icon className="size-8" />,
    actions: [
      "Ask course-specific questions like 'When is my next exam?' or 'What topics are covered?'",
      "Get step-by-step help with homework problems in any subject",
      "Request explanations of concepts in simple terms or detailed summaries"
    ],
    color: "pink"
  },
  {
    id: "interactive-learning",
    title: "Practice & Test",
    description: "Reinforce your knowledge with AI-generated study materials based on your course content.",
    icon: <FlashIcon className="size-8" />,
    actions: [
      "Ask the AI to 'quiz me on a topic' for instant 5-question quizzes",
      "Generate flashcards automatically from your course chat history",
      "Study with interactive flashcards to test your knowledge and track progress"
    ],
    color: "amber"
  },
  {
    id: "analytics",
    title: "Track Your Progress",
    description: "Monitor your study habits and see your progress across all courses in one dashboard.",
    icon: <ChartBarLineIcon className="size-8" />,
    actions: [
      "View your daily study streak and total time spent learning",
      "Track how many assignments you've completed across all courses",
      "See upcoming deadlines and stay on top of your workload"
    ],
    color: "emerald"
  },
  {
    id: "complete",
    title: "You're All Set",
    description: "You're ready to succeed! Upload your first syllabus and start learning with AI-powered tools designed to help you excel.",
    icon: <CheckmarkCircle01Icon className="size-8" />,
    actions: [
      "Go to Upload to add your first course syllabus",
      "Visit your Dashboard to see all your courses",
      "Start a chat with your AI tutor to ask your first question"
    ],
    color: "green"
  }
];

interface OnboardingSlideshowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingSlideshow({ isOpen, onClose, onComplete }: OnboardingSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { activateTrial } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true');
    
    try {
      const guestUserData = localStorage.getItem('guestUser');
      if (guestUserData) {
        const guestUser = JSON.parse(guestUserData);
        if (guestUser.isGuest || guestUser.isAnonymous) {
          localStorage.setItem('guest-onboarding-completed', 'true');
        }
      }
    } catch (error) {
      console.warn('Error checking guest status for onboarding:', error);
    }
    
    activateTrial();
    handleClose();
    onComplete();
  }, [activateTrial, handleClose, onComplete]);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentSlide, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, handleClose]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const colorClasses = {
    blue: "bg-blue-500 text-blue-500",
    purple: "bg-purple-500 text-purple-500",
    cyan: "bg-cyan-500 text-cyan-500",
    pink: "bg-pink-500 text-pink-500",
    amber: "bg-amber-500 text-amber-500",
    emerald: "bg-emerald-500 text-emerald-500",
    green: "bg-green-500 text-green-500"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden border shadow-xl bg-white dark:bg-zinc-900">
              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Step {currentSlide + 1} of {slides.length}
                    </div>
                    <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full rounded-full", colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[0])}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                  >
                    <Cancel01Icon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="space-y-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Icon & Title */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[0] + "/10"
                        )}>
                          <div className={cn(colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[1])}>
                            {currentSlideData.icon}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                            {currentSlideData.title}
                          </h2>
                          <p className="text-muted-foreground mt-1">
                            {currentSlideData.description}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {currentSlideData.actions.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 text-foreground/80"
                          >
                            <CheckmarkCircle01Icon className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[1]
                            )} />
                            <span className="leading-relaxed">{action}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentSlide === 0}
                    className={currentSlide === 0 ? "invisible" : ""}
                  >
                    <ArrowLeft01Icon className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-1.5">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-200",
                          index === currentSlide 
                            ? cn("w-8", colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[0])
                            : "w-1.5 bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleNext}
                    className={cn(
                      "min-w-[120px]",
                      colorClasses[currentSlideData.color as keyof typeof colorClasses].split(" ")[0],
                      "text-white hover:opacity-90"
                    )}
                  >
                    {currentSlide === slides.length - 1 ? (
                      <span className="flex items-center">
                        Get Started
                        <ArrowRight01Icon className="ml-2 h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Next
                        <ArrowRight01Icon className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
