'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CCLogo } from '@/components/icons/cc-logo';
import { useTheme } from '@/contexts/theme-context';
import { Sun, Moon, Menu, X, ArrowRight, Home, Layout, Info } from 'lucide-react';

const navigation = [
  { name: 'Features', href: '/features' },
  // { name: 'Pricing', href: '/pricing' }, // Hidden until pricing page is ready
  { name: 'Changelog', href: '/changelog' },
  { name: 'About', href: '/about' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const shouldShowScrolled = isMounted && isScrolled;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className={`flex items-center justify-between ${shouldShowScrolled ? 'pt-6' : 'h-16'}`} suppressHydrationWarning>
          {shouldShowScrolled ? (
            /* Scrolled state - Floating capsule header */
            <motion.div 
              className="flex items-center bg-white/10 dark:bg-gray-900/10 backdrop-blur-3xl shadow-2xl border border-white/20 dark:border-white/10 rounded-full px-8 py-4 gap-10 relative overflow-hidden mx-auto"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08), rgba(255,255,255,0.15))",
                  "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08), rgba(255,255,255,0.2))",
                  "linear-gradient(225deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08), rgba(255,255,255,0.15))",
                  "linear-gradient(315deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08), rgba(255,255,255,0.2))",
                  "linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08), rgba(255,255,255,0.15))"
                ]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Liquid glass shimmer overlay */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full pointer-events-none"
                animate={{
                  x: ["-100%", "100%"],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              
              {/* Liquid glass ripple effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-radial from-white/30 via-transparent to-transparent rounded-full pointer-events-none"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              {/* Logo */}
              <Link href="/" className="relative z-10 flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
                <CCLogo className="h-8 w-auto" />
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="relative z-10 hidden md:flex items-center gap-8" suppressHydrationWarning>
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative transition-colors duration-200 font-medium text-base ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      suppressHydrationWarning
                    >
                      {item.name}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop CTA */}
              <div className="relative z-10 hidden md:flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-transparent text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm px-3 py-2 h-9"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-transparent text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm px-4 py-2 h-9"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-sky-600 hover:bg-sky-700 text-white text-sm px-5 py-2 h-9 shadow-md hover:shadow-lg transition-all"
                  onClick={() => window.location.href = '/login?state=signup'}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Normal state - Full width layout */
            <>
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
                <CCLogo className="h-8 w-auto md:h-10" />
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8 ml-auto mr-8" suppressHydrationWarning>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                    suppressHydrationWarning
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </Button>
                <Button 
                  className="bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg transition-all"
                  onClick={() => window.location.href = '/login?state=signup'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Button - Right side */}
              <div className="md:hidden ml-auto">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-bottom"
          >
            <div className="px-4 py-4 space-y-4" suppressHydrationWarning>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                  onClick={() => setIsOpen(false)}
                  suppressHydrationWarning
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 h-12"
                  onClick={() => { toggleTheme(); setIsOpen(false); }}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <><Sun className="h-4 w-4 mr-2"/> Light Mode</> : <><Moon className="h-4 w-4 mr-2"/> Dark Mode</>}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 h-12"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12"
                  onClick={() => window.location.href = '/login?state=signup'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
