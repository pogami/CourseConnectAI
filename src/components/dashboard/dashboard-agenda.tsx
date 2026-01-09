"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/hooks/use-chat-store';
import { Calendar, CheckCircle2, Clock, FileText, GraduationCap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client-simple';
import { toast } from 'sonner';
import { generateCelebrationMessage } from '@/lib/emotional-intelligence';
import { calculatePriorityRankings, getPriorityLabel } from '@/lib/assignment-priority';

interface DashboardAgendaProps {
  onCompletionChange?: (completedCount: number) => void;
}

export function DashboardAgenda({ onCompletionChange }: DashboardAgendaProps) {
  const { chats } = useChatStore();
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({});

  // Sync completion states from database on mount and when chats change
  useEffect(() => {
    const completions: Record<string, boolean> = {};
    
    Object.values(chats).forEach((chat: any) => {
      if (chat.chatType !== 'class' || !chat.courseData) return;
      
      // Check assignments
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (a?.status === 'Completed') {
          completions[`${chat.id}-${a.name}`] = true;
        }
      });
      
      // Check exams
      (chat.courseData.exams || []).forEach((e: any) => {
        if (e?.status === 'Completed') {
          completions[`${chat.id}-${e.name}-exam`] = true;
        }
      });
    });
    
    setLocalCompletions(completions);
    
    // Calculate and notify completed count (count all completed items)
    const completedCount = Object.values(completions).filter(Boolean).length;
    if (onCompletionChange) {
      onCompletionChange(completedCount);
    }
  }, [chats, onCompletionChange]);

  // Collect all items with priority rankings
  const allItems = React.useMemo(() => {
    const items: any[] = [];
    const now = new Date();

    Object.values(chats).forEach((chat: any) => {
      if (chat.chatType !== 'class' || !chat.courseData) return;
      const courseCode = chat.courseData.courseCode || chat.title;

      // Assignments
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (!a?.dueDate || a?.dueDate === 'null') return;
        const d = new Date(a.dueDate);
        if (isNaN(d.getTime())) return;
        items.push({
          type: 'assignment',
          name: a.name,
          date: d,
          course: courseCode,
          chatId: chat.id,
          id: `${chat.id}-${a.name}`,
          status: a.status || 'Not Started',
          weight: a.weight,
          description: a.description
        });
      });

      // Exams
      (chat.courseData.exams || []).forEach((e: any) => {
        if (!e?.date || e?.date === 'null') return;
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return;
        items.push({
          type: 'exam',
          name: e.name || 'Exam',
          date: d,
          course: courseCode,
          chatId: chat.id,
          id: `${chat.id}-${e.name}-exam`,
          status: e.status || 'Upcoming',
          weight: e.weight,
          description: e.description
        });
      });
    });

    // Calculate priority rankings for items due this week
    const itemsWithPriority = calculatePriorityRankings(items, chats, now);
    
    // Create a map of priority by item ID
    const priorityMap = new Map<string, number>();
    itemsWithPriority.forEach(item => {
      priorityMap.set(item.id, item.priority);
    });

    // Add priority to all items and sort by date
    return items.map(item => ({
      ...item,
      priority: priorityMap.get(item.id) || 0
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [chats]);

  // Show only first 5 items in the card
  const items = allItems.slice(0, 5);

  // Function to mark item as complete
  const handleMarkComplete = async (item: any) => {
    if (markingComplete === item.id) return; // Prevent double-clicks
    setMarkingComplete(item.id);
    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      const isGuest = !user || (user as any).isGuest || (user as any).isAnonymous;
      
      // For guest users, only update local state (don't try to update Firestore)
      if (isGuest) {
        const isCurrentlyCompleted = localCompletions[item.id] || false;
        setLocalCompletions(prev => {
          const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
          const completedCount = Object.values(newCompletions).filter(Boolean).length;
          if (onCompletionChange) {
            onCompletionChange(completedCount);
          }
          return newCompletions;
        });
        
        if (!isCurrentlyCompleted) {
          toast.success("Item Completed! 🎉", {
            description: `${item.name} has been marked as complete.`,
            duration: 3000,
          });
        } else {
          toast.info("Item Marked as Incomplete", {
            description: `${item.name} has been marked as incomplete.`,
            duration: 3000,
          });
        }
        setMarkingComplete(null);
        return;
      }
      
      const chatRef = doc(db, 'chats', item.chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        // Check if user owns this chat
        if (chatData.userId && chatData.userId !== user?.uid) {
          toast.error("Permission Denied", {
            description: "You don't have permission to update this chat.",
            duration: 4000,
          });
          setMarkingComplete(null);
          return;
        }
        
        // Check current status from database and local state
        let currentStatus = item.status || 'Not Started';
        if (item.type === 'assignment') {
          const assignment = chatData.courseData?.assignments?.find((a: any) => a.name === item.name);
          if (assignment) currentStatus = assignment.status || 'Not Started';
        } else if (item.type === 'exam') {
          const exam = chatData.courseData?.exams?.find((e: any) => e.name === item.name);
          if (exam) currentStatus = exam.status || 'Upcoming';
        }
        const isCurrentlyCompleted = currentStatus === 'Completed' || localCompletions[item.id];
        const newStatus = isCurrentlyCompleted ? (item.type === 'assignment' ? 'Not Started' : 'Upcoming') : 'Completed';
        
        if (item.type === 'assignment') {
          if (chatData.courseData?.assignments) {
            const updatedAssignments = chatData.courseData.assignments.map((assignment: any) => {
              if (assignment.name === item.name) {
                return { ...assignment, status: newStatus };
              }
              return assignment;
            });
            
            try {
              // Build update object - ensure userId is preserved for security rules
              const updateData: any = {
                'courseData.assignments': updatedAssignments,
                updatedAt: Date.now()
              };
              
              // CRITICAL: Always set userId if user is authenticated (for migration and security)
              // This ensures Firestore security rules can verify ownership
              if (user?.uid) {
                // Always include userId in update to ensure security rules pass
                updateData.userId = user.uid;
              }
              
              console.log('🔄 Updating chat:', { 
                chatId: item.chatId, 
                hasUserId: !!chatData.userId, 
                currentUserId: user?.uid,
                updateDataKeys: Object.keys(updateData)
              });
              
              await updateDoc(chatRef, updateData);
              
              // Success - update local state
              setLocalCompletions(prev => {
                const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
                const completedCount = Object.values(newCompletions).filter(Boolean).length;
                if (onCompletionChange) {
                  onCompletionChange(completedCount);
                }
                return newCompletions;
              });
              
              if (!isCurrentlyCompleted) {
                toast.success("Item Completed! 🎉", {
                  description: `${item.name} has been marked as complete.`,
                  duration: 3000,
                });
              } else {
                toast.info("Item Marked as Incomplete", {
                  description: `${item.name} has been marked as incomplete.`,
                  duration: 3000,
                });
              }
            } catch (error: any) {
              // If Firestore update fails, still update local state
              console.error('❌ Firestore update failed:', {
                error: error.message,
                code: error.code,
                chatId: item.chatId,
                hasUserId: !!chatData.userId,
                currentUserId: user?.uid,
                chatDataKeys: Object.keys(chatData),
                updateDataKeys: Object.keys(updateData)
              });
              
              setLocalCompletions(prev => {
                const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
                const completedCount = Object.values(newCompletions).filter(Boolean).length;
                if (onCompletionChange) {
                  onCompletionChange(completedCount);
                }
                return newCompletions;
              });
              
              if (!isCurrentlyCompleted) {
                toast.success("Item Completed! 🎉", {
                  description: `${item.name} has been marked as complete (saved locally).`,
                  duration: 3000,
                });
              } else {
                toast.info("Item Marked as Incomplete", {
                  description: `${item.name} has been marked as incomplete (saved locally).`,
                  duration: 3000,
                });
              }
            } finally {
              setMarkingComplete(null);
            }
            
            if (!isCurrentlyCompleted) {
              // Check if this is a priority task (weight >= 15 or urgent)
              const assignment = chatData.courseData?.assignments?.find((a: any) => a.name === item.name);
              const weight = assignment?.weight ? (typeof assignment.weight === 'number' ? assignment.weight : parseFloat(assignment.weight)) : 10;
              const isPriority = weight >= 15;
              
              // Find next upcoming task to calculate days until
              const allUpcoming = allItems.filter((i: any) => i.id !== item.id && (i.status !== 'Completed' && !localCompletions[i.id]));
              const nextTask = allUpcoming[0];
              const daysUntilNext = nextTask ? Math.ceil((nextTask.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined;
              
              const celebrationMessage = generateCelebrationMessage(item.name, 'assignment', isPriority, daysUntilNext);
              
              toast.success("Assignment Completed! 🎉", {
                description: celebrationMessage,
                duration: 5000,
              });
            } else {
              toast.info("Assignment Marked as Incomplete", {
                description: `${item.name} has been marked as incomplete.`,
                duration: 3000,
              });
            }
          }
        } else if (item.type === 'exam') {
          if (chatData.courseData?.exams) {
            const updatedExams = chatData.courseData.exams.map((exam: any) => {
              if (exam.name === item.name) {
                return { ...exam, status: newStatus };
              }
              return exam;
            });
            
            try {
              // Build update object - ensure userId is preserved for security rules
              const updateData: any = {
                'courseData.exams': updatedExams,
                updatedAt: Date.now()
              };
              
              // CRITICAL: Always set userId if user is authenticated (for migration and security)
              // This ensures Firestore security rules can verify ownership
              if (user?.uid) {
                // Always include userId in update to ensure security rules pass
                updateData.userId = user.uid;
              }
              
              console.log('🔄 Updating chat:', { 
                chatId: item.chatId, 
                hasUserId: !!chatData.userId, 
                currentUserId: user?.uid,
                updateDataKeys: Object.keys(updateData)
              });
              
              await updateDoc(chatRef, updateData);
              
              // Success - update local state
              setLocalCompletions(prev => {
                const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
                const completedCount = Object.values(newCompletions).filter(Boolean).length;
                if (onCompletionChange) {
                  onCompletionChange(completedCount);
                }
                return newCompletions;
              });
              
              if (!isCurrentlyCompleted) {
                toast.success("Item Completed! 🎉", {
                  description: `${item.name} has been marked as complete.`,
                  duration: 3000,
                });
              } else {
                toast.info("Item Marked as Incomplete", {
                  description: `${item.name} has been marked as incomplete.`,
                  duration: 3000,
                });
              }
            } catch (error: any) {
              // If Firestore update fails, still update local state
              console.error('❌ Firestore update failed:', {
                error: error.message,
                code: error.code,
                chatId: item.chatId,
                hasUserId: !!chatData.userId,
                currentUserId: user?.uid,
                chatDataKeys: Object.keys(chatData),
                updateDataKeys: Object.keys(updateData)
              });
              
              setLocalCompletions(prev => {
                const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
                const completedCount = Object.values(newCompletions).filter(Boolean).length;
                if (onCompletionChange) {
                  onCompletionChange(completedCount);
                }
                return newCompletions;
              });
              
              if (!isCurrentlyCompleted) {
                toast.success("Item Completed! 🎉", {
                  description: `${item.name} has been marked as complete (saved locally).`,
                  duration: 3000,
                });
              } else {
                toast.info("Item Marked as Incomplete", {
                  description: `${item.name} has been marked as incomplete (saved locally).`,
                  duration: 3000,
                });
              }
            } finally {
              setMarkingComplete(null);
            }
            
            if (!isCurrentlyCompleted) {
              // Exams are typically high priority
              const exam = chatData.courseData?.exams?.find((e: any) => e.name === item.name);
              const weight = exam?.weight ? (typeof exam.weight === 'number' ? exam.weight : parseFloat(exam.weight)) : 20;
              const isPriority = weight >= 15;
              
              // Find next upcoming task
              const allUpcoming = allItems.filter((i: any) => i.id !== item.id && (i.status !== 'Completed' && !localCompletions[i.id]));
              const nextTask = allUpcoming[0];
              const daysUntilNext = nextTask ? Math.ceil((nextTask.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined;
              
              const celebrationMessage = generateCelebrationMessage(item.name, 'exam', isPriority, daysUntilNext);
              
              toast.success("Exam Completed! 🎉", {
                description: celebrationMessage,
                duration: 5000,
              });
            } else {
              toast.info("Exam Marked as Incomplete", {
                description: `${item.name} has been marked as incomplete.`,
                duration: 3000,
              });
            }
          }
        } else {
          // For other types, mark locally (could be extended to save to a custom field)
          setLocalCompletions(prev => {
            const newCompletions = { ...prev, [item.id]: !isCurrentlyCompleted };
            // Calculate completed count and notify parent
            const completedCount = Object.values(newCompletions).filter(Boolean).length;
            if (onCompletionChange) {
              onCompletionChange(completedCount);
            }
            return newCompletions;
          });
          if (!isCurrentlyCompleted) {
            toast.success("Item Completed! 🎉", {
              description: `${item.name} has been marked as complete.`,
              duration: 5000,
            });
          } else {
            toast.info("Item Marked as Incomplete", {
              description: `${item.name} has been marked as incomplete.`,
              duration: 3000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error marking item as complete:', error);
      toast.error("Error", {
        description: "Failed to mark item as complete.",
        duration: 4000,
      });
    } finally {
      setMarkingComplete(null);
    }
  };

  if (allItems.length === 0) return null;

  return (
    <>
    <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-gray-200/70 dark:border-gray-800/70 shadow-xl hover:shadow-2xl transition-all rounded-3xl overflow-hidden mb-10">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Upcoming Work
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-blue-600"
            onClick={() => setShowAllDialog(true)}
          >
            View All Upcoming Work <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const daysUntil = Math.ceil((item.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isCompleted = item.status === 'Completed' || localCompletions[item.id];
            
            let urgencyColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            if (daysUntil <= 2) urgencyColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            else if (daysUntil <= 5) urgencyColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            else if (daysUntil <= 7) urgencyColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-start gap-4 p-4 hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-all relative group ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                style={{ pointerEvents: 'auto' }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />
                {/* Date Box or Completed Badge */}
                {isCompleted ? (
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                    <span className="text-[9px] font-bold uppercase text-green-700 dark:text-green-300 text-center leading-tight">
                      COMPLETED
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-gray-500">
                      {item.date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                      {item.date.getDate()}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        COMPLETED
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyColor}`}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} Days`}
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                      {item.course}
                    </span>
                    {/* Priority Label */}
                    {!isCompleted && item.priority > 0 && daysUntil <= 7 && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                        Priority {item.priority}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                    {item.type === 'exam' ? (
                      <GraduationCap className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                    {item.name}
                  </h4>
                </div>

                {/* Action/Status */}
                <div className="self-center relative z-50">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkComplete(item);
                      }}
                      disabled={markingComplete === item.id}
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed relative z-50 pointer-events-auto ${
                        isCompleted
                          ? 'border-green-500 bg-green-50 text-green-600 shadow-inner dark:bg-green-900/20 dark:border-green-400 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95'
                          : 'border-gray-200 dark:border-gray-700 text-gray-300 hover:border-green-500 hover:text-green-500 active:scale-95'
                      }`}
                      title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                      type="button"
                      style={{ pointerEvents: 'auto', zIndex: 50 }}
                    >
                      {markingComplete === item.id ? (
                        <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle2
                          className="h-5 w-5 text-green-600 dark:text-green-200 transition-transform"
                        />
                      ) : (
                        item.type === 'exam' ? (
                          <Clock className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                        ) : (
                          <CheckCircle2
                            className="h-5 w-5 transition-transform group-hover:scale-110"
                          />
                        )
                      )}
                    </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>

    {/* View All Dialog */}
    <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            All Upcoming Work
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {allItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No upcoming work found.
              </div>
            ) : (
              allItems.map((item, idx) => {
                const daysUntil = Math.ceil((item.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isCompleted = item.status === 'Completed' || localCompletions[item.id];
                
                let urgencyColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                if (daysUntil <= 2) urgencyColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                else if (daysUntil <= 5) urgencyColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
                else if (daysUntil <= 7) urgencyColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-all border border-gray-200 dark:border-gray-800"
                  >
                    {isCompleted ? (
                      <div className="flex flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                        <span className="text-[9px] font-bold uppercase text-green-700 dark:text-green-300 text-center leading-tight">
                          COMPLETED
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="text-[10px] font-bold uppercase text-gray-500">
                          {item.date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                          {item.date.getDate()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            COMPLETED
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyColor}`}>
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} Days`}
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {item.course}
                        </span>
                        {/* Priority Label */}
                        {!isCompleted && item.priority > 0 && daysUntil <= 7 && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                            Priority {item.priority}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {item.type === 'exam' ? (
                          <GraduationCap className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                        {item.name}
                      </h4>
                    </div>

                    <div className="self-center relative z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkComplete(item);
                          }}
                          disabled={markingComplete === item.id}
                          className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed relative z-50 pointer-events-auto ${
                          isCompleted
                            ? 'border-green-500 bg-green-50 text-green-600 shadow-inner dark:bg-green-900/20 dark:border-green-400 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95'
                            : 'border-gray-200 dark:border-gray-700 text-gray-300 hover:border-green-500 hover:text-green-500 active:scale-95'
                        }`}
                        title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                        type="button"
                      >
                        {markingComplete === item.id ? (
                          <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2
                            className="h-5 w-5 text-green-600 dark:text-green-200 transition-transform"
                          />
                        ) : (
                          item.type === 'exam' ? (
                            <Clock className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                          ) : (
                            <CheckCircle2
                              className="h-5 w-5 transition-transform group-hover:scale-110"
                            />
                          )
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}


