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
                <div className="absolute inset-0 bg-blue-500/20 rounded-[1.5rem] blur-2xl group-hover:bg-blue-500/30 transition-colors duration-500" />
                
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-5 rounded-[1.5rem] shadow-xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-500">
                  <Smartphone className="h-10 w-10 text-white" strokeWidth={1.5} />
                  
                  {/* Floating Desktop element */}
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-lg border border-blue-100 dark:border-blue-900 animate-bounce-subtle">
                    <Monitor className="h-5 w-5 text-blue-500" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Mobile Device Detected
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="text-center space-y-6 mt-6">
            <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-relaxed px-2">
              Welcome! Mobile is in Beta. <br/>
              Tap <span className="text-blue-600 dark:text-blue-400 font-bold">Continue</span> to start.
            </p>
            
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 relative overflow-hidden group">
              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Pro Tip</p>
                  <p className="text-[11px] text-blue-800/70 dark:text-blue-200/70 leading-relaxed font-medium">
                    Try CourseConnect on desktop for the full experience with a larger screen and advanced features.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleContinue}
              className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-[0_12px_24px_-4px_rgba(37,99,235,0.3)] hover:shadow-[0_16px_32px_-4px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-b-4 border-blue-800 active:border-b-0 active:translate-y-[2px]"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
