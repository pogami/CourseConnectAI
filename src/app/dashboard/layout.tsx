
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home01Icon,
  UserGroupIcon,
  FileAddIcon,
  Chatting01Icon,
  Notification01Icon,
  NoteIcon,
  Alert01Icon,
  Speaker01Icon,
  Cancel01Icon,
  Book01Icon,
  Camera01Icon
} from "hugeicons-react";
import { MessageSquare } from "lucide-react";
import { GlobalCommandMenu } from "@/components/global-command-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { WebsiteTimeTracker } from "@/components/website-time-tracker";
import { HideAISupport } from "@/components/hide-ai-support";
import Image from "next/image";
import type { Auth } from "firebase/auth";
import { signInAnonymously } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from "react";
import { useChatStore } from "@/hooks/use-chat-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OnboardingSlideshow } from "@/components/onboarding-slideshow";
import { ClientThemeToggle } from "@/components/client-theme-toggle";
import { NotificationToastListener } from "@/components/notification-toast-listener";
import { toast } from "sonner";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams?.get('tab') || searchParams?.get('chatId') || '';
  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
  
  // Safely handle auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Start as true to wait for auth to restore
  const [error, setError] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted flag on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run until mounted on client
    
    // Increased timeout to 10 seconds to allow Firebase auth to propagate
    // If timeout occurs, gracefully fall back to guest mode instead of showing error
    const authTimeout = setTimeout(() => {
      console.warn('Dashboard: Auth initialization timeout, proceeding in guest mode');
      setLoading(false);
      // Don't set error - just proceed in guest mode
      setError(null);
      // Check for guest user as fallback
      const guestUserData = localStorage.getItem('guestUser');
      if (guestUserData) {
        try {
          const guestUser = JSON.parse(guestUserData);
          setUser(guestUser);
        } catch (error) {
          console.warn("Dashboard: Error parsing guest user data on timeout:", error);
        }
      }
    }, 10000); // 10 second timeout - more lenient

    // Check for guest user first (faster than Firebase auth)
    const guestUserData = localStorage.getItem('guestUser');
    if (guestUserData) {
      try {
        const guestUser = JSON.parse(guestUserData);
        console.log("Dashboard: Found guest user in localStorage:", guestUser);
        setUser(guestUser);
        setLoading(false);
        setError(null);
        clearTimeout(authTimeout);
        return; // Exit early for guest users
      } catch (error) {
        console.warn("Dashboard: Error parsing guest user data:", error);
        localStorage.removeItem('guestUser');
      }
    }

    // Safely handle auth state for authenticated users
    try {
      const { auth } = require("@/lib/firebase/client-simple") as { auth: Auth };
      const safeAuth = auth as Auth | undefined;
      if (safeAuth && typeof safeAuth.onAuthStateChanged === 'function') {
        console.log('Dashboard: Setting up auth state listener');
        const unsubscribe = safeAuth.onAuthStateChanged(
          (user: any) => {
            clearTimeout(authTimeout); // Clear timeout when auth resolves
            console.log('Dashboard: Auth state changed - user:', user ? 'authenticated' : 'not authenticated');
            
            // Check if we're in the middle of a logout process
            const isLoggingOut = localStorage.getItem('isLoggingOut');
            if (isLoggingOut === 'true') {
              console.log('Dashboard: Logout in progress, skipping auth state update');
              return;
            }
            
            // ALWAYS check localStorage first - it's the source of truth for guest data
            const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
            
            // If we have guest data in localStorage, merge it with Firebase user (if exists)
            if (guestData) {
              try {
                const parsedGuest = JSON.parse(guestData);
                
                // If Firebase user exists (anonymous or otherwise), merge them
                if (user) {
                  // Merge: Firebase user properties + localStorage guest data (localStorage takes precedence for displayName)
                  const mergedUser = {
                    ...user,
                    ...parsedGuest, // Spread guest data to override Firebase user properties
                    uid: user.uid || parsedGuest.uid, // Keep Firebase uid if available
                    isGuest: true,
                    isAnonymous: user.isAnonymous || true
                  };
                  setUser(mergedUser);
                  console.log('Dashboard layout: Merged Firebase user with localStorage guest data:', mergedUser.displayName);
                } else {
                  // No Firebase user, use localStorage guest data directly
                  setUser(parsedGuest);
                  console.log('Dashboard layout: Using localStorage guest data (no Firebase user):', parsedGuest.displayName);
                }
              } catch (parseError) {
                console.warn('Dashboard layout: Failed to parse guest data during merge:', parseError);
                // Fallback: use Firebase user if available
                setUser(user);
              }
            } else {
              // No guest data in localStorage - use Firebase user as-is
              setUser(user);
            }
            
            setLoading(false);
            setError(null);

            // Ensure anonymous auth for Firestore rules if not logged in and not explicitly a guest
            try {
              const hasGuest = !!localStorage.getItem('guestUser');
              if (!user && !hasGuest) {
                console.log('Dashboard: No user detected, performing anonymous sign-in for permissions');
                signInAnonymously(safeAuth).catch(() => {
                  // ignore errors (e.g., if disabled); app still works in guest mode
                });
              }
            } catch {}
          },
          (error: any) => {
            clearTimeout(authTimeout); // Clear timeout when auth resolves (even with error)
            console.warn("Dashboard: Auth state error:", error);
            setUser(null);
            setLoading(false);
            setError(error);
          }
        );
        
        // Return cleanup function that clears both timeout and unsubscribe
        return () => {
          clearTimeout(authTimeout);
          if (unsubscribe) unsubscribe();
        };
      } else {
        clearTimeout(authTimeout);
        console.warn('Dashboard: Auth not available');
        setUser(null);
        setLoading(false);
        setError(null);
      }
    } catch (authError) {
      clearTimeout(authTimeout);
      console.warn("Dashboard: Auth initialization error:", authError);
      setUser(null);
      setLoading(false);
      setError(authError);
    }
  }, [mounted]);

  // Listen for guest name updates
  useEffect(() => {
    if (!mounted) return;
    
    const handleGuestNameUpdate = () => {
      const guestData = typeof window !== 'undefined' ? localStorage.getItem('guestUser') : null;
      if (guestData) {
        try {
          const parsedGuest = JSON.parse(guestData);
          // Get current Firebase user (if exists) to merge with guest data
          const { auth } = require("@/lib/firebase/client-simple") as { auth: Auth };
          const currentFirebaseUser = auth?.currentUser;
          
          if (currentFirebaseUser) {
            // Merge: Firebase user + localStorage guest data (localStorage takes precedence)
            const mergedUser = {
              ...currentFirebaseUser,
              ...parsedGuest, // Spread guest data to override Firebase user properties
              uid: currentFirebaseUser.uid || parsedGuest.uid, // Keep Firebase uid
              isGuest: true,
              isAnonymous: currentFirebaseUser.isAnonymous || true
            };
            setUser(mergedUser);
            console.log('Dashboard layout: Merged Firebase user with updated guest data:', mergedUser.displayName);
          } else {
            // No Firebase user, use localStorage guest data directly
            setUser(parsedGuest);
            console.log('Dashboard layout: Updated guest data (no Firebase user):', parsedGuest.displayName);
          }
        } catch (parseError) {
          console.warn('Dashboard layout: Failed to parse guest user data:', parseError);
        }
      }
    };

    window.addEventListener('guestNameUpdated', handleGuestNameUpdate);
    return () => window.removeEventListener('guestNameUpdated', handleGuestNameUpdate);
  }, [mounted]);
  
  // Close sidebar on navigation (mobile)
  useEffect(() => {
    // Close sidebar when pathname changes on mobile
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (isMobile) {
      // Find and close any open sidebar/sheet
      const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
      if (sidebarTrigger) {
        // Trigger click to close sidebar
        (sidebarTrigger as HTMLElement).click();
      }
    }
  }, [pathname]);
  
  const { chats, showUpgrade, setShowUpgrade, isGuest, isDemoMode, setIsDemoMode, addChat, setCurrentTab } = useChatStore();
  
  // Auto-create course chat from saved syllabus data after signup (HOMEPAGE ONLY)
  useEffect(() => {
    if (!user || isGuest) return; // Only for authenticated users
    
    const createCourseFromSavedData = async () => {
      try {
        // Check for saved course data from homepage syllabus upload
        const savedCourseData = sessionStorage.getItem('cc-course-context-card');
        if (!savedCourseData) return;
        
        // Additional check: Only create if this is a fresh signup (not an existing user)
        // This prevents creating chats for existing users who might have stale sessionStorage
        const isNewSignup = localStorage.getItem('cc-new-signup') === 'true';
        if (!isNewSignup) {
          console.log('🚫 Not a new signup, skipping auto-creation');
          sessionStorage.removeItem('cc-course-context-card'); // Clean up stale data
          return;
        }
        
        console.log('🎓 Found saved course data after homepage signup!');
        const courseData = JSON.parse(savedCourseData);
        
        // Create course chat
        const chatTitle = `${courseData.courseCode} - ${courseData.courseName}`;
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: `Welcome to your ${courseData.courseName} course chat! I'm your AI tutor with full context about your syllabus. I can help you with:\n\n• Course topics and concepts\n• Assignment deadlines and requirements\n• Exam preparation\n• Study strategies\n• Any questions about the course material\n\nWhat would you like to know about ${courseData.courseName}?`,
          timestamp: Date.now()
        };
        
        const uniqueChatId = `${courseData.courseCode}-${courseData.courseName}-${Date.now()}`;
        
        console.log('✅ Creating course chat:', chatTitle);
        
        // Create the chat
        await addChat(chatTitle, welcomeMessage, uniqueChatId, 'class', {
          courseName: courseData.courseName,
          courseCode: courseData.courseCode,
          professor: courseData.professor || 'Unknown Professor',
          topics: courseData.topics || [],
        });
        
        // Clear the saved data
        sessionStorage.removeItem('cc-course-context-card');
        localStorage.removeItem('cc-new-signup'); // Clear the new signup flag
        
        // Show success message
        toast.success('Course Chat Created!', {
          description: `Your ${courseData.courseName} chat is ready. Let's start learning!`,
          duration: 5000,
        });
        
        // Redirect to the new chat
        setTimeout(() => {
          setCurrentTab(uniqueChatId);
          router.push(`/dashboard/chat?tab=${uniqueChatId}`);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to create course chat from saved data:', error);
        // Clear the data anyway to prevent retry loops
        sessionStorage.removeItem('cc-course-context-card');
        localStorage.removeItem('cc-new-signup');
      }
    };
    
    createCourseFromSavedData();
  }, [user, isGuest, addChat, setCurrentTab, router]);
  const [guestUser, setGuestUser] = useState<any>(null);
  const [isProUser, setIsProUser] = useState(false); // Demo access - set to true for demo
  
  // Check if user has subscription (this would typically come from your payment system)
  const checkUserSubscription = () => {
    // For now, we'll assume no one has a subscription unless they're in demo mode
    // In a real app, this would check your payment system or user database
    return false;
  };

  // Check for guest user in localStorage
  useEffect(() => {
    const storedGuest = localStorage.getItem('guestUser');
    console.log("Checking for guest user in localStorage:", storedGuest);
    if (storedGuest) {
      try {
        const parsedGuest = JSON.parse(storedGuest);
        console.log("Parsed guest user:", parsedGuest);
        setGuestUser(parsedGuest);
      } catch (error) {
        console.error("Error parsing guest user:", error);
        localStorage.removeItem('guestUser');
      }
    }
  }, []);

  useEffect(() => {
    // Only check redirect after loading is complete
    // Firebase needs time to restore the session from localStorage/indexedDB
    if (!loading && !user) {
      // Check if user just logged in (give it more time to load)
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      if (justLoggedIn === 'true') {
        console.log("User just logged in, waiting for auth to load...");
        // Give more time for Firebase to process the redirect result
        const checkAuthTimeout = setTimeout(() => {
          // If still no user after 5 seconds, might be an issue
          // But don't redirect to login - let the login page handle it
        }, 5000);
        return () => clearTimeout(checkAuthTimeout);
      }
      
      // Give Firebase auth MORE time to restore session (increased from 1s to 3s)
      // Firebase auth restoration happens asynchronously and can take time
      const timeoutId = setTimeout(() => {
        // Double-check: Make sure Firebase hasn't restored a user since we started the timeout
        const storedGuest = localStorage.getItem('guestUser');
        const isLoggingOut = localStorage.getItem('isLoggingOut');
        const stillJustLoggedIn = sessionStorage.getItem('justLoggedIn');
        
        // Don't redirect if logout is in progress or if user just logged in
        if (isLoggingOut === 'true' || stillJustLoggedIn === 'true') {
          console.log("Logout in progress or just logged in, skipping redirect");
          return;
        }
        
        // Check if we have a guest user OR if auth state listener hasn't fired yet
        // Firebase auth persists sessions automatically, so if there's no user after 3 seconds,
        // they're truly not logged in
        if (!storedGuest) {
          // No user and no guest, redirect to login
          console.log("No user and no guest found after timeout, redirecting to login");
          router.push('/login');
        } else {
          console.log("Guest user found in localStorage:", storedGuest);
        }
      }, 3000); // Increased to 3 seconds to give Firebase time to restore session
      
      return () => clearTimeout(timeoutId);
    } else if (user) {
      // Clear the flag once user is loaded
      sessionStorage.removeItem('justLoggedIn');
    }
  }, [user, loading, router, pathname]);

  // Check for onboarding flag
  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed onboarding
      const onboardingCompleted = localStorage.getItem('onboarding-completed');
      const shouldShowOnboarding = localStorage.getItem('showOnboarding');
      
      // Show onboarding if:
      // 1. User hasn't completed onboarding yet, OR
      // 2. Manual trigger flag is set
      if (!onboardingCompleted || shouldShowOnboarding === 'true') {
        setShowOnboarding(true);
        localStorage.removeItem('showOnboarding');
      }
    }
  }, [user, loading]);

  // Listen for custom event to show onboarding (from Tips button)
  useEffect(() => {
    const handleShowOnboarding = () => {
      setShowOnboarding(true);
    };

    window.addEventListener('showOnboarding', handleShowOnboarding);
    return () => {
      window.removeEventListener('showOnboarding', handleShowOnboarding);
    };
  }, []);

  // Show welcome toast for new users
  useEffect(() => {
    if (!loading && user) {
      const justSignedUp = sessionStorage.getItem('justSignedUp');
      if (justSignedUp === 'true') {
        // Clear the flag immediately
        sessionStorage.removeItem('justSignedUp');
        
        // Show welcome toast after a short delay (so page loads first)
        setTimeout(() => {
          toast.success('🎉 Welcome to CourseConnect!', {
            description: 'Your AI-powered learning companion is ready to help you ace your courses! Upload your syllabus to get started.',
            duration: 10000,
          });
        }, 500);
      }
    }
  }, [user, loading]);

  // Guest users can now upload unlimited syllabi without restrictions


   // Only show loading on client side to prevent hydration mismatch
   if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold mb-2">Loading Dashboard</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Alert01Icon className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-red-600">Authentication Error</h2>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Allow guest users to access the dashboard without restrictions
  // Guest users can explore the platform freely


  return (
    <SidebarProvider className="bg-white dark:bg-background min-h-screen">
        <Sidebar className="sm:translate-x-0 bg-white dark:bg-sidebar border-r border-gray-200/50 dark:border-sidebar-border shadow-xl">
          <SidebarHeader className="group-data-[collapsible=icon]:justify-center p-6 border-b border-gray-100 dark:border-sidebar-border bg-white dark:bg-transparent">
             <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-all duration-200">
                <Image 
                  src="/pageicon.png?v=4"
                  alt="CourseConnect Logo"
                  width={40}
                  height={40}
                  className="object-contain transition-all group-data-[collapsible=icon]:size-7" 
                />
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                  CourseConnect <span className="text-blue-500">AI</span>
                </span>
             </Link>
          </SidebarHeader>
          <SidebarContent className="bg-white dark:bg-transparent">
            <SidebarMenu className="space-y-2 p-4">
              {/* Home */}
              <SidebarMenuItem>
                <Link 
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    pathname === "/dashboard" 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 shadow-sm" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <Home01Icon className="size-5" />
                  <span className="font-semibold text-sm">Home</span>
                </Link>
              </SidebarMenuItem>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-sidebar-border my-4" />

              {/* My Courses Section */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  My Courses
                </p>
              </div>

              {/* Permanent General Chat (if present) */}
              {(() => {
                const generalIds = [
                  'private-general-chat',
                  'public-general-chat',
                  'private-general-chat-guest'
                ];
                const existingGeneral = generalIds.find(id => !!chats[id]);
                if (!existingGeneral) return null;
                const generalChat = chats[existingGeneral as keyof typeof chats];
                return (
                  <SidebarMenuItem key={existingGeneral}>
                    <Link 
                      href={`/dashboard/chat?tab=general`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        pathname.includes(String(existingGeneral))
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 shadow-sm" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      } ${activeChatId === 'general' || activeChatId === String(existingGeneral) ? 'border-2 border-dashed border-blue-300 dark:border-blue-700' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">G</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">General Chat</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Always-on</p>
                      </div>
                    </Link>
                  </SidebarMenuItem>
                );
              })()}

              {/* List courses from chats (class chats) */}
              {Object.values(chats).filter((chat: any) => {
                // Show if it has chatType 'class' OR has courseData (legacy support)
                return chat.chatType === 'class' || !!chat.courseData;
              }).map((chat: any) => (
                <SidebarMenuItem key={chat.id}>
                  <Link 
                    href={`/dashboard/chat?tab=${encodeURIComponent(chat.id)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      pathname.includes(chat.id)
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 shadow-sm" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    } ${activeChatId === String(chat.id) ? 'border-2 border-dashed border-blue-300 dark:border-blue-700' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {chat.courseData?.courseCode?.charAt(0) || 'C'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chat.courseData?.courseCode || chat.title}
                      </p>
                      {(() => {
                        const assignments = chat.courseData?.assignments || [];
                        if (!Array.isArray(assignments) || assignments.length === 0) return null;
                        
                        const completed = assignments.filter((a: any) => a.status === 'Completed').length;
                        const total = assignments.length;
                        const upcoming = assignments.filter((a: any) => {
                          if (a.status === 'Completed') return false;
                          if (!a.dueDate) return true;
                          const dueDate = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
                          return dueDate >= new Date();
                        });
                        
                        // Get next assignment
                        const nextAssignment = upcoming
                          .filter((a: any) => a.dueDate)
                          .sort((a: any, b: any) => {
                            const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
                            const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
                            return dateA.getTime() - dateB.getTime();
                          })[0];
                        
                        if (nextAssignment?.dueDate) {
                          const dueDate = nextAssignment.dueDate?.toDate ? nextAssignment.dueDate.toDate() : new Date(nextAssignment.dueDate);
                          const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (daysUntil < 0) {
                            return <p className="text-xs text-red-500 dark:text-red-400">⚠️ Assignment overdue</p>;
                          } else if (daysUntil === 0) {
                            return <p className="text-xs text-orange-500 dark:text-orange-400">📅 Assignment due today</p>;
                          } else if (daysUntil === 1) {
                            return <p className="text-xs text-orange-500 dark:text-orange-400">📅 Assignment due tomorrow</p>;
                          } else if (daysUntil <= 7) {
                            return <p className="text-xs text-yellow-600 dark:text-yellow-400">📅 Assignment due in {daysUntil} days</p>;
                          } else {
                            return <p className="text-xs text-gray-500 dark:text-gray-400">📅 Assignment due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>;
                          }
                        }
                        
                        // Fallback to progress if no due dates
                        if (upcoming.length > 0) {
                          return <p className="text-xs text-blue-500 dark:text-blue-400">{upcoming.length} assignment{upcoming.length !== 1 ? 's' : ''} upcoming</p>;
                        }
                        
                        return <p className="text-xs text-green-500 dark:text-green-400">✓ All work completed</p>;
                      })()}
                    </div>
                  </Link>
                </SidebarMenuItem>
              ))}
              
              {/* View All Courses Link - Only show if more than 5 courses */}
              {Object.values(chats).filter((chat: any) => chat.chatType === 'class' || !!chat.courseData).length > 5 && (
                <SidebarMenuItem>
                  <Link 
                    href="/dashboard/overview"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <span className="text-xs font-medium">View All Courses ({Object.values(chats).filter((chat: any) => chat.chatType === 'class').length})</span>
                  </Link>
                </SidebarMenuItem>
              )}
              
              {/* Add Course */}
              <SidebarMenuItem>
                <Link 
                  href="/dashboard/upload"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-2 border-dashed ${
                    isActive("/dashboard/upload") 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 border-blue-300" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <FileAddIcon className="size-5" />
                  <span className="font-medium text-sm">Add Course</span>
                </Link>
              </SidebarMenuItem>

              {/* Class Chats link removed: chats are accessible via My Courses */}
              
              <SidebarMenuItem>
                <Link 
                  href="/dashboard/overview"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive("/dashboard/overview") 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`p-2 rounded-md transition-all duration-200 ${
                    isActive("/dashboard/overview") 
                      ? "bg-blue-100 dark:bg-blue-900/50" 
                      : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  }`}>
                    <UserGroupIcon className="size-4" />
                  </div>
                  <span className="font-medium text-sm">Classes Overview</span>
                </Link>
              </SidebarMenuItem>
              
              {/* COURSE FEED - COMMENTED OUT */}
              {/* <SidebarMenuItem>
                <Link 
                  href="/dashboard/course-feeds"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive("/dashboard/course-feeds") 
                      ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`p-2 rounded-md transition-all duration-200 ${
                    isActive("/dashboard/course-feeds") 
                      ? "bg-purple-100 dark:bg-purple-900/50" 
                      : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  }`}>
                    <MessageSquare className="size-4" />
                  </div>
                  <span className="font-medium text-sm">Course Feeds</span>
                </Link>
              </SidebarMenuItem> */}
              
              <SidebarMenuItem>
                <Link 
                  href="/dashboard/flashcards"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive("/dashboard/flashcards") 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`p-2 rounded-md transition-all duration-200 ${
                    isActive("/dashboard/flashcards") 
                      ? "bg-blue-100 dark:bg-blue-900/50" 
                      : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  }`}>
                    <NoteIcon className="size-4" />
                  </div>
                  <span className="font-medium text-sm">Flashcards</span>
                </Link>
              </SidebarMenuItem>

              {/* Academic Tools - HIDDEN */}
              {/* <SidebarMenuItem>
                <Link 
                  href="/dashboard/academic-tools"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive("/dashboard/academic-tools") 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`p-2 rounded-md transition-all duration-200 ${
                    isActive("/dashboard/academic-tools") 
                      ? "bg-blue-100 dark:bg-blue-900/50" 
                      : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  }`}>
                    <Book01Icon className="size-4" />
                  </div>
                  <span className="font-medium text-sm">Citation & Plagiarism</span>
                </Link>
              </SidebarMenuItem> */}
              
              
              <SidebarMenuItem>
                <Link 
                  href="/dashboard/notifications"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive("/dashboard/notifications") 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`p-2 rounded-md transition-all duration-200 ${
                    isActive("/dashboard/notifications") 
                      ? "bg-blue-100 dark:bg-blue-900/50" 
                      : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  }`}>
                    <Notification01Icon className="size-4" />
                  </div>
                  <span className="font-medium text-sm">Notifications</span>
                </Link>
              </SidebarMenuItem>
              
              {/* Advanced AI Tab - HIDDEN */}
              {/* {(checkUserSubscription() || isDemoMode) && (
                <SidebarMenuItem>
                  <Link 
                    href="/dashboard/advanced"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive("/dashboard/advanced") 
                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className={`p-2 rounded-md transition-all duration-200 ${
                      isActive("/dashboard/advanced") 
                        ? "bg-purple-100 dark:bg-purple-900/50" 
                        : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                    }`}>
                    </div>
                    <span className="font-medium text-sm">Advanced AI</span>
                  </Link>
                </SidebarMenuItem>
              )} */}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-gray-100 dark:border-sidebar-border bg-white dark:bg-sidebar">
            <div className="flex flex-col items-center justify-center gap-1.5 py-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                  Built for Students
                </p>
              </div>
              <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 tracking-wider">Beta v1.0.4</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white/90 to-blue-50/70 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 mx-auto h-[600px] w-[600px] -translate-y-40 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
            />
          </div>
          {/* Header with Hamburger Menu - Always Visible */}
          <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" />
                <Link href="/dashboard" className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <ClientThemeToggle />
                <DashboardHeader user={user || guestUser} />
              </div>
            </div>
          </header>
          <main
            className={`relative flex-1 ${pathname === '/dashboard/chat' ? '' : 'px-4 py-8 sm:px-8 lg:px-12'}`}
          >
            {pathname !== '/dashboard/chat' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 rounded-3xl border border-white/60 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/5 dark:bg-gray-950/60 dark:shadow-[0_25px_80px_rgba(2,6,23,0.65)]"
              />
            )}
            <div
              className={`relative ${pathname === '/dashboard/chat' ? 'h-full' : 'mx-auto w-full max-w-7xl space-y-8'}`}
            >
              {children}
            </div>
          </main>
        </SidebarInset>

        {/* Onboarding Slideshow */}
        <OnboardingSlideshow 
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => setShowOnboarding(false)}
        />
        
        {/* Global Command Menu (⌘K) */}
        <GlobalCommandMenu />
        
        {/* Notification Toast Listener */}
        {/* <NotificationToastListener /> */}
        
        {/* Website Time Tracker */}
        <WebsiteTimeTracker />
        
        {/* Hide AI Support */}
        <HideAISupport />
        
        
      </SidebarProvider>
  );
}
