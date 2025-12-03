'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Minus, Sparkles, Zap, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const features = [
  {
    id: 'syllabus',
    name: 'Syllabus Parsing',
    description: 'Extracts deadlines & grading policies automatically',
    courseconnect: 'full',
    quizlet: 'none',
    chatgpt: 'none',
  },
  {
    id: 'context',
    name: 'Course Context',
    description: 'Knows your specific professor, textbook, and rules',
    courseconnect: 'full',
    quizlet: 'none',
    chatgpt: 'partial',
  },
  {
    id: 'reminders',
    name: 'Smart Reminders',
    description: 'Nudges you before assignments are due',
    courseconnect: 'full',
    quizlet: 'none',
    chatgpt: 'none',
  },
  {
    id: 'tutoring',
    name: 'AI Tutoring',
    description: 'Explains concepts using YOUR lecture notes',
    courseconnect: 'full',
    quizlet: 'partial',
    chatgpt: 'partial',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Auto-generated from your uploads',
    courseconnect: 'full',
    quizlet: 'full',
    chatgpt: 'partial',
  },
  {
    id: 'price',
    name: 'Price',
    description: 'Cost for students',
    courseconnect: 'free',
    quizlet: 'paid',
    chatgpt: 'paid',
  },
];

const statusConfig = {
  full: { icon: Check, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Yes', border: 'border-green-500/30' },
  partial: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Limited', border: 'border-yellow-500/30' },
  none: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10', label: 'No', border: 'border-red-500/20' },
  free: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Free', border: 'border-yellow-500/30' },
  paid: { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-800', label: '$$$', border: 'border-gray-700' },
};

function StatusCell({ status, isWinner }: { status: string, isWinner?: boolean }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all duration-300",
      config.bg,
      config.border,
      isWinner && "shadow-[0_0_15px_rgba(34,197,94,0.2)]"
    )}>
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
        {config.label}
      </span>
    </div>
  );
}

export function ComparisonTable() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <section className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-slate-500/10 border border-slate-800"
          >
            <Crown className="w-3 h-3 text-yellow-400" />
            The Battle Royale
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight"
          >
            Don't settle for{' '}
            <span className="text-gray-400 dark:text-gray-600 line-through decoration-red-500 decoration-4">basic</span>.
          </motion.h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            See why students are switching from generic AI tools to a dedicated study companion.
          </p>
        </div>

        {/* The Comparison Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          {/* Desktop/Tablet View */}
          <div className="hidden md:block bg-gray-50 dark:bg-gray-900/40 rounded-[2rem] border border-gray-200 dark:border-gray-800 p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            
            {/* Glassy Glow behind CourseConnect Column */}
            <div className="absolute top-0 bottom-0 left-[35%] w-[22%] bg-gradient-to-b from-blue-200/10 to-pink-200/10 border-x border-slate-200/20 pointer-events-none z-0" />

            {/* Grid Header */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-6 mb-8 relative z-10">
              <div className="flex items-end pb-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Features</span>
              </div>
              
              {/* CourseConnect Header */}
              <div className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg shadow-lg">
                  RECOMMENDED
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-500/5 flex flex-col items-center gap-3 transform transition-transform hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">CourseConnect</span>
                </div>
              </div>

              {/* Quizlet Header */}
              <div className="flex flex-col items-center justify-end pb-2 opacity-70">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mb-3 text-white font-bold">Q</div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">Quizlet</span>
              </div>

              {/* ChatGPT Header */}
              <div className="flex flex-col items-center justify-end pb-2 opacity-70">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mb-3 text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">ChatGPT</span>
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-3 relative z-10">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  onMouseEnter={() => setHoveredRow(feature.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    "grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-6 items-center p-4 rounded-xl transition-all duration-300",
                    hoveredRow === feature.id 
                      ? "bg-white dark:bg-gray-800 shadow-lg scale-[1.01] border border-gray-200 dark:border-gray-700" 
                      : "hover:bg-gray-100/50 dark:hover:bg-gray-800/30 border border-transparent"
                  )}
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base mb-0.5">
                      {feature.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
                      {feature.description}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <StatusCell status={feature.courseconnect} isWinner={true} />
                  </div>
                  <div className="flex justify-center opacity-60 grayscale group-hover:grayscale-0 transition-all">
                    <StatusCell status={feature.quizlet} />
                  </div>
                  <div className="flex justify-center opacity-60 grayscale group-hover:grayscale-0 transition-all">
                    <StatusCell status={feature.chatgpt} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Card View (Swipeable) */}
          <div className="md:hidden space-y-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg relative overflow-hidden"
              >
                {/* Header */}
                <div className="mb-6 relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feature.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>

                {/* Comparison Items */}
                <div className="space-y-4 relative z-10">
                  {/* Winner Row */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Us</span>
                    </div>
                    <StatusCell status={feature.courseconnect} isWinner />
                  </div>

                  {/* Competitors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-xs font-medium text-gray-500">Quizlet</span>
                      <StatusCell status={feature.quizlet} />
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-xs font-medium text-gray-500">ChatGPT</span>
                      <StatusCell status={feature.chatgpt} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none md:hidden" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/login?state=signup">
              Experience the Difference
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
