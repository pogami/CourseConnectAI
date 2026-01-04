"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, X } from 'lucide-react';

export function MobileDetectionPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return; // stop SSR crash
    
    // Check if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      return isMobileDevice || isSmallScreen;
    };

    const mobile = checkMobile();
    setIsMobile(mobile);

    // Show popup if mobile and user hasn't dismissed it before
    if (mobile && !localStorage.getItem('mobile-popup-dismissed')) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window === "undefined") return; // stop SSR crash
    setIsOpen(false);
    localStorage.setItem('mobile-popup-dismissed', 'true');
  };

  const handleContinue = () => {
    if (typeof window === "undefined") return; // stop SSR crash
    setIsOpen(false);
    localStorage.setItem('mobile-popup-dismissed', 'true');
  };

  if (!isMobile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px] mx-auto !rounded-[2rem] border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(59,130,246,0.25)] p-0 overflow-hidden">
        <div className="relative p-6 pt-10">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
          
          <DialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative group">
                {/* Multi-layered icon glow */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl group-hover:bg-blue-500/30 transition-colors duration-500" />
                
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-3xl shadow-xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-500">
                  <Smartphone className="h-12 w-12 text-white" strokeWidth={1.5} />
                  
                  {/* Floating Desktop element */}
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 animate-bounce-subtle">
                    <Monitor className="h-6 w-6 text-blue-600" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Mobile Beta
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="text-center space-y-8 mt-8">
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium leading-relaxed px-4">
              CourseConnect is currently optimized for <span className="text-blue-600 dark:text-blue-400 font-bold">desktop use</span>. 
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-5 rounded-3xl border border-blue-100/50 dark:border-blue-800/30 relative overflow-hidden shadow-inner">
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 text-blue-600 flex items-center justify-center shadow-md">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">💡 Best Experience</p>
                  <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-snug mt-0.5">
                    Try it on your computer for the full, uninhibited experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleContinue}
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)] hover:shadow-[0_24px_48px_-12px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue to Mobile Beta
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
