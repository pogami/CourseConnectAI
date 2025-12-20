'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/landing/navigation';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  FileText, 
  MessageCircle, 
  Zap, 
  Shield, 
  Globe, 
  Sparkles, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Bell, 
  Upload, 
  BookOpen,
  Rocket,
  ChevronRight,
  ArrowRight,
  Brain,
  Monitor,
  Layout,
  Check
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MotionHeadline } from '@/components/ui/motion-section';
import { FeatureDemos } from '@/components/features/feature-demos';
import { FeedbackModal } from '@/components/feedback-modal';

const roadmapDomains = [
  {
    id: 'ai-core',
    title: 'Intelligence Core',
    icon: Brain,
    description: 'The neural engine powering your study experience.',
    features: [
      { title: 'Class Chat', status: 'live', year: '2025' },
      { title: 'Syllabus Parser', status: 'live', year: '2025' },
      { title: 'Vision OCR', status: 'live', year: '2025' },
      { title: 'AI Chat Summaries', status: 'live', year: '2025' },
      { title: 'Voice-to-Study', status: 'future', year: '2026' },
      { title: 'Math & Symbols', status: 'future', year: '2026' }
    ]
  },
  {
    id: 'study-tools',
    title: 'Precision Tools',
    icon: Target,
    description: 'Specialized utilities for high-performance learning.',
    features: [
      { title: 'Flashcard engine', status: 'live', year: '2025' },
      { title: 'Study Analytics', status: 'live', year: '2025' },
      { title: 'Smart Focus', status: 'live', year: '2025' },
      { title: 'Interactive Charts & Graphs', status: 'live', year: '2025' },
      { title: 'Calendar Sync', status: 'active', year: '2026' },
      { title: 'Deep Note Search', status: 'future', year: '2026' }
    ]
  },
  {
    id: 'ecosystem',
    title: 'Connected Ecosystem',
    icon: Globe,
    description: 'Building bridges between students and platforms.',
    features: [
      { title: 'Syllabi Connect', status: 'active', year: '2026' },
      { title: 'Mobile App', status: 'future', year: '2026' },
      { title: 'Offline Mode', status: 'future', year: '2026' },
      { title: 'LMS Sync', status: 'future', year: '2026' },
      { title: 'Study Resource Hub', status: 'future', year: '2026' }
    ]
  }
];

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'AI-Powered Class Chats',
      description: 'Get personalized AI tutoring that understands your specific courses and syllabus.',
      benefits: [
        'Course-specific AI knowledge',
        'Instant homework help',
        'Exam preparation support',
        '24/7 availability'
      ]
    },
    {
      icon: FileText,
      title: 'Syllabus Upload & Analysis',
      description: 'Upload your syllabus and automatically create AI-powered class chats.',
      benefits: [
        'Smart content extraction',
        'Automatic class creation',
        'Assignment tracking',
        'Course structure analysis'
      ]
    },
    {
      icon: MessageCircle,
      title: 'General AI Chat',
      description: 'Get instant AI help for any academic question across all subjects.',
      benefits: [
        'Ask any academic question',
        'Get instant responses',
        'Multi-subject expertise',
        'Always available'
      ]
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Stay updated with AI responses and important course updates.',
      benefits: [
        'AI response alerts',
        'Assignment reminders',
        'Course notifications',
        'Study suggestions'
      ]
    },
    {
      icon: Upload,
      title: 'File Management',
      description: 'Upload and manage your syllabi and course materials securely.',
      benefits: [
        'Secure file storage',
        'PDF processing',
        'Document organization',
        'Easy access'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/40 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              x: [0, -150, 0],
              y: [0, 100, 0],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-40 right-20 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              x: [0, 80, 0],
              y: [0, -80, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 left-1/3 w-16 h-16 bg-blue-300/10 rounded-full blur-lg"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="mb-4 hover:bg-white/50 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>

            <MotionHeadline className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features for{' '}
              <motion.span
                className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                Academic Success
              </motion.span>
            </MotionHeadline>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Discover how CourseConnect transforms your study routine with intelligent tools designed for modern students.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Interactive Features Section */}
      <div className="bg-gray-50/50 dark:bg-gray-900/50 py-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Feature List Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ x: 10 }}
                  onClick={() => setActiveFeature(index)}
                  className={`cursor-pointer p-6 rounded-2xl transition-all duration-300 border ${
                    activeFeature === index
                      ? 'bg-white dark:bg-gray-800 shadow-xl border-blue-200 dark:border-blue-700'
                      : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      activeFeature === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${
                        activeFeature === index ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                      }`}>
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Detail View */}
            <div className="lg:col-span-8">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8">
                      <Sparkles className="h-4 w-4" />
                      Core Capability
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                      {features[activeFeature].title}
                    </h2>
                    
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                      {features[activeFeature].description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Key Benefits</h4>
                        <ul className="space-y-3">
                          {features[activeFeature].benefits.map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                              <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="relative group">
                        <FeatureDemos title={features[activeFeature].title} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-gray-700 mt-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Zap className="size-3" />
                        <span>Low Latency AI</span>
                      </div>
                      <div className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span>Semester 2025.1 Deployment</span>
                    </div>
                    <Button 
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 dark:text-slate-900 text-white px-10 py-6 rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      asChild
                    >
                      <Link href="/signup">
                        Get Started <ChevronRight className="h-5 w-5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bento Roadmap Section Integrated */}
          <div id="roadmap" className="mt-40 border-t border-slate-200 dark:border-slate-800 pt-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4">
                  The Vision <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">for 2026</span>
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  We're not just building features; we're architecting a new standard for academic achievement. Explore our specialized roadmap domains.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="flex gap-1 p-1 bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Live</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="size-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Developing</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="size-1.5 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Future</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roadmapDomains.map((domain, domainIdx) => {
                const DomainIcon = domain.icon;
                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: domainIdx * 0.1 }}
                    className="relative group p-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
                    
                    <div className="h-full bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col hover:border-blue-500/30 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                          <DomainIcon className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight">{domain.title}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{domain.description}</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        {domain.features.map((feature, featureIdx) => {
                          const isLive = feature.status === 'live';
                          const isActive = feature.status === 'active';
                          const isFuture = feature.status === 'future';
                          const is2026 = feature.year === '2026';

                          return (
                            <div 
                              key={feature.title}
                              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                                isLive 
                                ? 'bg-emerald-500/[0.03] border border-emerald-500/10' 
                                : isActive
                                ? 'bg-blue-500/[0.03] border border-blue-500/20 ring-1 ring-blue-500/10'
                                : 'bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isLive ? (
                                  <div className="size-4 flex items-center justify-center">
                                    <Check className="size-3.5 text-emerald-500 stroke-[3]" />
                                  </div>
                                ) : isActive ? (
                                  <div className="size-4 flex items-center justify-center">
                                    <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                  </div>
                                ) : (
                                  <div className="size-4 flex items-center justify-center">
                                    <div className="size-2 rounded-full bg-slate-400" />
                                  </div>
                                )}
                                <span className={`text-sm font-bold ${isLive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {feature.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                  is2026 ? 'text-blue-500/70' : 'text-emerald-500/70'
                                }`}>
                                  {feature.year}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Refined Roadmap Footer - Clean & Integrated */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">Have a vision for 2026?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Shape our roadmap by submitting your feature request today.</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  variant="outline"
                  className="rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 h-auto py-4 px-8 font-bold transition-all"
                  onClick={() => setShowFeedbackModal(true)}
                >
                  Request Feature
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-auto py-4 px-10 font-black shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  asChild
                >
                  <Link href="/signup" className="flex items-center gap-2">
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        defaultSubject="Feature Request"
      />

      {/* CTA Section - Adaptive Light/Dark Theme */}
      <div className="bg-slate-50 dark:bg-slate-950 py-32 relative overflow-hidden border-t border-slate-200 dark:border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.03] dark:from-blue-600/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
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
            
            <p className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4">
              <span>No credit card required</span>
              <div className="size-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              <span>Instant setup</span>
              <div className="size-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              <Link href="/login" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                Existing user? Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
