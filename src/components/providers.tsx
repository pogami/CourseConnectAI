'use client';

import { useEffect } from 'react';
import { ChatProvider } from '@/contexts/chat-context';
import { ThemeProvider } from '@/contexts/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if error is from Next.js devtools or Chrome extensions
    const isDevtoolsError = (error: any, source?: string) => {
      if (!error) return false;
      
      const message = error.message || error.toString() || '';
      const stack = error.stack || '';
      const sourceStr = source || '';
      
      // Check for Next.js devtools errors
      const isNextDevtools = 
        stack.includes('next-devtools') ||
        stack.includes('next/dist/compiled/next-devtools') ||
        (message.includes('Failed to fetch') && stack.includes('next-devtools'));
      
      // Check for Chrome extension errors
      const isChromeExtension = 
        sourceStr.includes('chrome-extension://') ||
        stack.includes('chrome-extension://');
      
      return isNextDevtools || isChromeExtension;
    };

    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      // Suppress Next.js devtools and Chrome extension errors
      if (isDevtoolsError(event.error, event.filename)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Log other errors normally
      if (event.error) {
        console.error('Error details:', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress Next.js devtools fetch errors
      const reason = event.reason;
      if (isDevtoolsError(reason)) {
        event.preventDefault();
        return;
      }
      
      // Log other rejections normally
      if (reason) {
        console.error('Unhandled promise rejection:', reason);
      }
    };

    // Suppress console errors from devtools
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorStr = args.join(' ');
      // Filter out Next.js devtools "Failed to fetch" errors
      if (
        errorStr.includes('Failed to fetch') &&
        (errorStr.includes('next-devtools') || 
         args.some(arg => arg?.stack?.includes('next-devtools')))
      ) {
        return; // Suppress this error
      }
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError; // Restore original console.error
    };
  }, []);

  return (
    <ThemeProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
}
