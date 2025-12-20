'use client';

import { useState, useEffect, useCallback } from 'react';

interface StudyTimerHook {
  studyTime: number; // in minutes
  isStudying: boolean;
  isLoading: boolean;
  startStudying: () => void;
  stopStudying: () => void;
  resetTimer: () => void;
  shouldTakeBreak: boolean;
}

export function useStudyTimer(): StudyTimerHook {
  // FIXED: Don't use lazy initializer - load from localStorage in useEffect instead
  const [studyTime, setStudyTime] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Load study time from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return; // stop SSR crash
    try {
      const stored = localStorage.getItem('studyTime');
      if (stored) {
        setStudyTime(parseFloat(stored));
      }
    } catch (error) {
      console.warn('Failed to load study time:', error);
    }
  }, []);

  // Check for user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Initialize timer loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loading for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStudying) {
      interval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        
        // Only count time if user has been active in the last 5 minutes
        if (timeSinceLastActivity < 5 * 60 * 1000) {
          setStudyTime(prev => prev + 0.17); // Add ~10 seconds worth of minutes (10/60)
        }
      }, 10000); // Update every 10 seconds for more real-time feel
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStudying, lastActivity]);

  // Save study time to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyTime', studyTime.toString());
    }
  }, [studyTime]);

  const startStudying = useCallback(() => {
    setIsStudying(true);
    setLastActivity(Date.now());
  }, []);

  const stopStudying = useCallback(() => {
    setIsStudying(false);
  }, []);

  const resetTimer = useCallback(() => {
    setStudyTime(0);
    setIsStudying(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('studyTime');
    }
  }, []);

  // Should take break after 25 minutes (Pomodoro technique) or 2 hours
  const shouldTakeBreak = studyTime >= 25 && studyTime % 25 === 0;

  return {
    studyTime,
    isStudying,
    isLoading,
    startStudying,
    stopStudying,
    resetTimer,
    shouldTakeBreak
  };
}
