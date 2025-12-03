"use client";

import { useState, useEffect } from "react";
import { 
  ThumbsUp, ThumbsDown, Clock, MessageSquare, Download, Trash2, ArrowLeft, Bug, ExternalLink,
  Users, Shield, BarChart3, Zap, Ban, UserX, Flag, TrendingUp, Activity, Eye, EyeOff,
  Settings, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client-simple";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";

interface FeedbackItem {
  rating: 'positive' | 'negative';
  comment?: string;
  messageId: string;
  chatId: string;
  timestamp: number;
  aiContent?: string;
}

interface BugReport {
  type: 'bug';
  title: string;
  description: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastActive?: number;
  school?: string;
  major?: string;
  banned?: boolean;
}

interface ChatMessage {
  chatId: string;
  messageCount: number;
  lastActivity: number;
  flagged?: boolean;
  users: string[];
}

export default function AdminDashboard() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Feedback & Bug Reports
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(false);
  const [newBugAlert, setNewBugAlert] = useState(false);
  
  // User Management
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Content Moderation
  const [flaggedChats, setFlaggedChats] = useState<ChatMessage[]>([]);
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalChats: 0,
    totalMessages: 0,
    syllabusUploads: 0
  });
  
  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    interactiveQuizzes: true,
    fullExams: true,
    flashcards: true,
    communityChat: true,
    fileUploads: true,
    aiChat: true,
    syllabusParser: true,
    darkMode: true
  });

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security check: require environment variable to be set
    if (!ADMIN_PASSWORD) {
      setError('Admin access is not configured. Please set NEXT_PUBLIC_ADMIN_PASSWORD environment variable.');
      return;
    }
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Access denied.');
      setPassword('');
    }
  };

  // Load feedback and bug reports
  useEffect(() => {
    if (!isAuthenticated) return;
    loadFeedback();
    loadBugReports();
    loadUsers();
    loadAnalytics();
    loadFeatureFlags();
    
    const handleFeedbackAdded = (event: any) => {
      loadFeedback();
      setNewFeedbackAlert(true);
      setTimeout(() => setNewFeedbackAlert(false), 3000);
    };
    
    const handleBugReported = (event: any) => {
      loadBugReports();
      setNewBugAlert(true);
      setTimeout(() => setNewBugAlert(false), 3000);
    };
    
    window.addEventListener('feedbackAdded', handleFeedbackAdded);
    window.addEventListener('bugReported', handleBugReported);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cc-ai-feedback') loadFeedback();
      if (e.key === 'bug-reports') loadBugReports();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('feedbackAdded', handleFeedbackAdded);
      window.removeEventListener('bugReported', handleBugReported);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  const loadFeedback = () => {
    try {
      const stored = localStorage.getItem('cc-ai-feedback');
      if (stored) {
        setFeedback(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load feedback:', e);
    }
  };

  const loadBugReports = () => {
    try {
      const stored = localStorage.getItem('bug-reports');
      if (stored) {
        setBugReports(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load bug reports:', e);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use admin API endpoint to bypass Firestore security rules
      const response = await fetch(`/api/admin/users?password=${encodeURIComponent(ADMIN_PASSWORD)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch users`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      
      // Show info message if Admin SDK isn't configured
      if (data.message && data.users?.length === 0) {
        console.warn('Admin SDK not configured:', data.message);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setUsers([]);
      // Show user-friendly error message
      alert(`Failed to load users: ${error.message || "Unable to fetch user list. The Firebase Admin SDK may not be configured."}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const chatStorage = localStorage.getItem('chat-storage');
      let totalChats = 0;
      let totalMessages = 0;
      let syllabusUploads = 0;

      if (chatStorage) {
        const parsed = JSON.parse(chatStorage);
        const chats = parsed?.state?.chats || {};
        totalChats = Object.keys(chats).length;
        syllabusUploads = Object.values(chats).filter((c: any) => c.chatType === 'class').length;
        totalMessages = Object.values(chats).reduce((sum: number, chat: any) => sum + (chat.messages?.length || 0), 0);
      }

      const usersRef = collection(db as any, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const activeToday = usersSnapshot.docs.filter(doc => {
        const lastActive = doc.data().lastActive;
        return lastActive && lastActive > oneDayAgo;
      }).length;

      setAnalytics({
        totalUsers,
        activeToday,
        totalChats,
        totalMessages,
        syllabusUploads
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadFeatureFlags = () => {
    try {
      const stored = localStorage.getItem('admin-feature-flags');
      if (stored) {
        setFeatureFlags(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load feature flags:', e);
    }
  };

  const saveFeatureFlags = (flags: typeof featureFlags) => {
    try {
      localStorage.setItem('admin-feature-flags', JSON.stringify(flags));
      setFeatureFlags(flags);
      
      // Dispatch event for real-time updates across the app
      window.dispatchEvent(new Event('featureFlagsUpdated'));
      console.log('✅ Feature flags updated:', flags);
    } catch (e) {
      console.error('Failed to save feature flags:', e);
    }
  };

  const handleBanUser = async (uid: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify({ uid, action: 'ban' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to ban user');
      }
      
      setUsers(users.map(u => u.uid === uid ? { ...u, banned: true } : u));
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user. Please try again.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('Are you sure you want to DELETE this user permanently? This cannot be undone.')) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify({ uid })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const clearFeedback = () => {
    if (confirm('Are you sure you want to clear all feedback data?')) {
      localStorage.removeItem('cc-ai-feedback');
      setFeedback([]);
    }
  };

  const clearBugReports = () => {
    if (confirm('Are you sure you want to clear all bug reports?')) {
      localStorage.removeItem('bug-reports');
      setBugReports([]);
    }
  };

  const exportFeedback = () => {
    const dataStr = JSON.stringify(feedback, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-feedback-${Date.now()}.json`;
    link.click();
  };

  const exportBugReports = () => {
    const dataStr = JSON.stringify(bugReports, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bug-reports-${Date.now()}.json`;
    link.click();
  };

  const feedbackStats = {
    total: feedback.length,
    positive: feedback.filter(f => f.rating === 'positive').length,
    negative: feedback.filter(f => f.rating === 'negative').length,
    withComments: feedback.filter(f => f.comment && f.comment.trim()).length,
  };

  const positivePercentage = feedbackStats.total > 0 ? Math.round((feedbackStats.positive / feedbackStats.total) * 100) : 0;

  // Password prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-transparent shadow-none border-none">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Administrator authentication required
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-2 border-gray-300 dark:border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Access Admin Dashboard
              </Button>
              
              <div className="pt-4 border-t border-gray-200 dark:border-blue-500/20">
                <Link 
                  href="/dashboard/chat" 
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Dashboard
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Alerts */}
        {newFeedbackAlert && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-green-400 flex items-center gap-3 animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">🔔 New feedback received!</span>
          </div>
        )}

        {newBugAlert && (
          <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-red-400 flex items-center gap-3 animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">🐛 New bug report received!</span>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage users, content, analytics, and platform features
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalUsers}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {analytics.activeToday} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Total Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalChats}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {analytics.totalMessages} messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Syllabi Uploaded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.syllabusUploads}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Class chats created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    AI Feedback Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="font-semibold">{feedbackStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600 dark:text-green-400">Positive:</span>
                      <span className="font-semibold text-green-600">{feedbackStats.positive} ({positivePercentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600 dark:text-red-400">Negative:</span>
                      <span className="font-semibold text-red-600">{feedbackStats.negative}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-600" />
                    Bug Reports Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Reports:</span>
                      <span className="font-semibold">{bugReports.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last 24h:</span>
                      <span className="font-semibold">
                        {bugReports.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USER MANAGEMENT TAB */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, ban users, or delete accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div 
                        key={user.uid}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          user.banned 
                            ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.displayName || 'No Name'}
                            </h3>
                            {user.banned && (
                              <span className="px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded">
                                BANNED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            {user.school && <span>🏫 {user.school}</span>}
                            {user.major && <span>📚 {user.major}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!user.banned && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBanUser(user.uid)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.uid)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT MODERATION TAB */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Content Moderation
                </CardTitle>
                <CardDescription>
                  Flag inappropriate chats and monitor content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Flag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <h3 className="text-lg font-semibold mb-2">No Flagged Content</h3>
                  <p className="text-sm">
                    Chats flagged for moderation will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{analytics.activeToday}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{analytics.totalMessages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Syllabi Uploaded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{analytics.syllabusUploads}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FEATURE FLAGS TAB */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features globally
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(featureFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {value ? 'Enabled for all users' : 'Disabled globally'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        saveFeatureFlags({ ...featureFlags, [key]: checked });
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="space-y-6">
            {/* AI Feedback Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  AI Feedback
                </CardTitle>
                <CardDescription>
                  User ratings and comments on AI responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  <Button onClick={exportFeedback} variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export JSON
                  </Button>
                  <Button onClick={clearFeedback} variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                </div>

                {feedback.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
                    <p className="text-sm">User feedback will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.slice().reverse().slice(0, 10).map((item, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${
                          item.rating === 'positive'
                            ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10'
                            : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {item.rating === 'positive' ? (
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <ThumbsDown className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{item.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bug Reports Section */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-600" />
                  Bug Reports
                </CardTitle>
                <CardDescription>
                  Issues reported from the beta badge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  <Button onClick={exportBugReports} variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Bug Reports
                  </Button>
                  <Button onClick={clearBugReports} variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear Bug Reports
                  </Button>
                </div>

                {bugReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bug className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    <h3 className="text-lg font-semibold mb-2">No Bug Reports</h3>
                    <p className="text-sm">Bug reports will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bugReports.slice().reverse().slice(0, 10).map((bug, index) => (
                      <div key={index} className="p-4 rounded-lg border border-red-200 dark:border-red-900">
                        <div className="flex items-start gap-3 mb-2">
                          <Bug className="w-5 h-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{bug.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">
                              {new Date(bug.timestamp).toLocaleString()}
                            </p>
                            {bug.description && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {bug.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1 mb-1">
                                <ExternalLink className="w-3 h-3" />
                                <span className="break-all">{bug.url}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

