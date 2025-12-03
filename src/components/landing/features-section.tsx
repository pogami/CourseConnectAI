'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Users, 
  MessageCircle, 
  BookOpen, 
  Target,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Lightbulb,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Smart Syllabus Matching',
    description: 'Upload your syllabus and our AI automatically extracts course information, assignments, and due dates.',
    color: 'blue'
  },
  {
    icon: MessageCircle,
    title: 'AI-Powered Tutoring',
    description: 'Get instant help with homework, assignments, and exam prep. CourseConnect AI provides detailed explanations tailored to your course.',
    color: 'teal'
  },
  {
    icon: FileText,
    title: 'Smart Flashcards',
    description: 'Generate personalized flashcards from your course content. Study with AI-powered quizzes and track your progress.',
    color: 'green'
  },
  {
    icon: Calendar,
    title: 'Assignment Reminders',
    description: 'Never miss a deadline. Get automatic reminders for assignments and exams based on your uploaded syllabus.',
    color: 'orange'
  },
  {
    icon: TrendingUp,
    title: 'Study Analytics',
    description: 'Track your study progress and see which topics you need to focus on. Get personalized recommendations for improvement.',
    color: 'pink'
  },
  {
    icon: Target,
    title: 'AI Study Focus',
    description: 'Get personalized suggestions on what to study next based on your chat history. Discover undiscussed topics and start learning with one click.',
    color: 'violet'
  },
  {
    icon: Users,
    title: 'Study Groups',
    description: 'Join or create study groups with students from your class. Collaborate on assignments and share study materials.',
    color: 'indigo'
  }
];

export function FeaturesSection() {
  return (
    <div className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
              ace your courses
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            CourseConnect AI combines the power of AI tutoring with the support of your classmates to help you succeed in your studies.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const colorClasses = {
              blue: 'bg-blue-500',
              teal: 'bg-teal-500',
              green: 'bg-green-500',
              orange: 'bg-orange-500',
              pink: 'bg-pink-500',
              violet: 'bg-violet-500',
              indigo: 'bg-indigo-500'
            };
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className={`w-10 h-10 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                  {feature.title === 'Study Groups' && (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Coming Soon)</span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How it works
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get started in minutes and see results immediately
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8">
            {[
              {
                step: '1',
                title: 'Upload Syllabus',
                description: 'Add your course syllabus or docs to get started',
                icon: Upload
              },
              {
                step: '2',
                title: 'Get AI Help',
                description: 'Chat with CourseConnect AI for instant explanations',
                icon: MessageCircle
              },
              {
                step: '3',
                title: 'Generate Flashcards',
                description: 'Create and study smart flashcards from your content',
                icon: FileText
              },
              {
                step: '4',
                title: 'Stay On Track',
                description: 'Receive assignment reminders so you never miss deadlines',
                icon: Calendar
              },
              {
                step: '5',
                title: 'Get Focused',
                description: 'Receive AI-powered suggestions on what to study next based on your progress',
                icon: Target
              }
            ].map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
