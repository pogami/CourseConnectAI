'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, FileText, Sparkles, Zap, AlertCircle, TrendingUp, ShieldCheck, Check, Upload, BookOpen, ArrowRight } from 'lucide-react';

import { RippleText } from '@/components/ripple-text';
import { ThinkingProcess } from '@/components/ui/thinking-process';

export function ScrollFeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showThinking, setShowThinking] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

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
                  Stop drowning<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                    in PDFs.
                  </span>
                </h3>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                  Upload your syllabus and let the AI hunt for deadlines, exams, and readings so you don’t have to. It finds the dates you missed and puts them on your calendar.
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
                  See exactly what's due this week without checking 5 different Canvas pages. One dashboard, zero chaos. You'll finally know if you have a free weekend or not.
                </p>

                <ul className="space-y-3">
                  {[
                    'Auto-sorted by urgency',
                    'Color-coded by class',
                    'Visual timeline',
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
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden relative z-10"
                  >
                    <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-blue-950/30 p-4 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">Course Information</h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-800">
                        <span className="text-xs text-gray-500 font-medium">Course Name</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">Biology 101</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-800">
                        <span className="text-xs text-gray-500 font-medium">Professor</span>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">JP</div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Dr. James Park</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">Schedule</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Tue/Thu 10:00 AM
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Academic Details */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden relative z-10"
                  >
                    <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/30 p-4 border-b border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">Academic Details</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Upcoming This Week</span>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">3 Found</span>
                      </div>
                      <div className="space-y-2">
                        {/* Lab Report #4 */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900 dark:text-white">Lab Report #4</div>
                              <div className="text-[10px] text-gray-500">Weight: 8% • Mon</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Oct 28</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Priority 1</div>
                          </div>
                        </div>
                        {/* Problem Set 3 */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-purple-500/50 rounded-full"></div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900 dark:text-white">Problem Set 3</div>
                              <div className="text-[10px] text-gray-500">Weight: 5% • Wed</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Oct 30</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Priority 2</div>
                          </div>
                        </div>
                        {/* Reading Response */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-purple-500/30 rounded-full"></div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900 dark:text-white">Reading Response</div>
                              <div className="text-[10px] text-gray-500">Weight: 2% • Fri</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900 dark:text-white">Nov 1</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Priority 3</div>
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
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  Remember
                </div>
                <h3 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                  <span className="text-sm uppercase tracking-[0.4em] text-gray-400 dark:text-gray-600 block mb-2">Coming Soon: Lecture Notes and Handwritten Texts</span>
                  An AI that reads<br />
                  <span className="text-indigo-600 dark:text-indigo-400">your homework.</span>
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Don't just ChatGPT it. CourseConnect knows what your professor actually assigned, so you get answers that make sense for your class, not generic internet advice.
                </p>

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
                          I have 3 assignments due next week. How should I prioritize them?
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
                            <ThinkingProcess customText="checking your syllabus..." />
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
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Based on your syllabus, here's your strategic priority:</span>
                                </p>
                                <p>
                                  <strong>Lab Report #4 (due Mon)</strong> – Start here. Worth 8% of your grade and typically takes 4–5 hours.
                                </p>
                                <p>
                                  <strong>Problem Set 3 (due Wed)</strong> – Worth 5% but builds on concepts for the midterm. Do after the lab report.
                                </p>
                                <p>
                                  <strong>Reading Response (due Fri)</strong> – Only 2% of your grade. Quick 30‑min write‑up you can do last.
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 italic text-xs mt-2">
                                  Analyzed weights, deadlines & complexity from your syllabus.
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

        </div>
      </div>
    </div>
  );
}
