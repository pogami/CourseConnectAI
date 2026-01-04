"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/hooks/use-chat-store';
import {
  Sun01Icon,
  Moon01Icon,
  Coffee01Icon,
  Calendar01Icon,
  AnalyticsUpIcon,
  Award01Icon,
  AlertCircleIcon
} from 'hugeicons-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DailyBriefingProps {
  user: any;
  stats: any;
}

interface TaskItem {
  type: 'assignment' | 'exam';
  name: string;
  date: Date;
  course: string;
  courseCode: string;
  chatId: string;
  weight?: number;
  status?: string;
}

interface NudgeSuggestion {
  type: 'opportunity' | 'warning' | 'tip';
  message: string;
  actionText?: string;
  actionHref?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TriageMode {
  isActive: boolean;
  week: string;
  tasks: TaskItem[];
  suggestion: string;
}

export function DailyBriefing({ user, stats }: DailyBriefingProps) {
  const { chats } = useChatStore();
  const [greeting, setGreeting] = useState('');
  const [focusItem, setFocusItem] = useState<{ type: 'assignment' | 'exam' | 'free'; name: string; date: Date; course: string } | null>(null);
  const [nudge, setNudge] = useState<NudgeSuggestion | null>(null);
  const [triageMode, setTriageMode] = useState<TriageMode | null>(null);
  const [showTriageDialog, setShowTriageDialog] = useState(false);
  const [userName, setUserName] = useState<string>('Student');

  // Collect all tasks for analysis
  const allTasks = useMemo(() => {
    const tasks: TaskItem[] = [];
    const now = new Date();

    Object.values(chats).forEach((chat: any) => {
      if (chat.chatType !== 'class' || !chat.courseData) return;
      const courseCode = chat.courseData.courseCode || chat.title;
      const courseName = chat.courseData.courseName || courseCode;

      // Assignments
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (!a?.dueDate || a?.dueDate === 'null') return;
        // Include completed tasks for nudge generation (they might still be relevant)
        const d = new Date(a.dueDate);
        if (isNaN(d.getTime()) || d < now) return;
        
        tasks.push({
          type: 'assignment',
          name: a.name || 'Assignment',
          date: d,
          course: courseName,
          courseCode,
          chatId: chat.id,
          weight: typeof a.weight === 'number' ? a.weight : (a.weight ? parseFloat(a.weight) : 10),
          status: a.status || 'Not Started'
        });
      });

      // Exams
      (chat.courseData.exams || []).forEach((e: any) => {
        if (!e?.date || e?.date === 'null') return;
        // Include completed exams for nudge generation
        const d = new Date(e.date);
        if (isNaN(d.getTime()) || d < now) return;
        
        tasks.push({
          type: 'exam',
          name: e.name || 'Exam',
          date: d,
          course: courseName,
          courseCode,
          chatId: chat.id,
          weight: typeof e.weight === 'number' ? e.weight : (e.weight ? parseFloat(e.weight) : 20),
          status: e.status || 'Upcoming'
        });
      });
    });

    return tasks.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [chats]);

  // Detect Triage Mode (3+ overlapping deadlines in same week)
  useEffect(() => {
    if (allTasks.length === 0) {
      setTriageMode(null);
      return;
    }

    // Group tasks by week
    const tasksByWeek = new Map<string, TaskItem[]>();
    
    allTasks.forEach(task => {
      const weekStart = new Date(task.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!tasksByWeek.has(weekKey)) {
        tasksByWeek.set(weekKey, []);
      }
      tasksByWeek.get(weekKey)!.push(task);
    });

    // Find weeks with 3+ tasks
    for (const [weekKey, weekTasks] of tasksByWeek.entries()) {
      if (weekTasks.length >= 3) {
        const weekDate = new Date(weekKey);
        const weekLabel = `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        // Find lighter tasks that could be moved earlier
        const heavyTasks = weekTasks.filter(t => (t.weight || 10) >= 15);
        const lightTasks = weekTasks.filter(t => (t.weight || 10) < 15);
        
        let suggestion = `I noticed ${weekLabel} is looking brutal with ${weekTasks.length} deadlines. `;
        
        if (lightTasks.length > 0 && heavyTasks.length > 0) {
          const lightTask = lightTasks[0];
          suggestion += `I've drafted a modified study plan that moves your lighter ${lightTask.courseCode} ${lightTask.type === 'exam' ? 'exam prep' : 'assignment'} to this weekend so you can focus entirely on the ${heavyTasks[0].type === 'exam' ? 'midterm' : 'major assignment'} next ${weekDate.toLocaleDateString('en-US', { weekday: 'long' })}.`;
        } else {
          suggestion += `Consider starting early and breaking these into smaller chunks. I can help you create a study plan.`;
        }

        setTriageMode({
          isActive: true,
          week: weekLabel,
          tasks: weekTasks,
          suggestion
        });
        
        // Show dialog on first detection
        if (!localStorage.getItem(`triage-shown-${weekKey}`)) {
          setShowTriageDialog(true);
          localStorage.setItem(`triage-shown-${weekKey}`, 'true');
        }
        return;
      }
    }

    setTriageMode(null);
  }, [allTasks]);

  // Generate proactive nudge
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Check if all tasks are completed
    const activeTasks = allTasks.filter(t => t.status !== 'Completed');
    
    // If no active tasks, show a proactive review message
    if (activeTasks.length === 0 && allTasks.length > 0) {
      // All tasks are completed - suggest review or new learning
      const anyChat = Object.values(chats).find((chat: any) => chat.chatType === 'class' && chat.courseData);
      if (anyChat && anyChat.courseData) {
        const courseCode = anyChat.courseData.courseCode || anyChat.title;
        setNudge({
          type: 'opportunity',
          message: `Great job! You've completed all your upcoming tasks. This is a perfect time to review key concepts or explore new topics. Want to strengthen your understanding?`,
          actionText: `Review ${courseCode}`,
          actionHref: `/dashboard/chat?tab=${encodeURIComponent(anyChat.id)}&prefill=${encodeURIComponent(`Help me review key concepts for ${courseCode}.`)}`,
          priority: 'low'
        });
        return;
      }
    }
    
    // If no tasks at all, show default message (handled in render)
    if (allTasks.length === 0) {
      setNudge(null);
      return;
    }

    // Use active (non-completed) tasks for nudge generation
    const tasksForNudges = activeTasks.length > 0 ? activeTasks : allTasks;
    
    // Find tasks due tomorrow
    const tomorrowTasks = tasksForNudges.filter(t => {
      if (!t?.date || t.status === 'Completed') return false;
      try {
        const taskDate = new Date(t.date);
        if (isNaN(taskDate.getTime())) return false;
        return taskDate >= tomorrow && taskDate <= new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      } catch {
        return false;
      }
    });

    // Find heavy tasks coming up
    const heavyTasks = tasksForNudges.filter(t => (t.weight || 10) >= 15 && t.status !== 'Completed');
    const nextHeavyTask = heavyTasks[0];
    
    // Find the next upcoming task (for fallback proactive message)
    const nextTask = tasksForNudges[0]; // Already sorted by date

    // Check for completed related work (e.g., reading done early)
    const completedWork: any[] = [];
    Object.values(chats).forEach((chat: any) => {
      if (chat.chatType !== 'class' || !chat.courseData) return;
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (a?.status === 'Completed') {
          completedWork.push({ ...a, chatId: chat.id, courseCode: chat.courseData.courseCode });
        }
      });
    });

    // Generate nudge based on context
    let nudgeSuggestion: NudgeSuggestion | null = null;

    // Priority 1: Warning for tasks due tomorrow (highest priority)
    if (tomorrowTasks.length > 0) {
      const task = tomorrowTasks[0];
      nudgeSuggestion = {
        type: 'warning',
        message: `${task.name} for ${task.courseCode} is due tomorrow. ${task.type === 'exam' ? 'Time to review!' : 'Want to make sure you\'re on track?'}`,
        actionText: `Work on ${task.name}`,
        actionHref: `/dashboard/chat?tab=${encodeURIComponent(task.chatId)}&prefill=${encodeURIComponent(`Help me with ${task.name} for ${task.courseCode}.`)}`,
        priority: 'high'
      };
    }
    // Priority 2: Proactive opportunity - upcoming heavy task with free time now
    else if (nextHeavyTask && nextHeavyTask.date) {
      try {
        const daysUntil = Math.ceil((new Date(nextHeavyTask.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (isNaN(daysUntil)) {
          setNudge(null);
          return;
        }
        
        // Show proactive nudge for tasks within 7 days
        if (daysUntil <= 7 && daysUntil >= 1) {
          // Check if there's related completed work (like reading done early)
          const relatedWork = completedWork.find(c => 
            c.chatId === nextHeavyTask.chatId && 
            (c.name?.toLowerCase().includes('reading') || c.name?.toLowerCase().includes('prep'))
          );

          if (relatedWork && daysUntil <= 3) {
            // Example: "You've got a heavy Bio lab tomorrow, but you finished the reading early last week..."
            const taskType = nextHeavyTask.type === 'exam' ? 'exam' : nextHeavyTask.name.toLowerCase().includes('lab') ? 'lab' : 'assignment';
            const prepWork = nextHeavyTask.type === 'exam' ? 'pre-exam review' : taskType === 'lab' ? 'pre-lab quiz' : 'preparation work';
            
            nudgeSuggestion = {
              type: 'opportunity',
              message: `You've got a heavy ${nextHeavyTask.name} ${daysUntil === 1 ? 'tomorrow' : daysUntil === 2 ? 'the day after tomorrow' : `in ${daysUntil} days`} for ${nextHeavyTask.courseCode}, but you finished the ${relatedWork.name} early last week. Since you have a free hour now, want to knock out the ${prepWork} while the info is fresh?`,
              actionText: `Start preparing for ${nextHeavyTask.name}`,
              actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextHeavyTask.chatId)}&prefill=${encodeURIComponent(`Help me prepare for ${nextHeavyTask.name} in ${nextHeavyTask.courseCode}.`)}`,
              priority: 'high'
            };
          } else if (daysUntil <= 3) {
            // Heavy task coming soon, suggest getting ahead
            nudgeSuggestion = {
              type: 'opportunity',
              message: `You've got a heavy ${nextHeavyTask.name} ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`} for ${nextHeavyTask.courseCode}. Since your schedule is clear now, want to get a head start?`,
              actionText: `Start preparing for ${nextHeavyTask.name}`,
              actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextHeavyTask.chatId)}&prefill=${encodeURIComponent(`Help me prepare for ${nextHeavyTask.name} in ${nextHeavyTask.courseCode}.`)}`,
              priority: 'medium'
            };
          } else if (daysUntil <= 7 && allTasks.length > 0) {
            // Upcoming task within a week, suggest proactive preparation
            nudgeSuggestion = {
              type: 'opportunity',
              message: `You've got ${nextHeavyTask.name} for ${nextHeavyTask.courseCode} coming up in ${daysUntil} days. Want to get ahead while you have time?`,
              actionText: `Start preparing for ${nextHeavyTask.name}`,
              actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextHeavyTask.chatId)}&prefill=${encodeURIComponent(`Help me prepare for ${nextHeavyTask.name} in ${nextHeavyTask.courseCode}.`)}`,
              priority: 'low'
            };
          }
        }
      } catch (error) {
        console.warn('Error calculating days until task:', error);
        setNudge(null);
        return;
      }
    }
    
    // Fallback: If no specific nudge but we have tasks, show a proactive message
    if (!nudgeSuggestion && nextTask && nextTask.date) {
      try {
        const daysUntil = Math.ceil((new Date(nextTask.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (!isNaN(daysUntil) && daysUntil > 0) {
          // Skip if task is completed
          if (nextTask.status === 'Completed') {
            // Find next non-completed task
            const nextActiveTask = allTasks.find(t => t.status !== 'Completed');
            if (nextActiveTask && nextActiveTask.date) {
              const activeDaysUntil = Math.ceil((new Date(nextActiveTask.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (!isNaN(activeDaysUntil) && activeDaysUntil > 0) {
                if (activeDaysUntil <= 7) {
                  nudgeSuggestion = {
                    type: 'opportunity',
                    message: `You've got ${nextActiveTask.name} for ${nextActiveTask.courseCode} coming up ${activeDaysUntil === 1 ? 'tomorrow' : `in ${activeDaysUntil} days`}. Want to get ahead while you have time?`,
                    actionText: `Start preparing for ${nextActiveTask.name}`,
                    actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextActiveTask.chatId)}&prefill=${encodeURIComponent(`Help me prepare for ${nextActiveTask.name} in ${nextActiveTask.courseCode}.`)}`,
                    priority: 'low'
                  };
                } else {
                  nudgeSuggestion = {
                    type: 'opportunity',
                    message: `You've got ${nextActiveTask.name} for ${nextActiveTask.courseCode} coming up in ${activeDaysUntil} days. Your schedule looks good - this is a great time to strengthen your understanding of the material.`,
                    actionText: `Review ${nextActiveTask.courseCode}`,
                    actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextActiveTask.chatId)}&prefill=${encodeURIComponent(`Help me review concepts for ${nextActiveTask.courseCode}.`)}`,
                    priority: 'low'
                  };
                }
              }
            }
          } else {
            // Task is not completed, show proactive message
            if (daysUntil <= 7) {
              nudgeSuggestion = {
                type: 'opportunity',
                message: `You've got ${nextTask.name} for ${nextTask.courseCode} coming up ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}. Want to get ahead while you have time?`,
                actionText: `Start preparing for ${nextTask.name}`,
                actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextTask.chatId)}&prefill=${encodeURIComponent(`Help me prepare for ${nextTask.name} in ${nextTask.courseCode}.`)}`,
                priority: 'low'
              };
            } else {
              nudgeSuggestion = {
                type: 'opportunity',
                message: `You've got ${nextTask.name} for ${nextTask.courseCode} coming up in ${daysUntil} days. Your schedule looks good - this is a great time to strengthen your understanding of the material.`,
                actionText: `Review ${nextTask.courseCode}`,
                actionHref: `/dashboard/chat?tab=${encodeURIComponent(nextTask.chatId)}&prefill=${encodeURIComponent(`Help me review concepts for ${nextTask.courseCode}.`)}`,
                priority: 'low'
              };
            }
          }
        }
      } catch (error) {
        console.warn('Error generating fallback nudge:', error);
      }
    }

    setNudge(nudgeSuggestion);
  }, [allTasks, chats]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Find the most urgent item
    const now = new Date();
    let nextItem: { type: 'assignment' | 'exam' | 'free'; name: string; date: Date; course: string } | null = null;

    allTasks.forEach((task) => {
      if (!nextItem || task.date < nextItem.date) {
        nextItem = { 
          type: task.type, 
          name: task.name, 
          date: task.date, 
          course: task.courseCode 
        };
      }
    });

    setFocusItem(nextItem || { type: 'free', name: 'No upcoming deadlines', date: new Date(), course: '' });
  }, [allTasks]);

  // Get user name, checking localStorage for guest users
  const getUserName = (): string => {
    // ALWAYS check localStorage first - it's the source of truth for guest data
    if (typeof window !== 'undefined') {
      try {
        const guestUser = localStorage.getItem('guestUser');
        if (guestUser) {
          const parsed = JSON.parse(guestUser);
          // If we have a displayName in localStorage, use it (even if it's "Guest User")
          // But only return it if it's not the default "Guest User"
          if (parsed.displayName && parsed.displayName !== 'Guest User') {
            return parsed.displayName.split(' ')[0];
          }
        }
      } catch (error) {
        console.warn('Failed to parse guest user from localStorage:', error);
      }
    }
    
    // Check if it's a guest user from user object (fallback)
    if (user?.isGuest || user?.isAnonymous || !user?.email) {
      if (user?.displayName && user.displayName !== 'Guest User') {
        return user.displayName.split(' ')[0];
      }
      // If no displayName but it's a guest, return 'Student' (will be updated when guest name is set)
      return 'Student';
    }
    
    // Fallback to regular user displayName or email
    return user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  };

  // Update userName when user changes or guest name is updated
  useEffect(() => {
    const updateUserName = () => {
      const name = getUserName();
      setUserName(name);
    };
    
    updateUserName();
    
    // Listen for guest name updates
    const handleGuestNameUpdate = () => {
      updateUserName();
    };
    
    window.addEventListener('guestNameUpdated', handleGuestNameUpdate);
    window.addEventListener('guestProfileUpdated', handleGuestNameUpdate);
    
    return () => {
      window.removeEventListener('guestNameUpdated', handleGuestNameUpdate);
      window.removeEventListener('guestProfileUpdated', handleGuestNameUpdate);
    };
  }, [user]);

  return (
    <>
    <div className="w-full mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-8 lg:p-10">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          
          {/* Greeting & Main Focus */}
          <div className="space-y-4 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider"
            >
              {greeting.includes('morning') ? <Sun01Icon className="w-4 h-4 text-orange-500" /> : 
               greeting.includes('afternoon') ? <Coffee01Icon className="w-4 h-4 text-brown-500" /> : 
               <Moon01Icon className="w-4 h-4 text-indigo-500" />}
              <span>Daily Briefing</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight"
            >
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{userName}</span>.
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-3"
            >
              {/* Main message - Show proactive nudge if available, otherwise show default */}
              {nudge ? (
                <div className="space-y-3">
                  <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    {nudge.message}
                  </div>
                  {nudge.actionText && nudge.actionHref && (
                    <Link href={nudge.actionHref}>
                      <Button
                        size="sm"
                        className={`${
                          nudge.type === 'warning'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                      >
                        {nudge.actionText}
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    {focusItem?.type === 'free' ? (
                      <span>
                        Your schedule is clear! Great opportunity to strengthen your understanding or take a well-deserved break.
                      </span>
                    ) : allTasks.length > 0 ? (
                      (() => {
                        // Find the next upcoming task for a course
                        const nextTask = allTasks.find(t => t.status !== 'Completed');
                        if (nextTask) {
                          const anyClassChat = Object.values(chats).find((chat: any) => 
                            chat.chatType === 'class' && chat.courseData && 
                            (chat.courseData.courseCode === nextTask.courseCode || chat.id === nextTask.chatId)
                          );
                          
                          if (anyClassChat) {
                            const courseCode = anyClassChat.courseData?.courseCode || anyClassChat.title;
                            return (
                              <span>
                                No urgent deadlines detected. Spend 10 minutes reinforcing concepts for <span className="font-semibold text-gray-900 dark:text-white">{courseCode}</span> so they stay fresh.
                              </span>
                            );
                          }
                        }
                        
                        // Fallback: show next priority
                        return (
                          <span>
                            Your next priority is <span className="font-semibold text-gray-900 dark:text-white">{focusItem?.name}</span> for <span className="text-blue-600 dark:text-blue-400">{focusItem?.course}</span>, due {focusItem?.date ? (
                              Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 1 ? 'tomorrow' : 
                              Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === 0 ? 'today' :
                              `in ${Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                            ) : 'soon'}.
                          </span>
                        );
                      })()
                    ) : (
                      <span>
                        Your schedule is clear! This is a perfect time to explore new topics, review past material, or take a well-deserved break. You're doing great!
                      </span>
                    )}
                  </div>
                  
                  {/* Show action button for next best step when there are tasks */}
                  {allTasks.length > 0 && focusItem?.type !== 'free' && (() => {
                    const nextTask = allTasks.find(t => t.status !== 'Completed');
                    if (nextTask) {
                      const anyClassChat = Object.values(chats).find((chat: any) => 
                        chat.chatType === 'class' && chat.courseData && 
                        (chat.courseData.courseCode === nextTask.courseCode || chat.id === nextTask.chatId)
                      );
                      
                      if (anyClassChat) {
                        const courseCode = anyClassChat.courseData?.courseCode || anyClassChat.title;
                        return (
                          <Link href={`/dashboard/chat?tab=${encodeURIComponent(anyClassChat.id)}&prefill=${encodeURIComponent(`Help me review key concepts for ${courseCode}.`)}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              Start a quick review
                            </Button>
                          </Link>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Stats Pill */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex gap-4"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-2xl shadow-sm flex items-center gap-3 min-w-[140px]">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Award01Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studyStreak || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Day Streak</div>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-2xl shadow-sm flex items-center gap-3 min-w-[140px]">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <AnalyticsUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assignmentsCompleted || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>

    {/* Triage Mode Dialog */}
    <Dialog open={showTriageDialog} onOpenChange={setShowTriageDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Triage Mode: Week Overload Detected
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400 pt-2">
            {triageMode?.suggestion}
          </DialogDescription>
        </DialogHeader>
        
        {triageMode && (
          <div className="space-y-3 py-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {triageMode.week} - {triageMode.tasks.length} deadlines:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {triageMode.tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{task.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.courseCode} • {task.type === 'exam' ? 'Exam' : 'Assignment'} • {task.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {task.weight || 10}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTriageDialog(false)}
          >
            Dismiss
          </Button>
          <Button
            onClick={() => {
              setShowTriageDialog(false);
              // Navigate to chat with study plan request
              if (triageMode?.tasks[0]) {
                const task = triageMode.tasks[0];
                window.location.href = `/dashboard/chat?tab=${encodeURIComponent(task.chatId)}&prefill=${encodeURIComponent(`Help me create a study plan for the upcoming week with multiple deadlines.`)}`;
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Create Study Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
