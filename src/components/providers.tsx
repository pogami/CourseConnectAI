'use client';

import { useEffect } from 'react';
import { ChatProvider } from '@/contexts/chat-context';
import { ThemeProvider } from '@/contexts/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // Prevent default error handling that might break the app
      event.preventDefault();
      
      // Log to console but don't crash the app
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
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent default error handling
      event.preventDefault();
      
      // Log the error but don't crash
      if (event.reason) {
        console.error('Rejection reason:', event.reason);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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
