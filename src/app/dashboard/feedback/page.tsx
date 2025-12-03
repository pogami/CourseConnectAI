"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Clock, MessageSquare, Download, Trash2, ArrowLeft, Bug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface FeedbackItem {
  rating: 'positive' | 'negative';
  comment?: string;
  messageId: string;
  chatId: string;
  timestamp: number;
  aiContent?: string; // The AI's response that was rated
}

interface BugReport {
  type: 'bug';
  title: string;
  description: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(false);
  const [newBugAlert, setNewBugAlert] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Password for accessing the feedback page
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

  useEffect(() => {
    if (!isAuthenticated) return; // Don't load feedback if not authenticated
    loadFeedback();
    loadBugReports();
    
    // Listen for real-time feedback updates
    const handleFeedbackAdded = (event: any) => {
      console.log('🔔 New feedback received in real-time!', event.detail);
      loadFeedback(); // Reload all feedback
      
      // Show visual alert
      setNewFeedbackAlert(true);
      setTimeout(() => setNewFeedbackAlert(false), 3000);
    };
    
    // Listen for real-time bug reports
    const handleBugReported = (event: any) => {
      console.log('🐛 New bug report received in real-time!', event.detail);
      loadBugReports(); // Reload all bug reports
      
      // Show visual alert
      setNewBugAlert(true);
      setTimeout(() => setNewBugAlert(false), 3000);
    };
    
    window.addEventListener('feedbackAdded', handleFeedbackAdded);
    window.addEventListener('bugReported', handleBugReported);
    
    // Also listen for storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cc-ai-feedback') {
        console.log('🔔 Feedback updated in another tab!');
        loadFeedback();
      }
      if (e.key === 'bug-reports') {
        console.log('🐛 Bug reports updated in another tab!');
        loadBugReports();
      }
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
        const parsed = JSON.parse(stored);
        setFeedback(parsed);
        console.log('📊 Feedback loaded:', parsed.length, 'items');
      }
    } catch (e) {
      console.error('Failed to load feedback:', e);
    }
  };

  const loadBugReports = () => {
    try {
      const stored = localStorage.getItem('bug-reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        setBugReports(parsed);
        console.log('🐛 Bug reports loaded:', parsed.length, 'items');
      }
    } catch (e) {
      console.error('Failed to load bug reports:', e);
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

  const stats = {
    total: feedback.length,
    positive: feedback.filter(f => f.rating === 'positive').length,
    negative: feedback.filter(f => f.rating === 'negative').length,
    withComments: feedback.filter(f => f.comment && f.comment.trim()).length,
  };

  const positivePercentage = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-transparent shadow-none border-none">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold text-gray-900 dark:text-white">
              Restricted Access
            </CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Developer authentication required
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-2 border-gray-300 dark:border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    autoFocus
                  />
                  <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
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
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Unlock Dashboard
              </Button>
              
              <div className="pt-4 border-t border-gray-200 dark:border-blue-500/20">
                <Link 
                  href="/dashboard/chat" 
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Chat
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Real-time Feedback Alert */}
        {newFeedbackAlert && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-green-400 flex items-center gap-3 animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">🔔 New feedback received!</span>
          </div>
        )}

        {/* Real-time Bug Report Alert */}
        {newBugAlert && (
          <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-red-400 flex items-center gap-3 animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">🐛 New bug report received!</span>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/chat" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📊 AI Feedback Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Developer view - Monitor user feedback to improve AI responses (Updates in real-time! 🔴)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                Positive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.positive}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {positivePercentage}% satisfaction
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                Negative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.negative}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Needs improvement
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
                With Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.withComments}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Detailed feedback
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button onClick={exportFeedback} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
          <Button onClick={clearFeedback} variant="destructive" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No feedback yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  User feedback will appear here when they rate AI responses
                </p>
              </CardContent>
            </Card>
          ) : (
            feedback.slice().reverse().map((item, index) => (
              <Card 
                key={index}
                className={`${
                  item.rating === 'positive' 
                    ? 'border-green-200 dark:border-green-900' 
                    : 'border-red-200 dark:border-red-900'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {item.rating === 'positive' ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <div>
                        <span className={`text-sm font-semibold ${
                          item.rating === 'positive' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {item.rating === 'positive' ? 'Positive Feedback' : 'Negative Feedback'}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Response Being Rated */}
                  {item.aiContent && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">AI Response</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
                        {item.aiContent}
                      </p>
                    </div>
                  )}

                  {/* User Comment */}
                  {item.comment && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">User Comment</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{item.comment}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Chat: {item.chatId}</span>
                    <span>•</span>
                    <span>Message ID: {item.messageId.substring(0, 20)}...</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Bug Reports Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Bug className="w-8 h-8 text-red-600 dark:text-red-400" />
              Bug Reports
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Issues reported by users from the beta badge on the home page
            </p>
          </div>

          {/* Bug Report Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                  Total Bug Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {bugReports.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {bugReports.filter(r => Date.now() - r.timestamp < 24 * 60 * 60 * 1000).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  In the last 24 hours
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bug Report Actions */}
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

          {/* Bug Reports List */}
          <div className="space-y-4">
            {bugReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bug className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No bug reports yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    User bug reports will appear here when they click "Report Issue" on the home page
                  </p>
                </CardContent>
              </Card>
            ) : (
              bugReports.slice().reverse().map((bug, index) => (
                <Card 
                  key={index}
                  className="border-red-200 dark:border-red-900"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {bug.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(bug.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bug Description */}
                    {bug.description && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Description</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {bug.description}
                        </p>
                      </div>
                    )}

                    {/* Technical Details */}
                    <div className="space-y-2">
                      {bug.url && (
                        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="break-all">{bug.url}</span>
                        </div>
                      )}
                      {bug.userAgent && (
                        <details className="text-xs text-gray-500 dark:text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            User Agent
                          </summary>
                          <p className="mt-2 pl-4 text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 break-all">
                            {bug.userAgent}
                          </p>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

