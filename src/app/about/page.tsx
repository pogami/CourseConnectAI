'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/landing/navigation';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Target01Icon,
  BulbIcon,
  FavouriteIcon,
} from 'hugeicons-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MotionSection, MotionHeadline, MotionCard } from '@/components/ui/motion-section';
import { HideAISupport } from '@/components/hide-ai-support';
import { ValueDemos } from '@/components/about/value-demos';

export default function AboutPage() {
  const [activeValue, setActiveValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: UserGroupIcon,
      title: 'Student-Centered',
      description: 'Building features with students\' needs in mind, starting with AI-powered chat and syllabus analysis.'
    },
    {
      icon: Target01Icon,
      title: 'Academic Excellence',
      description: 'Committed to empowering students through the tools we\'re developing for academic success.'
    },
    {
      icon: BulbIcon,
      title: 'Innovation',
      description: 'Continuously developing new educational technology features to enhance learning experiences.'
    },
    {
      icon: FavouriteIcon,
      title: 'Community',
      description: 'Working to build connections between students and create collaborative learning environments.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <div className="relative bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800">

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
                <ArrowLeft01Icon className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>

            <MotionHeadline className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About{' '}
              <motion.span
                className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent"
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
                CourseConnect
              </motion.span>
            </MotionHeadline>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              We're on a mission to revolutionize how students learn, collaborate, and succeed in their academic journey.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Interactive Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Our Story
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-full"></div>

          {/* Timeline Items */}
          <div className="space-y-24">
            {[
              {
                year: "Aug 2025",
                title: "The Beginning",
                description: "When you can't rely on your professor or classmates, you still need to understand the material. CourseConnect gives you that - AI-powered support that actually knows your syllabus and is available 24/7. CourseConnect was born from a real classroom experience: inconsistent instruction and low engagement. I built it to ensure every student has access to reliable AI-powered tutoring and study resources, regardless of their class dynamics.",
                icon: BulbIcon,
                side: "left"
              },
              {
                year: "Aug-Now",
                title: "Development Phase",
                description: "Built the AI engine that reads and understands syllabi, provides personalized tutoring, and adapts to each student's learning style. Created intelligent chat assistance that delivers contextual help, forming the foundation for a comprehensive student success platform.",
                icon: UserGroupIcon,
                side: "right"
              },
              {
                year: "Future",
                title: "Our Vision",
                description: "Envision CourseConnect expanding to universities nationwide, integrating with LMS systems, and becoming a comprehensive ecosystem where students, professors, and institutions collaborate for academic success through AI-powered tools.",
                icon: FavouriteIcon,
                side: "left"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: item.side === 'left' ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex items-center ${item.side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-1/2 ${item.side === 'left' ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                  <motion.div
                    whileHover={{ scale: 1.01, y: -4 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-md border border-slate-200/70 dark:border-slate-800 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className={`flex items-center gap-4 ${item.side === 'left' ? 'justify-end' : 'justify-start'} mb-4 relative z-10`}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm bg-sky-50 dark:bg-slate-900 border border-sky-500/40">
                        <item.icon className="h-7 w-7 text-sky-600 dark:text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{item.year}</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed relative z-10">{item.description}</p>
                  </motion.div>
                </div>

                {/* Timeline Dot */}
                <div className="relative z-10 flex items-center justify-center w-8 h-8">
                  <div className="w-4 h-4 bg-sky-500 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,1)] dark:shadow-[0_0_0_4px_rgba(17,24,39,1)]"></div>
                  <div className="absolute w-8 h-8 bg-sky-500/10 rounded-full motion-safe:animate-ping"></div>
                </div>

                <div className="w-1/2"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Values Section */}
      <div className="bg-white dark:bg-gray-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              These core principles guide everything we do at CourseConnect.
            </p>
          </motion.div>

          {/* Value Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            {values.map((value, index) => (
              <motion.button
                key={value.title}
                onClick={() => setActiveValue(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 backdrop-blur-sm border ${activeValue === index
                    ? 'bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 shadow-lg border-blue-200 dark:border-blue-800'
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/80 border-transparent'
                  }`}
              >
                {React.createElement(value.icon, { className: "h-4 w-4 inline mr-2" })}
                {value.title}
              </motion.button>
            ))}
          </motion.div>

          {/* Active Value Showcase */}
          <motion.div
            key={activeValue}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200/70 dark:border-slate-800 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-md bg-sky-600 dark:bg-sky-600 border border-sky-500/60"
                  >
                    {React.createElement(values[activeValue].icon, { className: "h-10 w-10 text-white" })}
                  </motion.div>
                  <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                    {values[activeValue].title}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {values[activeValue].description}
                  </p>
                </div>
                <div className="relative">
                  <ValueDemos title={values[activeValue].title} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* All Values Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2 }
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-md border border-slate-200/70 dark:border-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer group text-center"
                onClick={() => setActiveValue(index)}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300 bg-sky-600 dark:bg-sky-600 border border-sky-500/60"
                >
                  {React.createElement(value.icon, { className: "h-7 w-7 text-white" })}
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-32 relative overflow-hidden bg-white dark:bg-gray-950">
        {/* Background Effects - Only visible in dark mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-gray-900/50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-t from-gray-900/40 to-transparent blur-[180px]" />
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
              Our Mission
            </h2>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              We're democratizing access to quality education by building AI-powered tools that help students succeed academically. Starting with intelligent chat assistance and syllabus analysis, we're creating the foundation for collaborative learning.
            </p>

            <div className="flex flex-col items-center justify-center gap-6">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-14 py-9 text-2xl font-black rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.2)] dark:shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => window.location.href = '/signup'}
              >
                Join Our Mission
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <HideAISupport />
    </div>
  );
}