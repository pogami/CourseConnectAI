'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden bg-white dark:bg-gray-950">
      {/* Background Effects - Flowing gradient to match FAQ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/30 to-gray-50/50 dark:via-gray-900/30 dark:to-gray-900/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-t from-gray-50/40 dark:from-gray-900/40 to-transparent blur-[180px]" />
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.95]">
            Don't just study. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Outperform.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the growing community of students using AI to streamline their workflow and focus on what actually matters. Build your academic edge today.
          </p>

          <div className="flex flex-col items-center justify-center gap-6">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-14 py-9 text-2xl font-black rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.2)] dark:shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={() => window.location.href = '/signup'}
            >
              Get Started Free
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}

