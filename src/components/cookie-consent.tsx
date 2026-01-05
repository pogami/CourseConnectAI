'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const hasConsent = localStorage.getItem('cc_cookie_consent');
    if (!hasConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cc_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('cc_cookie_consent', 'essential');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-10 right-6 z-[100] w-[calc(100%-3rem)] max-w-[350px]"
        >
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 backdrop-blur-xl rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    Cookie Preferences
                  </p>
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                We use cookies to personalize your study experience and keep CourseConnect running smoothly. By using our site, you agree to our{" "}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Privacy Policy</Link>.
              </p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleAcceptAll}
                  className="w-full h-11 text-sm font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center !bg-[#2563eb] !text-white hover:!bg-[#1d4ed8]"
                  style={{ 
                    backgroundColor: '#2563eb', 
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  Accept All
                </button>
                <Button 
                  variant="ghost"
                  onClick={handleAcceptEssential}
                  className="w-full h-11 text-gray-500 dark:text-gray-400 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl"
                >
                  Essential Only
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
