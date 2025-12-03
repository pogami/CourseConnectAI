'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden bg-white dark:bg-gray-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-t from-gray-50/80 dark:from-gray-900/60 to-transparent blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15),_transparent_55%)]" />
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
              ace your classes?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Upload your syllabus, see every deadline in one dashboard, and get AI help that actually knows your course.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Link href="#upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Syllabus
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-full border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 hover:scale-105"
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Works with any syllabus</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free during beta</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

