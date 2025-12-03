'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload01Icon,
  Calendar01Icon,
  Chatting01Icon,
  Target01Icon,
} from "hugeicons-react";

const processSteps = [
  {
    title: 'Drag & Drop',
    description:
      'Stop digging through syllabi. Drag your syllabus once, and we instantly extract every deadline, reading, and grading policy for you.',
    tag: 'Syllabus Intelligence',
    icon: Upload01Icon,
    color: 'blue',
  },
  {
    title: 'Wake up to a plan',
    description:
      'Waking up scattered? Get a daily briefing that prioritizes your deadlines, classes, and knowledge gaps before you even get out of bed.',
    tag: 'AI Briefing',
    icon: Calendar01Icon,
    color: 'purple',
  },
  {
    title: "Ask, don't search",
    description:
      'Your notes are everywhere. Ask the Class Chat, and it pulls answers from your syllabus, uploads, and past questions in seconds.',
    tag: 'Contextual Tutor',
    icon: Chatting01Icon,
    color: 'indigo',
  },
  {
    title: 'Cram smarter',
    description:
      'Stop guessing what to study. We generate a personalized triage plan that targets your weakest topics so you can raise your grade fast.',
    tag: 'Triage Plan',
    icon: Target01Icon,
    color: 'pink',
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-transparent dark:bg-blue-950/30',
    border: 'border-transparent dark:border-blue-900/40',
    icon: 'text-blue-600 dark:text-blue-400',
    tag: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-transparent dark:bg-purple-950/30',
    border: 'border-transparent dark:border-purple-900/40',
    icon: 'text-purple-600 dark:text-purple-400',
    tag: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    bg: 'bg-transparent dark:bg-indigo-950/30',
    border: 'border-transparent dark:border-indigo-900/40',
    icon: 'text-indigo-600 dark:text-indigo-400',
    tag: 'text-indigo-600 dark:text-indigo-400',
  },
  pink: {
    bg: 'bg-transparent dark:bg-pink-950/30',
    border: 'border-transparent dark:border-pink-900/40',
    icon: 'text-pink-600 dark:text-pink-400',
    tag: 'text-pink-600 dark:text-pink-400',
  },
};

export function StickyProcessSection() {
  return (
    <section className="py-32 bg-transparent dark:bg-gray-950 relative">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-5 gap-16 lg:items-start">
          {/* Sticky Header */}
          <div className="lg:col-span-2 lg:min-h-[800px]">
            <div className="lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-transparent dark:bg-blue-950/30 border border-transparent dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                  How It Works
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                  A study tool that<br />actually gets it.
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                  We automate the busywork—extracting deadlines, organizing your schedule, and answering course questions—so you can focus on learning, not logistics.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Steps */}
          <div className="lg:col-span-3 space-y-6">
            {processSteps.map((step, idx) => {
              const Icon = step.icon;
              const colors = colorClasses[step.color as keyof typeof colorClasses];
              
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative"
                >
                  <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all duration-300`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${colors.tag}`}>
                            {step.tag}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

