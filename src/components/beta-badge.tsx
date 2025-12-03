"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BetaBadge() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitBug = () => {
    if (!bugTitle.trim()) return;

    setIsSubmitting(true);

    // Save to localStorage for developer feedback page
    const bugReport = {
      type: 'bug',
      title: bugTitle,
      description: bugDescription,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    try {
      const existingReports = JSON.parse(localStorage.getItem('bug-reports') || '[]');
      existingReports.unshift(bugReport);
      localStorage.setItem('bug-reports', JSON.stringify(existingReports));

      // Dispatch event for real-time updates on feedback page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bugReported', { detail: bugReport }));
      }

      // Show success message
      setShowSuccess(true);
      setBugTitle('');
      setBugDescription('');
      
      setTimeout(() => {
        setShowSuccess(false);
        setShowReportForm(false);
      }, 2500);
    } catch (error) {
      console.error('Failed to save bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex justify-center mb-10"
      >
        <motion.div 
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow effect behind */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500" />
          
          {/* Badge Container */}
          <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider">
                Public Beta
              </span>
            </div>

            <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />

            {/* Action Text */}
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
              <span>v1.0 • Give Feedback</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => !showSuccess && setShowReportForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-0 max-w-md w-full overflow-hidden relative"
            >
              {!showSuccess ? (
                <>
                  {/* Decorative gradient header */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Share Feedback
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          Help us shape the future of CourseConnect.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowReportForm(false)}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={bugTitle}
                          onChange={(e) => setBugTitle(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm transition-all"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                          Details
                        </label>
                        <textarea
                          value={bugDescription}
                          onChange={(e) => setBugDescription(e.target.value)}
                          placeholder="Found a bug? Have a feature request? Tell us more..."
                          rows={4}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none transition-all"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => setShowReportForm(false)}
                          variant="outline"
                          className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitBug}
                          disabled={!bugTitle.trim() || isSubmitting}
                          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 font-bold tracking-wide"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Send className="w-4 h-4" />
                              Send Feedback
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Message Received!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Thanks for helping us make CourseConnect better. We read every piece of feedback.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
