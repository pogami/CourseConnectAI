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
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Smartphone className="h-12 w-12 text-blue-500" />
              <Monitor className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Mobile Device Detected
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This site is optimized for desktop use. For the best experience, we recommend using a computer or tablet.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Why desktop is better:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
              <li>• Larger screen for better readability</li>
              <li>• Full keyboard for easier typing</li>
              <li>• Better file upload experience</li>
              <li>• Enhanced AI chat interface</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button 
              onClick={handleContinue}
              className="flex-1"
            >
              Continue Anyway
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
