"use client";

import { useState, useCallback } from 'react';

export interface AnimatedToast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useAnimatedToast() {
  const [toasts, setToasts] = useState<AnimatedToast[]>([]);

  const toast = useCallback((toastData: Omit<AnimatedToast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: AnimatedToast = {
      ...toastData,
      id,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    removeToast,
  };
}


