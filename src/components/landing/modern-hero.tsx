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
  
  // Track when demo section is leaving viewport
  const { scrollYProgress: demoScrollProgress } = useScroll({
    target: demoRef,
    offset: ["end end", "start start"]
  });
  
  // Parallax effects - different speeds for depth
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 300]);
  const contentY = useTransform(scrollY, [0, 1000], [0, 100]);
  // Only fade out when demo section is actually leaving viewport
  const demoOpacity = useTransform(demoScrollProgress, [0, 0.5, 1], [1, 1, 0]);
  const demoY = useTransform(demoScrollProgress, [0, 0.5, 1], [0, 0, 50]);
  
  // Large background text parallax (like GTA VI)
  const largeTextY = useTransform(scrollY, [0, 1000], [0, 400]);
  const largeTextOpacity = useTransform(scrollY, [0, 500], [0.03, 0.08]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-white dark:bg-gray-950 min-h-screen flex items-center"
    >
      {/* Large Background Text - GTA VI Style */}
      <motion.div
        style={{ y: largeTextY, opacity: largeTextOpacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <h1 className="text-[20rem] md:text-[30rem] lg:text-[40rem] font-black text-gray-900/5 dark:text-white/5 leading-none tracking-tight whitespace-nowrap">
          COURSECONNECT
        </h1>
      </motion.div>
      
      {/* Background Layers with Parallax - subtle, non-flashy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 1000], [0, 120]) }}
          className="absolute top-[-20%] left-[10%] w-[480px] h-[480px] bg-sky-500/6 rounded-full blur-[120px]"
        />
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 1000], [0, 160]) }}
          className="absolute bottom-[-20%] right-[5%] w-[420px] h-[420px] bg-indigo-500/6 rounded-full blur-[120px]"
        />
      </div>

      <motion.div 
        style={{ y: contentY }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40 z-10"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Beta Badge */}
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
            School is hard.{' '}
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              We make it easy.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            The all-in-one AI study companion that turns your syllabus into personalized tutoring, schedule tracking, and instant grades.
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
              className="h-14 px-8 text-lg font-semibold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Link href="#upload">
                Upload Syllabus
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-full border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 hover:scale-105"
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
        <motion.div
          ref={demoRef}
          id="upload"
          style={{ opacity: demoOpacity, y: demoY }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl mt-20"
        >
          <InteractiveSyllabusDemo />
        </motion.div>
      </motion.div>
    </div>
  );
}

