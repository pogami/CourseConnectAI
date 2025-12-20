"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.warn('Error loading theme:', error);
      setThemeState('light');
    }
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1e1b4b' : '#ffffff');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    
    // Disable View Transitions for instant theme switching (no flash)
    setThemeState(newTheme);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
    } catch (error) {
      console.warn('Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
    } catch (error) {
      console.warn('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values during SSR or when not wrapped in provider
    // This prevents crashes during server-side rendering
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {
        if (typeof window !== 'undefined') {
          console.warn('ThemeProvider not found. Theme toggle will not work.');
        }
      },
      setTheme: () => {
        if (typeof window !== 'undefined') {
          console.warn('ThemeProvider not found. Theme set will not work.');
        }
      }
    };
  }
  return context;
}
