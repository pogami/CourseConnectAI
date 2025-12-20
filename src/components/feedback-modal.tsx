"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

export function FeedbackModal({ isOpen, onClose, defaultSubject = '' }: FeedbackModalProps) {
  const [bugTitle, setBugTitle] = useState(defaultSubject);
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState<{ name: string | null, email: string | null } | null>(null);

  useEffect(() => {
    setBugTitle(defaultSubject);
  }, [defaultSubject]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName,
          email: currentUser.email
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmitBug = async () => {
    if (!bugTitle.trim()) return;

    setIsSubmitting(true);

    const bugReport = {
      title: bugTitle,
      description: bugDescription,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      user: user // Include user info if available
    };

    try {
      // Send to backend API for email delivery
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugReport),
      });

      if (!response.ok) throw new Error('Failed to send feedback');

      // Also keep local copy
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
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Failed to send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={() => !showSuccess && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 p-0 max-w-[380px] w-full overflow-hidden relative"
          >
            {!showSuccess ? (
              <>
                {/* Refined blue header accent */}
                <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                        Share Feedback
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Help us architect the future.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-95"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <input
                        type="text"
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="Subject..."
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm transition-all font-medium"
                        autoFocus
                      />
                    </div>

                    <div className="group">
                      <textarea
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        placeholder="Tell us more about your vision or the issue..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm resize-none transition-all font-medium leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={onClose}
                        variant="ghost"
                        className="flex-1 rounded-xl h-auto py-3 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitBug}
                        disabled={!bugTitle.trim() || isSubmitting}
                        className="flex-[2] rounded-xl h-auto py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                      >
                        {isSubmitting ? "Sending..." : "Send Feedback"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                  Vision Received!
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[180px] leading-relaxed">
                  Thanks for helping us build.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
