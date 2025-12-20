"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  Chatting01Icon,
  FolderUploadIcon,
  BookOpen01Icon,
  UserGroupIcon,
  AnalyticsUpIcon,
  Clock01Icon,
  SparklesIcon,
  CrownIcon,
  Target01Icon,
  Calendar01Icon,
  Award01Icon,
  GraduationScrollIcon,
  Book01Icon,
  Notification01Icon
} from "hugeicons-react";
import Image from "next/image";
import { StatCards } from "@/components/stat-cards";
import { useChatStore } from "@/hooks/use-chat-store";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { auth } from '@/lib/firebase/client-simple';
import { NotificationService } from '@/lib/notification-service';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client-simple';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MobileButton } from "@/components/ui/mobile-button";
import GeolocationGreeting from "@/components/geolocation-greeting";
import { StudyFocusSuggestions } from "@/components/study-focus-suggestions";
import { ChatSummariesDashboard } from "@/components/chat-summaries-dashboard";
import { DailyBriefing } from "@/components/dashboard/daily-briefing";
import { DashboardAgenda } from "@/components/dashboard/dashboard-agenda";
import dynamic from "next/dynamic";



const HugeiconsIcon = ({ icon: Icon, ...props }: { icon: any; className?: string }) => {
  if (!Icon) return null;
  return <Icon {...props} />;
};

export default function DashboardPage() {
  const { chats, trialActivated, trialDaysLeft, updateTrialDaysLeft, setIsDemoMode } = useChatStore();
  const [user, setUser] = useState<any>(null);
  const [isAdvancedDialogOpen, setIsAdvancedDialogOpen] = useState(false);
  const [manualStatuses, setManualStatuses] = useState<{[key: string]: string}>({});
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  
  // Function to create assignment notifications
  const createAssignmentNotification = async (assignmentName: string, newStatus: string, chatId: string) => {
    if (!user) {
      return;
    }
    
    try {
      // Get the class information for context
      const chat = chats[chatId];
      const courseCode = chat?.courseData?.courseCode || chat?.title || 'System';
      const courseName = chat?.courseData?.courseName || chat?.title || 'Unknown Course';
      
      let title = '';
      let description = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';
      
      switch (newStatus) {
        case 'Completed':
          title = '🎉 Assignment Completed!';
          description = `${courseCode}: "${assignmentName}" completed successfully. Great work!`;
          priority = 'high';
          break;
        case 'Overdue':
          title = '⚠️ Assignment Overdue';
          description = `${courseCode}: "${assignmentName}" is now overdue. Consider prioritizing this assignment.`;
          priority = 'high';
          break;
        case 'Due Soon':
          title = '⏰ Assignment Due Soon';
          description = `${courseCode}: "${assignmentName}" is due soon. Don't forget to complete it!`;
          priority = 'medium';
          break;
        case 'In Progress':
          title = '📝 Assignment Started';
          description = `${courseCode}: You've started working on "${assignmentName}". Keep going!`;
          priority = 'low';
          break;
        default:
          return; // Don't create notification for other statuses
      }
      
      // Handle guest users - store in localStorage
      if (user.isGuest) {
        console.log('🔔 Creating guest notification for:', title);
        const notification = {
          id: `guest-notification-${Date.now()}`,
          title,
          description,
          type: 'assignment',
          priority,
          classId: chatId,
          actionUrl: '/dashboard',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Get existing notifications
        const existingNotifications = localStorage.getItem('guest-notifications');
        let notifications = [];
        if (existingNotifications) {
          try {
            notifications = JSON.parse(existingNotifications);
            console.log('🔔 Existing guest notifications:', notifications.length);
          } catch (error) {
            console.warn('Error parsing existing guest notifications:', error);
          }
        }
        
        // Add new notification
        notifications.unshift(notification);
        console.log('🔔 Total guest notifications after adding:', notifications.length);
        
        // Keep only last 50 notifications
        if (notifications.length > 50) {
          notifications = notifications.slice(0, 50);
        }
        
        localStorage.setItem('guest-notifications', JSON.stringify(notifications));
        console.log('🔔 Guest notification stored in localStorage:', title);
        return;
      }
      
      // Handle authenticated users - store in Firebase
      await NotificationService.createNotification({
        title,
        description,
        type: 'assignment',
        priority,
        classId: chatId,
        actionUrl: '/dashboard'
      }, user.uid);
      
      console.log('📢 Assignment notification created:', title);
    } catch (error) {
      console.error('Error creating assignment notification:', error);
    }
  };
  
  // Function to check for upcoming assignments and create notifications
  const checkUpcomingAssignments = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      Object.values(chats).forEach(chat => {
        if (chat.chatType === 'class' && chat.courseData?.assignments) {
          const courseCode = chat.courseData.courseCode || chat.title;
          
          chat.courseData.assignments.forEach((assignment: any) => {
            if (assignment.dueDate && assignment.dueDate !== 'null' && assignment.status !== 'Completed') {
              const dueDate = new Date(assignment.dueDate);
              
              // Check if due tomorrow
              if (dueDate >= tomorrow && dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
                createAssignmentNotification(assignment.name, 'Due Soon', chat.id);
              }
              
              // Check if overdue
              if (dueDate < now && assignment.status !== 'Overdue') {
                createAssignmentNotification(assignment.name, 'Overdue', chat.id);
              }
            }
          });
          
          // Check for upcoming exams
          if (chat.courseData?.exams) {
            chat.courseData.exams.forEach((exam: any) => {
              if (exam.date && exam.date !== 'null') {
                const examDate = new Date(exam.date);
                const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                // Notify if exam is within 7 days
                if (daysUntil <= 7 && daysUntil > 0) {
                  const notification = {
                    id: `guest-notification-${Date.now()}`,
                    title: `📅 Upcoming Exam`,
                    description: `${courseCode}: ${exam.name} in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
                    type: 'exam' as const,
                    priority: (daysUntil <= 2 ? 'high' : 'medium') as 'high' | 'medium',
                    classId: chat.id,
                    actionUrl: '/dashboard',
                    isRead: false,
                    createdAt: new Date().toISOString()
                  };
                  
                  if (user.isGuest) {
                    const existingNotifications = localStorage.getItem('guest-notifications');
                    let notifications = [];
                    if (existingNotifications) {
                      try {
                        notifications = JSON.parse(existingNotifications);
                      } catch (error) {
                        console.warn('Error parsing existing guest notifications:', error);
                      }
                    }
                    
                    notifications.unshift(notification);
                    if (notifications.length > 50) {
                      notifications = notifications.slice(0, 50);
                    }
                    
                    localStorage.setItem('guest-notifications', JSON.stringify(notifications));
                  } else {
                    NotificationService.createNotification({
                      title: notification.title,
                      description: notification.description,
                      type: notification.type,
                      priority: notification.priority,
                      classId: notification.classId,
                      actionUrl: notification.actionUrl
                    }, user.uid);
                  }
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error checking upcoming assignments:', error);
    }
  };
  
  // Function to update assignment status in Firebase
  const updateAssignmentStatus = async (chatId: string, assignmentName: string, newStatus: string) => {
    try {
      console.log('📝 Updating assignment status:', assignmentName, 'to', newStatus, 'in chat', chatId);
      
      // For guest users, update local chat store immediately for real-time updates
      if (user && user.isGuest) {
        console.log('📝 Guest user - updating local chat store immediately');
        // Update the local chat store immediately
        const updatedChats = { ...chats };
        if (updatedChats[chatId] && updatedChats[chatId].courseData?.assignments) {
          updatedChats[chatId].courseData.assignments = updatedChats[chatId].courseData.assignments.map((assignment: any) => {
            if (assignment.name === assignmentName) {
              console.log('📝 Found assignment to update locally:', assignment.name);
              return { ...assignment, status: newStatus };
            }
            return assignment;
          });
          
          // Update the chat store
          // Note: This would require a method in useChatStore to update chats directly
          // For now, we'll rely on the Firebase update and the listener
        }
      }
      
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        if (chatData.courseData?.assignments) {
          const updatedAssignments = chatData.courseData.assignments.map((assignment: any) => {
            if (assignment.name === assignmentName) {
              console.log('📝 Found assignment to update:', assignment.name);
              return { ...assignment, status: newStatus };
            }
            return assignment;
          });
          
          await updateDoc(chatRef, {
            'courseData.assignments': updatedAssignments
          });
          console.log('📝 Successfully updated assignment status in Firebase');
          
          // For guest users, refresh stats immediately after Firebase update
          if (user && user.isGuest && refreshStats) {
            console.log('📝 Guest user - refreshing stats after Firebase update');
            setTimeout(() => refreshStats(), 100); // Small delay to ensure Firebase listener has fired
          }
          
          // Create notification for assignment status change
          await createAssignmentNotification(assignmentName, newStatus, chatId);
        }
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };
  const classCount = Object.keys(chats).filter(key => key !== 'general-chat').length;
  const totalMessages = Object.values(chats).reduce((sum, chat) => sum + chat.messages.length, 0);
  
  // Count total assignments
  const totalAssignments = Object.values(chats)
    .filter(chat => chat.chatType === 'class' && chat.courseData?.assignments)
    .reduce((sum, chat) => sum + (chat.courseData?.assignments?.length || 0), 0);
  
  // Get real-time dashboard stats
  const { stats, isLoading: statsLoading, refreshStats } = useDashboardStats(user);
  const showTopicsReview = process.env.NEXT_PUBLIC_SHOW_TOPICS_REVIEW === 'true';
  
  // Create welcome notifications for new users
  useEffect(() => {
    if (user && !user.isGuest) {
      const createWelcomeNotifications = async () => {
        try {
          // Check if user already has notifications (to avoid creating duplicates)
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.hasWelcomeNotifications) {
              return; // Already created welcome notifications
            }
          } else {
            // Seed the user doc if it doesn't exist to avoid update errors
            await setDoc(userDocRef, { hasWelcomeNotifications: false }, { merge: true });
          }
          
          console.log('🔔 Creating welcome notifications for new user:', user.uid);
          
          // Create welcome notifications
          await NotificationService.createNotification({
            title: "🎉 Welcome to CourseConnect!",
            description: "You're all set up! Start by uploading your course syllabi to get personalized assignments and study reminders.",
            type: "system",
            priority: "high"
          }, user.uid);
          
          await NotificationService.createNotification({
            title: "📚 Upload Your Syllabi",
            description: "Upload your course syllabi to automatically track assignments, exams, and important dates.",
            type: "reminder",
            priority: "medium",
            actionUrl: "/dashboard/chat"
          }, user.uid);
          
          await NotificationService.createNotification({
            title: "💡 Pro Tip",
            description: "Use the chat to ask questions about your courses and get personalized study help.",
            type: "system",
            priority: "low",
            actionUrl: "/dashboard/chat"
          }, user.uid);
          
          // Mark that welcome notifications have been created
          await setDoc(userDocRef, { hasWelcomeNotifications: true }, { merge: true });
          
          console.log('🔔 Welcome notifications created successfully');
        } catch (error) {
          console.error('🔔 Error creating welcome notifications:', error);
        }
      };
      
      createWelcomeNotifications();
    }
  }, [user]);


  // Function to handle Firebase operations with offline fallback
  const safeFirebaseOperation = async (operation: () => Promise<any>, fallback?: () => void) => {
    try {
      return await operation();
    } catch (error: any) {
      console.log("Firebase operation failed, using fallback:", error.message);
      if (fallback) fallback();
      return null;
    }
  };

  // Auto-update assignment statuses based on user activity
  useEffect(() => {
    const newManualStatuses: {[key: string]: string} = {};
    
    Object.values(chats).forEach(chat => {
      if (chat.chatType === 'class' && chat.courseData?.assignments) {
        chat.courseData.assignments.forEach((assignment: any) => {
          const assignmentKey = `${chat.id}-${assignment.name}`;
          
          // Check if user has been active in this chat recently
          const recentMessages = chat.messages?.filter(msg => {
            const messageTime = new Date(msg.timestamp);
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return messageTime > oneWeekAgo;
          }) || [];
          
          // Auto-detect if user is working on assignment
          const hasRecentActivity = recentMessages.some(msg => 
            msg.text?.toLowerCase().includes(assignment.name?.toLowerCase() || '') ||
            msg.text?.toLowerCase().includes('homework') ||
            msg.text?.toLowerCase().includes('assignment') ||
            msg.text?.toLowerCase().includes('problem') ||
            msg.text?.toLowerCase().includes('question')
          );
          
          // Auto-update status if user is active but hasn't manually set it
          if (hasRecentActivity && !manualStatuses[assignmentKey]) {
            newManualStatuses[assignmentKey] = 'In Progress';
          }
        });
      }
    });
    
    // Update manual statuses if we found new ones
    if (Object.keys(newManualStatuses).length > 0) {
      setManualStatuses(prev => ({ ...prev, ...newManualStatuses }));
    }
  }, [chats, manualStatuses]);

  // Handle both guest and authenticated users
  useEffect(() => {
    // FIRST: Check Firebase auth for authenticated users
    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        console.log('Dashboard: Setting up auth state listener');
        const unsubscribe = auth.onAuthStateChanged(
          (user: any) => {
            console.log('Dashboard: Auth state changed - user:', user ? 'authenticated' : 'not authenticated');
            if (user) {
              // User is authenticated, clear any guest data and use real user
              localStorage.removeItem('guestUser');
              localStorage.removeItem('guest-notifications');
              localStorage.removeItem('guest-onboarding-completed');
              localStorage.removeItem('uploaded-syllabi'); // Clear uploaded syllabi when new user signs in
              setUser(user);
            } else {
              // No authenticated user, check for guest user
              const guestUserData = localStorage.getItem('guestUser');
              if (guestUserData) {
                try {
                  const guestUser = JSON.parse(guestUserData);
                  console.log("Dashboard: Found guest user in localStorage:", guestUser);
                  setUser(guestUser);
                } catch (error) {
                  console.warn("Dashboard: Error parsing guest user data:", error);
                  localStorage.removeItem('guestUser');
                  // Create new guest user
                  createGuestUser();
                }
              } else {
                // No guest user exists, create one automatically
                createGuestUser();
              }
            }
          },
          (error: any) => {
            console.warn("Dashboard: Auth state error:", error);
            // On auth error, fall back to guest user
            const guestUserData = localStorage.getItem('guestUser');
            if (guestUserData) {
              try {
                const guestUser = JSON.parse(guestUserData);
                setUser(guestUser);
              } catch (error) {
                createGuestUser();
              }
            } else {
              createGuestUser();
            }
          }
        );
        return unsubscribe;
      } else {
        // Auth not available, check for guest user
        const guestUserData = localStorage.getItem('guestUser');
        if (guestUserData) {
          try {
            const guestUser = JSON.parse(guestUserData);
            setUser(guestUser);
          } catch (error) {
            createGuestUser();
          }
        } else {
          createGuestUser();
        }
      }
    } catch (authError) {
      console.warn("Dashboard: Auth initialization error:", authError);
      // Fall back to guest user
      const guestUserData = localStorage.getItem('guestUser');
      if (guestUserData) {
        try {
          const guestUser = JSON.parse(guestUserData);
          setUser(guestUser);
        } catch (error) {
          createGuestUser();
        }
      } else {
        createGuestUser();
      }
    }

    function createGuestUser() {
      console.log("Dashboard: Creating new guest user");
      const autoGuestUser = {
        uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        displayName: "Guest User",
        email: null,
        photoURL: null,
        isAnonymous: true,
        isGuest: true
      };
      
      localStorage.setItem('guestUser', JSON.stringify(autoGuestUser));
      console.log("Dashboard: Created auto guest user:", autoGuestUser);
      setUser(autoGuestUser);
    }
  }, []);

  // Check for upcoming assignments and create notifications
  useEffect(() => {
    if (user && Object.keys(chats).length > 0) {
      // Check for upcoming assignments when chats are loaded (both guest and authenticated users)
      checkUpcomingAssignments();
    }
  }, [user, chats]);

  // Update trial days left in real-time
  useEffect(() => {
    if (trialActivated) {
      // Update immediately
      updateTrialDaysLeft();
      
      // Update every hour to keep countdown accurate
      const interval = setInterval(() => {
        updateTrialDaysLeft();
      }, 3600000); // 1 hour
      
      return () => clearInterval(interval);
    }
  }, [trialActivated, updateTrialDaysLeft]);

  // Test toast notification on mount (one time only)
  useEffect(() => {
    const hasShownTestToast = sessionStorage.getItem('test-toast-shown');
    if (!hasShownTestToast) {
      setTimeout(() => {
        toast.success("🎉 Toast Notifications Enabled!", {
          description: "You'll see notifications when you complete tasks and other actions.",
          duration: 5000,
        });
        sessionStorage.setItem('test-toast-shown', 'true');
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-8">
        {/* Daily Briefing - Personalized morning update */}
        <DailyBriefing user={user} stats={stats} />

        {/* Stats - Standard Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Study Time */}
          <Card className="bg-white dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/80 hover:shadow-md transition-all backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600 flex items-center justify-center">
                    <Clock01Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Time</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {statsLoading ? '...' : `${Math.floor(stats.studyTimeToday / 60)}h ${stats.studyTimeToday % 60}m`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="bg-white dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/80 hover:shadow-md transition-all backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 flex items-center justify-center">
                    <Target01Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Done</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {statsLoading ? '...' : stats.assignmentsCompleted}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 border-purple-200/60 dark:border-purple-800/60 hover:shadow-md transition-all relative overflow-hidden">
            <CardContent className="p-5 relative z-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 dark:from-purple-600 dark:via-pink-600 dark:to-rose-600 flex items-center justify-center rounded-2xl shadow-sm">
                    <Award01Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">Streak</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {statsLoading ? '...' : stats.studyStreak}
                  </p>
                  {!statsLoading && stats.studyStreak > 0 && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">🔥 On fire!</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Soon */}
          <Card className="bg-white dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/80 hover:shadow-md transition-all backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 dark:from-orange-500 dark:to-red-600 flex items-center justify-center">
                    <Calendar01Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Due</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {statsLoading ? '...' : stats.upcomingDeadlines}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda - Timeline View */}
        <DashboardAgenda />

        {/* What to Focus On - AI Study Suggestions */}
        <div className="mt-12 lg:mt-16">
          <StudyFocusSuggestions />
        </div>

        {/* Course Chat Summaries */}
        <div className="mt-14 lg:mt-18">
          <ChatSummariesDashboard />
        </div>

        {/* Topics to Review (lightweight, signal-driven) */}
        {showTopicsReview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/40">
                  <AnalyticsUpIcon className="h-5 w-5 text-pink-600" />
                </div>
                Topics waiting for you
              </CardTitle>
              <CardDescription>Based on your syllabus and recent chat activity</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                try {
                  const now = new Date();
                  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                  // Collect topic candidates from syllabus across class chats
                  const topicSet = new Set<string>();
                  Object.values(chats).forEach((chat: any) => {
                    if (chat?.chatType === 'class' && Array.isArray(chat?.courseData?.topics)) {
                      chat.courseData.topics.forEach((t: any) => {
                        if (typeof t === 'string' && t.trim()) topicSet.add(t.trim());
                      });
                    }
                  });

                  const topics = Array.from(topicSet);
                  if (topics.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Upload a syllabus to see topics waiting for you. Once you start chatting, I'll highlight what to focus on.
                        </p>
                      </div>
                    );
                  }

                  // Compute simple priority using recent user messages + upcoming assignments
                  const topicScores = topics.map((topic) => {
                    let frequency = 0; // count of user messages mentioning topic in last 7 days
                    let recencyBoost = 0; // +1 if mentioned in last 24h
                    let urgency = 0; // +1..+2 for assignments due soon mentioning topic

                    Object.values(chats).forEach((chat: any) => {
                      // Count message mentions (user only)
                      (chat?.messages || []).forEach((msg: any) => {
                        if (msg?.sender !== 'user') return;
                        const ts = msg?.timestamp ? new Date(msg.timestamp) : null;
                        const text = (typeof msg?.text === 'string' ? msg.text : '') || '';
                        if (!ts || ts < sevenDaysAgo) return;
                        if (text.toLowerCase().includes(topic.toLowerCase())) {
                          frequency += 1;
                          if ((now.getTime() - ts.getTime()) <= 24 * 60 * 60 * 1000) recencyBoost = 1;
                        }
                      });

                      // Urgency from assignments
                      (chat?.courseData?.assignments || []).forEach((a: any) => {
                        if (!a?.dueDate || a?.dueDate === 'null') return;
                        const d = new Date(a.dueDate);
                        if (isNaN(d.getTime())) return;
                        const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (days >= 0 && days <= 7) {
                          const name = (a?.name || '').toString();
                          const desc = (a?.description || '').toString();
                          if ((name + ' ' + desc).toLowerCase().includes(topic.toLowerCase())) {
                            urgency += days <= 2 ? 2 : 1;
                          }
                        }
                      });
                    });

                    const score = frequency + recencyBoost + urgency; // higher = higher priority
                    return { topic, score, frequency, recencyBoost, urgency };
                  })
                  .filter(t => t.score > 0)
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5);

                  if (topicScores.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          No priority topics detected yet. Ask questions in chat or add assignments, and I'll highlight what needs your attention.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-2">
                      {topicScores.map(({ topic }) => {
                        const prefill = encodeURIComponent(`Help me review ${topic}`);
                        return (
                          <Link key={topic} href={`/dashboard/chat?prefill=${prefill}`}>
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                              {topic}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                } catch (e) {
                  return (
                    <p className="text-sm text-muted-foreground">Unable to compute topics to review.</p>
                  );
                }
              })()}
            </CardContent>
          </Card>
        </div>
        )}


        {/* Pro Features CTA - Hidden */}
        {/* <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                  <CrownIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unlock Pro Features</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get access to specialized tutors, voice input, and more</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Dialog open={isAdvancedDialogOpen} onOpenChange={setIsAdvancedDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                      <CrownIcon className="h-4 w-4 mr-2" />
                      Try Free
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CrownIcon className="h-5 w-5 text-purple-600" />
                        Unlock Pro Features
                      </DialogTitle>
                      <DialogDescription>
                        Get access to specialized tutors, voice input, image analysis, grade predictions, and more.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">Pro Features Include:</h4>
                        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                          <li>• Specialized tutors for different subjects</li>
                          <li>• Voice input & image analysis</li>
                          <li>• Grade prediction system</li>
                          <li>• Google Calendar integration</li>
                          <li>• Spotify focus music</li>
                          <li>• Enhanced study groups</li>
                          <li>• Break reminders</li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                          <Link href="/features" onClick={() => setIsAdvancedDialogOpen(false)}>
                            <CrownIcon className="h-4 w-4 mr-2" />
                            View Features
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/features" onClick={() => setIsAdvancedDialogOpen(false)}>
                            View Features
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('demo-break-trigger'));
                  }}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  ☕ Try Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card> */}


        {/* Upload Syllabus Prompt - Asymmetric, hand-crafted feel */}
        {Object.values(chats).filter((chat: any) => chat.chatType === 'class').length === 0 && (
          <div className="relative mb-8 lg:mb-12">
            <div className="bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/30 dark:via-sky-950/20 dark:to-blue-950/20 border-2 border-cyan-200/70 dark:border-cyan-800/70 rounded-[2rem] p-8 lg:p-12 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/15 dark:bg-cyan-800/15 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300/15 dark:bg-blue-800/15 rounded-full blur-2xl -ml-24 -mb-24"></div>
              <div className="relative z-10 max-w-lg mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600 w-24 h-24 flex items-center justify-center shadow-2xl">
                    <HugeiconsIcon icon={FolderUploadIcon} className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4 text-center leading-tight">
                  Upload Your First<br />Syllabus
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center leading-relaxed font-normal">
                  Get started by uploading your course syllabus to see assignments, exams, and track your study progress!
                </p>
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4 text-base text-gray-800 dark:text-gray-200">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 flex-shrink-0 shadow-sm"></div>
                    <span className="font-medium">Track assignments and due dates</span>
                  </div>
                  <div className="flex items-start gap-4 text-base text-gray-800 dark:text-gray-200">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 flex-shrink-0 shadow-sm"></div>
                    <span className="font-medium">Monitor upcoming exams</span>
                  </div>
                  <div className="flex items-start gap-4 text-base text-gray-800 dark:text-gray-200">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 flex-shrink-0 shadow-sm"></div>
                    <span className="font-medium">Track study time and streaks</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-cyan-500/30 dark:shadow-cyan-900/50 font-bold text-base px-8 py-6 rounded-2xl">
                    <Link href="/dashboard/upload">
                      <HugeiconsIcon icon={FolderUploadIcon} className="h-5 w-5 mr-2" />
                      Upload Syllabus
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Study Groups Section - Hidden */}
        {/* <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
              </div>
              Study Groups
            </CardTitle>
            <CardDescription>Connect with classmates and join study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {classCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <BookOpen01Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">You have {classCount} active class{classCount !== 1 ? 'es' : ''}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to view and join study groups</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/dashboard/overview">View Classes</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
                  <BookOpen01Icon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">No study groups yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Upload a syllabus to find and join study groups</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/dashboard/upload">
                    <HugeiconsIcon icon={FolderUploadIcon} className="mr-2 h-4 w-4" />
                    Upload Syllabus
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card> */}

      </div>
      
      {/* PWA Install Prompt */}
      
    </div>
  );
}
