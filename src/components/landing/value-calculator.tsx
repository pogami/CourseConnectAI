'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Clock, TrendingUp, Sparkles, Gamepad2, Moon, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ValueCalculator() {
  const [courses, setCourses] = useState(4);
  const [hoursPerWeek, setHoursPerWeek] = useState(3);

  const calculations = useMemo(() => {
    // Hours spent manually organizing per course per week
    const manualHoursPerCourse = hoursPerWeek;
    const totalManualHours = courses * manualHoursPerCourse * 4; // per month
    
    // CourseConnect saves ~80% of organization time
    const savedHours = Math.round(totalManualHours * 0.8);
    const savedPerSemester = savedHours * 4; // 4 months per semester
    
    // Fun equivalents (approximate)
    const netflixEpisodes = Math.round(savedPerSemester / 0.75); // 45 min eps
    const gamingSessions = Math.round(savedPerSemester / 3); // 3 hour sessions
    const extraSleepNights = Math.round(savedPerSemester / 8); // 8 hour sleep
    
    return {
      totalManualHours,
      savedHours,
      savedPerSemester,
      netflixEpisodes,
      gamingSessions,
      extraSleepNights
    };
  }, [courses, hoursPerWeek]);

  return (
    <section className="py-24 lg:py-32 bg-gray-950 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-200/10 via-pink-200/10 to-blue-200/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Calculator className="w-3.5 h-3.5" />
            Time ROI Calculator
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            Stop wasting time<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">
              organizing PDF files.
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how much free time you're losing to manual syllabus tracking.
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
        >
          <div className="grid md:grid-cols-2 gap-12">
            {/* Inputs */}
            <div className="space-y-10">
              {/* Courses Slider */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-lg font-medium text-gray-200">
                    Number of courses
                  </label>
                  <span className="text-3xl font-bold text-white bg-white/10 px-4 py-1 rounded-lg min-w-[3ch] text-center">
                    {courses}
                  </span>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" 
                    style={{ width: `${((courses - 1) / 7) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={courses}
                    onChange={(e) => setCourses(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg pointer-events-none transition-all"
                    style={{ left: `calc(${((courses - 1) / 7) * 100}% - 12px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-3 font-medium">
                  <span>1 course</span>
                  <span>8 courses</span>
                </div>
              </div>

              {/* Hours Slider */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-lg font-medium text-gray-200">
                    Hours/week planning
                  </label>
                  <span className="text-3xl font-bold text-white bg-white/10 px-4 py-1 rounded-lg min-w-[3ch] text-center">
                    {hoursPerWeek}h
                  </span>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full">
                  <div 
                    className="absolute top-0 left-0 h-full bg-slate-600 rounded-full" 
                    style={{ width: `${((hoursPerWeek - 1) / 7) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg pointer-events-none transition-all"
                    style={{ left: `calc(${((hoursPerWeek - 1) / 7) * 100}% - 12px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-3 font-medium">
                  <span>1h</span>
                  <span>8h</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 border-l-2 border-gray-700 pl-4 py-1">
                Includes checking syllabi, hunting for due dates, organizing notes, and "what was the homework again?" texts.
              </p>
            </div>

            {/* Results */}
            <div className="flex flex-col justify-center space-y-6">
              {/* Fun Savings Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/10 to-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  That's enough time for:
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-teal-300 mb-1 text-xs font-bold uppercase tracking-wider">
                        <Gamepad2 className="w-3 h-3" /> Gaming
                      </div>
                      <div className="text-2xl font-bold text-white">{calculations.gamingSessions}</div>
                      <div className="text-xs text-gray-400">long sessions</div>
                   </div>
                   
                   <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-blue-300 mb-1 text-xs font-bold uppercase tracking-wider">
                        <Moon className="w-3 h-3" /> Sleep
                      </div>
                      <div className="text-2xl font-bold text-white">{calculations.extraSleepNights}</div>
                      <div className="text-xs text-gray-400">full nights</div>
                   </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tight">{calculations.savedPerSemester}</span>
                    <span className="text-lg font-medium text-blue-200">hours saved</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">per semester with CourseConnect</p>
                </div>
              </div>

              {/* CTA */}
              <Button
                asChild
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-full bg-white text-black hover:bg-gray-200 shadow-xl shadow-white/5 hover:shadow-white/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link href="/login?state=signup">
                  Start Saving Time Now
                </Link>
              </Button>
              
              <p className="text-center text-xs text-gray-600">
                Based on average student study habits. Your mileage may vary.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
