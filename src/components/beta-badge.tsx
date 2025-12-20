"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FeedbackModal } from '@/components/feedback-modal';

export default function BetaBadge() {
  const [showReportForm, setShowReportForm] = useState(false);

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
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500" />
          
          {/* Badge Container */}
          <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
            
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wider">
              Early Access
            </span>
          </div>

          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

          {/* Action Text */}
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>v1.0 • Give Feedback</span>
          </button>
          </div>
        </motion.div>
      </motion.div>

      <FeedbackModal 
        isOpen={showReportForm} 
        onClose={() => setShowReportForm(false)} 
      />
    </>
  );
}
