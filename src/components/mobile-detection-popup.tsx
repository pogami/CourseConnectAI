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
      <DialogContent className="sm:max-w-md mx-auto !rounded-[2.5rem] border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(59,130,246,0.25)] p-0 overflow-hidden">
        <div className="relative p-8 pt-12">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <DialogHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative group">
                {/* Multi-layered icon glow */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl group-hover:bg-blue-500/30 transition-colors duration-500" />
                
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-500">
                  <Smartphone className="h-12 w-12 text-white" strokeWidth={1.5} />
                  
                  {/* Floating Desktop element */}
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 animate-bounce-subtle">
                    <Monitor className="h-6 w-6 text-blue-500" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                CourseConnect <span className="text-blue-500">Mobile</span>
              </DialogTitle>
              <p className="text-blue-500/80 dark:text-blue-400/80 font-bold uppercase tracking-widest text-[10px]">
                Early Access • Beta v1.0
              </p>
            </div>
          </DialogHeader>
          
          <div className="text-center space-y-8 mt-8">
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium leading-relaxed px-4">
              Welcome! Mobile is in Beta. <br/>
              Tap <span className="text-blue-600 dark:text-blue-400 font-bold">Continue</span> to start.
            </p>
            
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50 relative overflow-hidden group">
              <div className="flex items-start gap-4 relative z-10">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Pro Tip</p>
                  <p className="text-xs text-blue-800/70 dark:text-blue-200/70 leading-relaxed font-medium">
                    Try CourseConnect on desktop for the full experience with a larger screen and advanced features.
                  </p>
                </div>
              </div>
              {/* Subtle background pattern for the tip box */}
              <div className="absolute top-0 right-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Monitor className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
              </div>
            </div>

            <Button 
              onClick={handleContinue}
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-[0_12px_24px_-4px_rgba(37,99,235,0.3)] hover:shadow-[0_16px_32px_-4px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-b-4 border-blue-800 active:border-b-0 active:translate-y-[2px]"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
        
        {/* Progress bar style footer */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full bg-blue-500 w-1/3 animate-pulse" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
