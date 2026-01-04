'use client';

import React from 'react';
import { motion } from 'framer-motion';

const scenarios = [
  "3 exams in 48 hours",
  "Turning a 4-page PDF",
  "Group projects with 'ghost' partners",
  "That 11:59 PM deadline panic",
  "Assignments that weren't on the syllabus",
  "Mandatory attendance for a recorded lecture",
  "Study sessions fueled by sheer panic",
  "Calculus homework at 2 AM",
  "Missing a submission by 10 seconds",
  "Syllabus changes on a Sunday night",
  "18 credits and a part-time job",
  "Finals week chaos",
];

export function SocialProofSection() {
  return (
    <section className="py-16 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          will-change: transform;
        }
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 40s;
          }
        }
      `}} />
      
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10" />
      
      <div className="container mx-auto px-4 mb-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
        >
          Built for the chaos students actually deal with
        </motion.p>
      </div>
      
      <div className="flex w-fit animate-marquee gap-12 md:gap-16 whitespace-nowrap">
        {[...scenarios, ...scenarios].map((item, idx) => (
          <span 
            key={idx} 
            className="text-xl md:text-2xl font-bold text-gray-300 dark:text-gray-800 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 cursor-default"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

