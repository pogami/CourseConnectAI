'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Target,
  Zap,
  Shield,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const uniqueFeatures = [
  {
    id: 'ai-context',
    icon: Brain,
    title: 'AI that actually knows your classes',
    description: 'CourseConnect reads your real syllabus, assignments, and course materials. Every answer is grounded in your actual classes, not generic Internet summaries.',
    highlight: 'Built Around Your Courses',
    color: 'from-teal-600 to-blue-600',
    darkColor: 'from-teal-400 to-blue-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    borderColor: 'border-teal-200 dark:border-teal-800'
  },
  {
    id: 'syllabus-parser',
    icon: FileText,
    title: 'Your syllabus, turned into a study plan',
    description: 'Upload once and get the important parts pulled out for you—deadlines, exams, assignments, grading, and professor details—so you never have to dig through a PDF again.',
    highlight: 'Zero Manual Setup',
    color: 'from-blue-600 to-cyan-600',
    darkColor: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'thinking-process',
    icon: Sparkles,
    title: 'Calm, focused explanations',
    description: 'Get clear, step‑by‑step answers that stay on topic and match your level—without noisy meta talk or confusing “reasoning” text.',
    highlight: 'Designed for Students',
    color: 'from-cyan-600 to-teal-600',
    darkColor: 'from-cyan-400 to-teal-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  {
    id: 'course-chats',
    icon: MessageSquare,
    title: 'A dedicated workspace for every course',
    description: 'Each class gets its own AI chat with full context. When you ask about “the midterm” or “problem set 3,” it knows exactly which course you mean.',
    highlight: 'Context-Aware Chat',
    color: 'from-emerald-600 to-teal-600',
    darkColor: 'from-emerald-400 to-teal-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'study-focus',
    icon: Target,
    title: 'Smart “what should I study next?”',
    description: 'CourseConnect spots topics you haven’t covered yet and nudges you toward the next best thing to review—so you always know where to focus.',
    highlight: 'Guided Focus',
    color: 'from-amber-600 to-orange-600',
    darkColor: 'from-amber-400 to-orange-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    id: 'privacy-first',
    icon: Shield,
    title: 'Private by default',
    description: 'Your syllabus is processed securely and isn’t kept around as a data grab. You stay in control of your information and how it’s used.',
    highlight: 'Your Data, Your Control',
    color: 'from-slate-600 to-gray-600',
    darkColor: 'from-slate-400 to-gray-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/20',
    borderColor: 'border-slate-200 dark:border-slate-800'
  }
];

export function UniqueFeaturesShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  return (
    <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 border border-teal-200/50 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Built around your real courses
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            not just another{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">
              ai chatbot.
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            CourseConnect reads your syllabus, builds a dedicated space for every class, and stays aware of your deadlines and assignments—so the help you get actually matches what you’re doing this semester.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {uniqueFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const isSelected = selectedFeature === feature.id;
            const isHovered = hoveredFeature === feature.id;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(isSelected ? null : feature.id)}
                className={`
                  relative group cursor-pointer
                  ${feature.bgColor}
                  border-2 ${feature.borderColor}
                  rounded-2xl p-6
                  transition-all duration-300
                  ${isHovered ? 'scale-[1.02] shadow-xl' : 'shadow-lg'}
                  ${isSelected ? 'ring-4 ring-teal-500/50' : ''}
                `}
              >
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl
                  bg-gradient-to-br ${feature.color} dark:bg-gradient-to-br dark:${feature.darkColor}
                  flex items-center justify-center
                  mb-4
                  transition-transform duration-300
                  ${isHovered ? 'scale-110 rotate-3' : ''}
                `}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Highlight Badge */}
                <div className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  bg-white/80 dark:bg-gray-900/80
                  text-xs font-bold
                  text-transparent bg-clip-text bg-gradient-to-r ${feature.color} dark:bg-gradient-to-r dark:${feature.darkColor}
                  mb-3
                `}>
                  <Zap className="w-3 h-3" />
                  {feature.highlight}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <motion.div
                  className={`
                    absolute inset-0 rounded-2xl
                    bg-gradient-to-br ${feature.color} dark:bg-gradient-to-br dark:${feature.darkColor}
                    opacity-0 group-hover:opacity-5
                    transition-opacity duration-300
                  `}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Expanded Feature Detail */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {(() => {
                const feature = uniqueFeatures.find(f => f.id === selectedFeature);
                if (!feature) return null;
                const Icon = feature.icon;

                return (
                  <div className={`
                    ${feature.bgColor}
                    border-2 ${feature.borderColor}
                    rounded-2xl p-8
                    shadow-2xl
                  `}>
                    <div className="flex items-start gap-6">
                      <div className={`
                        w-16 h-16 rounded-xl
                        bg-gradient-to-br ${feature.color} dark:bg-gradient-to-br dark:${feature.darkColor}
                        flex items-center justify-center
                        flex-shrink-0
                      `}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className={`
                              inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                              bg-white/80 dark:bg-gray-900/80
                              text-xs font-bold
                              text-transparent bg-clip-text bg-gradient-to-r ${feature.color} dark:bg-gradient-to-r dark:${feature.darkColor}
                              mb-2
                            `}>
                              <Zap className="w-3 h-3" />
                              {feature.highlight}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {feature.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedFeature(null)}
                            className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                        
                        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                          {feature.description}
                        </p>

                        <div className="flex items-center gap-4">
                          <Button
                            asChild
                            className={`
                              bg-gradient-to-r ${feature.color} dark:bg-gradient-to-r dark:${feature.darkColor}
                              hover:opacity-90
                              text-white
                            `}
                          >
                            <Link href="/dashboard/upload">
                              Try It Now
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedFeature(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA Removed */}
      </div>
    </section>
  );
}

