"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Cancel01Icon,
  Chatting01Icon,
  UserGroupIcon,
  Brain01Icon,
  SparklesIcon,
  Calendar01Icon,
  Award01Icon,
  GraduationScrollIcon,
  AnalyticsUpIcon,
  ChartBarLineIcon
} from "hugeicons-react";

interface WelcomeCardProps {
  chatType: 'general' | 'community' | 'class';
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
  onDismiss?: () => void;
  onQuickAction?: (action: string) => void;
}

export function WelcomeCard({ chatType, courseData, onDismiss, onQuickAction }: WelcomeCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleQuickAction = (action: string) => {
    onQuickAction?.(action);
  };

  const isGeneral = chatType === 'general';
  const isCommunity = chatType === 'community';
  const isClass = chatType === 'class';

  // Generate dynamic content based on chat type and course data
  const getWelcomeContent = () => {
    if (isClass && courseData) {
      const courseName = courseData.courseName || courseData.courseCode || 'this course';
      const professor = courseData.professor ? ` with ${courseData.professor}` : '';
      
      return {
        title: `Welcome to ${courseName}! 🎓`,
        description: `I'm your AI assistant for ${courseName}${professor}. I know your syllabus and can help with assignments, exams, and course topics.`,
        icon: GraduationScrollIcon,
        iconColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      };
    } else if (isCommunity) {
      return {
        title: "Welcome to Community Chat! 👥",
        description: "Connect with fellow students, share knowledge, and study together.",
        icon: UserGroupIcon,
        iconColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      };
    } else {
      return {
        title: "Welcome to General Chat! 👋",
        description: "I'm your personal AI assistant, ready to help with any academic questions.",
        icon: Brain01Icon,
        iconColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      };
    }
  };

  const getQuickActions = () => {
    if (isClass && courseData) {
      const courseName = courseData.courseName || courseData.courseCode || 'this course';
      const topics = courseData.topics || [];
      const assignments = courseData.assignments || [];
      const exams = courseData.exams || [];
      
      // Generate course-specific actions
      const actions = [];
      
      // Study help with course context
      if (topics.length > 0) {
        actions.push({
          icon: GraduationScrollIcon,
          label: "Study Help",
          action: `help me understand ${topics[0]} in ${courseName}`
        });
      } else {
        actions.push({
          icon: GraduationScrollIcon,
          label: "Study Help",
          action: `help me study for ${courseName}`
        });
      }
      
      // Exam prep if there are exams
      if (exams.length > 0) {
        const nextExam = exams[0];
        actions.push({
          icon: Award01Icon,
          label: "Exam Prep",
          action: `help me prepare for ${nextExam.name} in ${courseName}`
        });
      } else {
        actions.push({
          icon: Award01Icon,
          label: "Exam Prep",
          action: `help me prepare for exams in ${courseName}`
        });
      }
      
      // Assignment help if there are assignments
      if (assignments.length > 0) {
        const nextAssignment = assignments[0];
        actions.push({
          icon: Calendar01Icon,
          label: "Assignment Help",
          action: `help me with ${nextAssignment.name} in ${courseName}`
        });
      } else {
        actions.push({
          icon: SparklesIcon,
          label: "Ask AI",
          action: `help me with ${courseName}`
        });
      }
      
      // Add chart action only for courses that actually need it
      const courseCodeLower = (courseData.courseCode || '').toLowerCase();
      const courseNameLower = courseName.toLowerCase();
      const departmentLower = (courseData.department || '').toLowerCase();
      
      // Check if course is math/statistics/economics/data science related
      const isMathRelated = courseCodeLower.startsWith('math') || 
                           courseCodeLower.startsWith('stat') ||
                           courseCodeLower.startsWith('econ') ||
                           courseNameLower.includes('calculus') ||
                           courseNameLower.includes('algebra') ||
                           courseNameLower.includes('statistics') ||
                           courseNameLower.includes('econometrics') ||
                           departmentLower.includes('mathematics') ||
                           departmentLower.includes('statistics') ||
                           departmentLower.includes('economics');
      
      // Check if topics suggest graphing/charting is needed
      const hasGraphRelatedTopics = topics.some(t => {
        const topicLower = t.toLowerCase();
        return topicLower.includes('function') || 
               topicLower.includes('graph') || 
               topicLower.includes('derivative') ||
               topicLower.includes('integral') ||
               topicLower.includes('plot') ||
               topicLower.includes('chart') ||
               topicLower.includes('data visualization') ||
               topicLower.includes('regression') ||
               topicLower.includes('correlation');
      });
      
      // Only show chart button if it's actually relevant
      if (isMathRelated || hasGraphRelatedTopics) {
        // Determine specific label and action based on course type
        let chartLabel = "Create Chart";
        let chartAction = "help me create a graph";
        
        // Try to use actual course topics for more relevant examples
        const derivativeTopic = topics.find(t => t.toLowerCase().includes('derivative'));
        const functionTopic = topics.find(t => t.toLowerCase().includes('function'));
        const dataTopic = topics.find(t => t.toLowerCase().includes('data') || t.toLowerCase().includes('statistic'));
        
        if (courseNameLower.includes('calculus') || derivativeTopic) {
          chartLabel = "Graph Functions";
          if (functionTopic) {
            chartAction = `graph a function related to ${functionTopic}`;
          } else if (derivativeTopic) {
            chartAction = `help me visualize ${derivativeTopic}`;
          } else {
            chartAction = "help me graph a function";
          }
        } else if (courseNameLower.includes('statistics') || courseCodeLower.startsWith('stat') || dataTopic) {
          chartLabel = "Visualize Data";
          if (dataTopic) {
            chartAction = `create a chart for ${dataTopic}`;
          } else {
            chartAction = "help me visualize data";
          }
        } else if (courseNameLower.includes('economics') || courseCodeLower.startsWith('econ')) {
          chartLabel = "Plot Data";
          chartAction = "help me create a chart for economic analysis";
        } else if (hasGraphRelatedTopics) {
          chartLabel = "Create Graph";
          const graphTopic = topics.find(t => {
            const tLower = t.toLowerCase();
            return tLower.includes('function') || tLower.includes('graph') || tLower.includes('plot');
          });
          if (graphTopic) {
            chartAction = `help me graph ${graphTopic}`;
          } else {
            chartAction = "help me create a graph";
          }
        }
        
        actions.push({
          icon: AnalyticsUpIcon,
          label: chartLabel,
          action: chartAction
        });
      }
      
      return actions;
    } else if (isCommunity) {
      return [
        { icon: UserGroupIcon, label: "Say Hi", action: "Hello everyone!" },
        { icon: Chatting01Icon, label: "Ask Question", action: "Can someone help me with..." },
        { icon: Brain01Icon, label: "Get AI Help", action: "@ai help me with" }
      ];
    } else {
      return [
        { icon: SparklesIcon, label: "Ask AI", action: "help me understand calculus" },
        { icon: GraduationScrollIcon, label: "Study Help", action: "explain photosynthesis" },
        { icon: AnalyticsUpIcon, label: "Create Chart", action: "graph y = x²" },
        { icon: ChartBarLineIcon, label: "Visualize Data", action: "create a bar chart showing: Math 85, Science 90, English 78" }
      ];
    }
  };

  const welcomeContent = getWelcomeContent();
  const quickActions = getQuickActions();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-4"
        >
          <div className="relative bg-muted/30 dark:bg-muted/20 rounded-lg p-4 border border-border/30">
            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted/50"
            >
              <Cancel01Icon className="h-3 w-3" />
            </Button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-md ${welcomeContent.iconColor}`}>
                {welcomeContent.icon ? (
                  React.createElement(welcomeContent.icon, { className: "h-4 w-4" })
                ) : null}
              </div>
              <h3 className="text-sm font-semibold">
                {welcomeContent.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-3">
              {welcomeContent.description}
              {!isCommunity && (
                <span className="block mt-1 text-muted-foreground/80">
                  💡 I can also create interactive charts and graphs!
                </span>
              )}
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.action)}
                    className="h-7 px-3 text-xs hover:bg-primary/10 hover:border-primary/20"
                  >
                    {action.icon ? (
                      React.createElement(action.icon, { className: "h-3 w-3 mr-1" })
                    ) : null}
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Hint */}
            <p className="text-xs text-muted-foreground/70 mt-2">
              {isClass 
                ? "Or just type your question about this course below!"
                : isCommunity 
                ? "Type @ai for AI help, or start chatting!"
                : "Or just type your question below!"
              }
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
