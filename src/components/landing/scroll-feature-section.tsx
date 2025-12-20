'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, CheckCircle, Clock, FileText, Sparkles, Zap, AlertCircle, TrendingUp, ShieldCheck, Check, Upload, BookOpen, ArrowRight, Users, Search, Filter, MapPin, GraduationCap, Bell } from 'lucide-react';
import { UserGroupIcon, LaptopIcon } from 'hugeicons-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

import { RippleText } from '@/components/ripple-text';
import { ThinkingProcess } from '@/components/ui/thinking-process';
import { Button } from '@/components/ui/button';

export function ScrollFeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState<string>('');


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`);
    };

    // Update immediately
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="features" ref={containerRef} className="relative bg-white dark:bg-gray-950 py-24 lg:py-40 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-32 lg:space-y-48">

          {/* Feature 1: Upload */}
          <div className="group relative">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <div className="flex-1 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-sm ring-4 ring-white dark:ring-gray-950">
                    01
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    Upload
                  </span>
                </div>
                
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                  Upload your syllabus.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                    Find your deadlines.
                  </span>
                </h3>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                  Upload your syllabus and the AI automatically extracts assignment deadlines and exam dates. Everything shows up in your dashboard so you never miss a due date.
                </p>

                <ul className="space-y-3">
                  {[
                    'No manual data entry',
                    'Deadlines extracted instantly',
                    'Supports PDF & DOCX',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 flex justify-center relative">
                {/* Ambient Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Authentic Upload Interface Replica */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 backdrop-blur-sm"
                >
                  <div className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 flex flex-col items-center justify-center py-12 px-4 text-center transition-all duration-500 group-hover:border-purple-400 dark:group-hover:border-purple-600 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20">
                    <div className="p-4 rounded-full bg-white dark:bg-gray-800 shadow-lg shadow-purple-100 dark:shadow-none mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Drop syllabus or click to browse
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      PDF, DOCX, or TXT • Max 10MB
                    </p>
                    <div className="flex gap-2">
                      <div className="px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30">PDF</div>
                      <div className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/30">DOCX</div>
                      <div className="px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700">TXT</div>
                    </div>
                  </div>

                  {/* Floating "File Detected" Animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute -bottom-6 left-6 right-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4"
                  >
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 border border-red-100 dark:border-red-900/30">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Neuroscience_Syllabus_Fall2024.pdf</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
                            className="h-full bg-green-500 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-green-600 dark:text-green-400">100%</span>
                      </div>
                    </div>
                    <div className="text-green-500 bg-green-50 dark:bg-green-900/20 p-1 rounded-full">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Feature 2: Organize */}
          <div className="group relative">
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
              <div className="flex-1 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm ring-4 ring-white dark:ring-gray-950">
                    02
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Organize
                  </span>
                </div>
                
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                  Your entire semester,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    actually organized.
                  </span>
                </h3>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                  See all your deadlines from every course in one place. No more jumping between Canvas, Blackboard, or email—everything's organized in one dashboard.
                </p>

                <ul className="space-y-3">
                  {[
                    'Sorted by due date',
                    'Shows course and urgency',
                    'Timeline view with dates',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 flex justify-center relative">
                {/* Ambient Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Authentic Dashboard Replica */}
                <div className="relative w-full max-w-md space-y-4">

                  {/* Card 1: Course Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative z-10 group"
                  >
                    {/* Header with improved gradient */}
                    <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-blue-950/40 dark:via-gray-900 dark:to-indigo-950/40 p-4 border-b border-blue-100/50 dark:border-blue-900/30 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg shadow-sm">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">Course Information</h4>
                    </div>
                    <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800/50 group/item hover:bg-blue-50/50 dark:hover:bg-blue-950/20 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Course Name</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-900/30 shadow-sm">Biology 101</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800/50 group/item hover:bg-blue-50/50 dark:hover:bg-blue-950/20 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Professor</span>
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-900/50">JP</div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Dr. James Park</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center group/item hover:bg-blue-50/50 dark:hover:bg-blue-950/20 -mx-2 px-2 rounded-lg transition-colors">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Schedule</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Tue/Thu 10:00 AM</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Academic Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative z-10 group"
                  >
                    {/* Header with improved gradient */}
                    <div className="bg-gradient-to-r from-purple-50 via-white to-pink-50 dark:from-purple-950/40 dark:via-gray-900 dark:to-pink-950/40 p-4 border-b border-purple-100/50 dark:border-purple-900/30 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">Academic Details</h4>
                    </div>
                    <div className="p-5 space-y-4 bg-transparent">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-800/50">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Upcoming This Week</span>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 shadow-sm">3 Found</span>
                      </div>
                      <div className="space-y-2.5">
                        {/* Lab Report #4 */}
                        <div className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-md transition-all duration-200 group/item">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-1.5 h-10 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Lab Report #4</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Weight: 8% • Mon</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Oct 28</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded mt-0.5">Priority 1</div>
                          </div>
                        </div>
                        {/* Problem Set 3 */}
                        <div className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-md transition-all duration-200 group/item">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-1.5 h-10 bg-gradient-to-b from-purple-500/70 to-purple-600/70 rounded-full shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Problem Set 3</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Weight: 5% • Wed</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Oct 30</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded mt-0.5">Priority 2</div>
                          </div>
                        </div>
                        {/* Reading Response */}
                        <div className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-md transition-all duration-200 group/item">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-1.5 h-10 bg-gradient-to-b from-purple-500/50 to-purple-600/50 rounded-full shadow-sm flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Reading Response</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Weight: 2% • Fri</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Nov 1</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded mt-0.5">Priority 3</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Success Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute -right-6 top-1/2 transform -translate-y-1/2 bg-green-500 text-white pl-3 pr-5 py-3 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-3 text-sm font-bold z-20 ring-4 ring-white dark:ring-gray-950"
                  >
                    <div className="bg-white/20 p-1 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span>Syllabus Parsed</span>
                  </motion.div>

                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Remember (Infinite Context) */}
          <div className="group relative">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <div className="flex-1 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm ring-4 ring-white dark:ring-gray-950">
                    03
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Remember
                  </span>
                </div>
                <h3 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                  An AI that reads<br />
                  <span className="text-indigo-600 dark:text-indigo-400">your homework.</span>
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Don't just ChatGPT it. CourseConnect knows what your professor actually assigned, so you get answers that make sense for your class, not generic internet advice.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ Handwritten notes OCR now available in chat
                  </span>
                </div>

                <ul className="space-y-3">
                  {[
                    'Knows your specific class',
                    'Cites the syllabus',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 flex justify-center relative">
                {/* Authentic Chat Memory Visual - Compact & Authentic */}
                <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">

                  {/* Chat Body */}
                    <div className="flex-1 p-5 space-y-5 bg-white dark:bg-gray-900">

                      {/* User Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        onViewportEnter={() => {
                          // Reset state when entering view to restart animation
                          setShowThinking(false);
                          setShowResponse(false);

                          // Start sequence
                          setTimeout(() => setShowThinking(true), 1000);
                          setTimeout(() => {
                            setShowThinking(false);
                            setShowResponse(true);
                          }, 3500);
                        }}
                        className="flex justify-end"
                      >
                        <div className="bg-[#60A5FA] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] font-medium shadow-sm max-w-[90%]">
                          What topics should I focus on for the midterm next week?
                        </div>
                      </motion.div>

                      {/* AI Response Container */}
                      <div className="min-h-[180px]">
                        {/* Thinking State */}
                        {showThinking && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-3"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <img src="/pageicon.png" alt="CourseConnect AI" className="w-8 h-8 object-contain" />
                            </div>
                            <ThinkingProcess customText="checking your syllabus" />
                          </motion.div>
                        )}

                        {/* AI Response */}
                        {showResponse && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                          >
                            {/* Avatar */}
                            <div className="flex-shrink-0 mt-0.5">
                              <img src="/pageicon.png" alt="CourseConnect AI" className="w-8 h-8 object-contain" />
                            </div>

                            <div className="flex-1 space-y-1.5">
                              {/* Header */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">CourseConnect AI</span>
                                <span className="text-[10px] font-mono text-gray-400">{currentTime || '--:-- --'}</span>
                              </div>

                              {/* Content */}
                              <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                                <p>
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    Based on your <strong>Calculus 101</strong> syllabus, your midterm covers limits, derivatives, and applications. Since you have <strong>Assignment 2</strong> due Monday and the midterm next Friday, here's what to prioritize:
                                  </span>
                                </p>
                                <p className="tracking-normal">
                                  <strong className="tracking-normal">1. Derivatives</strong> - This is on both your assignment and the midterm. Master the power rule, product rule, and chain rule.
                                </p>
                                <p className="tracking-normal">
                                  <strong className="tracking-normal">2. Limits</strong> - Review the limit definition of derivatives since your professor emphasized this in the syllabus.
                                </p>
                                <p className="tracking-normal">
                                  <strong className="tracking-normal">3. Applications</strong> - Practice optimization problems and related rates, which are listed in your course topics.
                                </p>
                                <p className="tracking-normal">
                                  Want me to walk through any of these concepts? I can help with specific problems from your assignments too.
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 italic text-xs mt-2">
                                  Referenced your syllabus: course topics, assignment due dates, and exam schedule.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                  </div>
                  {/* Input field removed as requested */}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Connect (Student Matching) */}
          <div className="group relative">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <div className="flex-1 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm ring-4 ring-white dark:ring-gray-950">
                    04
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Connect
                  </span>
                </div>
                <h3 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                  Study together,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">ace together.</span>
                </h3>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 text-sm">
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                    Syllabi-based student matching coming soon —{' '}
                    <Link href="/features#roadmap" className="underline hover:text-indigo-900 dark:hover:text-indigo-200 font-semibold">
                      see roadmap
                    </Link>
                  </span>
                </div>

                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Upload your syllabus and automatically connect with students in the same course at your school or similar courses at other institutions. Form study groups and study smarter together.
                </p>

                {/* Compact Contextual Waitlist Form */}
                <div className="relative p-1.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm max-w-md">
                  <form 
                    className="flex flex-col sm:flex-row gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!waitlistEmail || waitlistStatus === 'loading') return;

                      setWaitlistStatus('loading');
                      setWaitlistMessage('');

                      try {
                        const response = await fetch('/api/waitlist', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: waitlistEmail }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setWaitlistStatus('success');
                          setWaitlistMessage(data.message);
                          setWaitlistEmail('');
                          setTimeout(() => {
                            setWaitlistStatus('idle');
                            setWaitlistMessage('');
                          }, 5000);
                        } else {
                          setWaitlistStatus('error');
                          setWaitlistMessage(data.message || data.error || 'Something went wrong.');
                        }
                      } catch (error) {
                        setWaitlistStatus('error');
                        setWaitlistMessage('Failed to submit.');
                      }
                    }}
                  >
                    <input
                      type="email"
                      placeholder="Get notified at launch..."
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      disabled={waitlistStatus === 'loading' || waitlistStatus === 'success'}
                      className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium focus:outline-none placeholder-slate-400 text-slate-900 dark:text-white disabled:opacity-50"
                      required
                    />
                    <Button 
                      type="submit"
                      disabled={waitlistStatus === 'loading' || waitlistStatus === 'success'}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {waitlistStatus === 'loading' ? 'Adding...' : waitlistStatus === 'success' ? 'Added!' : 'Notify Me'}
                    </Button>
                  </form>
                  {waitlistMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute -bottom-7 left-2 text-[10px] font-bold uppercase tracking-wider ${
                        waitlistStatus === 'success' ? 'text-indigo-600' : 'text-rose-500'
                      }`}
                    >
                      {waitlistMessage}
                    </motion.p>
                  )}
                </div>

                <ul className="space-y-3">
                  {[
                    'Automatic student matching',
                    'Same course or similar classes',
                    'Form study groups instantly',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 flex justify-center relative">
                {/* Shared Class Chat - Multiple Institutions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative w-full max-w-md bg-transparent dark:bg-transparent rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-indigo-950/30 p-4 border-b border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <UserGroupIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Shared Class Chat</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">One chat for everyone studying this course</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Info */}
                  <div className="p-5" style={{ backgroundColor: 'transparent' }}>
                    {/* Main Class Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 p-5 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 mb-4 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <LaptopIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-1 course-text-container">
                          <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Introduction to Computer Science</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Students connected by matching course content</p>
                        </div>
                      </div>
                      
                      {/* Total Students */}
                      <div className="flex items-center justify-between pt-4 border-t border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2.5">
                          <UserGroupIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Students Connected</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">90</span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">across 3 schools</p>
                        </div>
                      </div>
                    </div>

                    {/* Students by Institution */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Across Institutions</div>
                      
                      {/* Georgia State University */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">Georgia State University</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">CS 1301 - Intro to Computer Science</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">45</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">students</div>
                        </div>
                      </motion.div>

                      {/* Georgia Tech */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">Georgia Tech</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">CS 101 - Computer Science Fundamentals</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-teal-600 dark:text-teal-400">30</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">students</div>
                        </div>
                      </motion.div>

                      {/* Emory University */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">Emory University</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">COMPSCI 101 - Introduction to Computing</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-teal-600 dark:text-teal-400">15</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">students</div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Join Chat Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Join Chat with 90 Students</span>
                    </motion.button>

                    {/* Connection Note */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                        The first student to upload creates the chat. Everyone else with matching courses can discover and join instantly.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
