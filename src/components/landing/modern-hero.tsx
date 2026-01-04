'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, CheckCircle2, Upload, Zap } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import InteractiveSyllabusDemo from '@/components/interactive-syllabus-demo';
import BetaBadge from '@/components/beta-badge';
import Link from 'next/link';

export function HeroSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const demoRef = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div 
      ref={containerRef}
      className="relative overflow-x-hidden bg-white dark:bg-gray-950 min-h-screen flex items-center"
    >
      
      {/* Background Layers - subtle, non-flashy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-20%] left-[10%] w-[480px] h-[480px] bg-sky-500/6 rounded-full blur-[120px]"
        />
        <div 
          className="absolute bottom-[-20%] right-[5%] w-[420px] h-[420px] bg-indigo-500/6 rounded-full blur-[120px]"
        />
      </div>

      <div 
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40 z-10"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Beta Badge with Feedback */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <BetaBadge />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.05]"
          >
            Don't just study.{' '}
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Outperform.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            The all-in-one AI study system that turns your syllabus into personalized tutoring, automated tracking, and your academic edge.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          >
            <Button
              size="lg"
              asChild
              className="h-14 px-10 text-lg font-black rounded-full bg-blue-600 text-white hover:bg-blue-500 shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Link href="#upload">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-10 text-lg font-black rounded-full border-2 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              See How It Works
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Works with any syllabus</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free during beta</span>
            </div>
          </motion.div>
        </div>

        {/* Demo Section */}
        <div
          ref={demoRef}
          id="upload"
          className="relative mx-auto max-w-5xl mt-20"
        >
          <InteractiveSyllabusDemo />
        </div>
      </div>
    </div>
  );
}

