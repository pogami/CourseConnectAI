"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/hooks/use-chat-store';
import {
  Sun01Icon,
  Moon01Icon,
  Coffee01Icon,
  Calendar01Icon,
  AnalyticsUpIcon,
  Award01Icon
} from 'hugeicons-react';
import { Card, CardContent } from '@/components/ui/card';

interface DailyBriefingProps {
  user: any;
  stats: any;
}

export function DailyBriefing({ user, stats }: DailyBriefingProps) {
  const { chats } = useChatStore();
  const [greeting, setGreeting] = useState('');
  const [focusItem, setFocusItem] = useState<{ type: 'assignment' | 'exam' | 'free'; name: string; date: Date; course: string } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Find the most urgent item
    const now = new Date();
    let nextItem: { type: 'assignment' | 'exam' | 'free'; name: string; date: Date; course: string } | null = null;

    Object.values(chats).forEach((chat: any) => {
      if (chat.chatType !== 'class' || !chat.courseData) return;
      const courseName = chat.courseData.courseCode || chat.title;

      // Check assignments
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (!a?.dueDate || a?.dueDate === 'null' || a?.status === 'Completed') return;
        const d = new Date(a.dueDate);
        if (isNaN(d.getTime()) || d < now) return; // Skip past or invalid
        if (!nextItem || d < nextItem.date) {
          nextItem = { type: 'assignment', name: a.name, date: d, course: courseName };
        }
      });

      // Check exams
      (chat.courseData.exams || []).forEach((e: any) => {
        if (!e?.date || e?.date === 'null') return;
        const d = new Date(e.date);
        if (isNaN(d.getTime()) || d < now) return;
        if (!nextItem || d < nextItem.date) {
          nextItem = { type: 'exam', name: e.name || 'Exam', date: d, course: courseName };
        }
      });
    });

    setFocusItem(nextItem || { type: 'free', name: 'No upcoming deadlines', date: new Date(), course: '' });
  }, [chats]);

  // Get user name, checking localStorage for guest users
  const getUserName = (): string => {
    // Check if it's a guest user
    if (user?.isGuest || user?.isAnonymous) {
      if (typeof window !== 'undefined') {
        try {
          const guestUser = localStorage.getItem('guestUser');
          if (guestUser) {
            const parsed = JSON.parse(guestUser);
            if (parsed.displayName) {
              return parsed.displayName.split(' ')[0];
            }
          }
        } catch (error) {
          console.warn('Failed to parse guest user from localStorage:', error);
        }
      }
    }
    
    // Fallback to regular user displayName or email
    return user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  };

  const userName = getUserName();

  return (
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
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {focusItem?.type === 'free' ? (
                <span>
                  You're all caught up! Perfect time to review past topics or relax.
                </span>
              ) : (
                <span>
                  Your next priority is <span className="font-semibold text-gray-900 dark:text-white">{focusItem?.name}</span> for <span className="text-blue-600 dark:text-blue-400">{focusItem?.course}</span>, due {focusItem?.date ? (
                    Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 1 ? 'tomorrow' : 
                    Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) === 0 ? 'today' :
                    `in ${Math.ceil((focusItem.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                  ) : 'soon'}.
                </span>
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
  );
}

