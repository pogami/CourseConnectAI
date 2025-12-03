'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const currentFeatures = [
  {
    title: 'AI-Powered Course Chat',
    description: 'Get instant help tailored to your specific course materials and syllabus.',
    status: 'Available Now',
    icon: '✨'
  },
  {
    title: 'Smart Syllabus Parser',
    description: 'Automatically extract deadlines, assignments, and course info from any syllabus.',
    status: 'Available Now',
    icon: '📄'
  },
  {
    title: 'Transparent AI Thinking',
    description: 'See how the AI reasons through your questions in real-time.',
    status: 'Available Now',
    icon: '🧠'
  },
  {
    title: 'Study Focus Suggestions',
    description: 'Get personalized recommendations on what to study next.',
    status: 'Available Now',
    icon: '🎯'
  },
  {
    title: 'Flashcard Generator',
    description: 'Create study materials from your course content automatically.',
    status: 'Available Now',
    icon: '📚'
  },
  {
    title: 'Privacy-First Processing',
    description: 'Your data is processed securely and never stored permanently.',
    status: 'Available Now',
    icon: '🔒'
  }
];

export function RoadmapSection() {
  return (
    <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 text-green-700 dark:text-green-300 text-sm font-semibold mb-6">
              <CheckCircle2 className="w-4 h-4" />
              What's Available Now
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                succeed today
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              No waiting, no promises. These features are live and ready to help you ace your classes right now.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFeatures.map((item, idx) => {
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full p-6 rounded-2xl border-2 border-green-200/50 dark:border-green-800/50 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-700">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  
                  <div className="pr-16">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
