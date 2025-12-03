'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function MegaBrandText() {
  return (
    <section className="pt-20 pb-0 bg-white dark:bg-gray-950 overflow-hidden select-none pointer-events-none">
      <div className="w-full flex justify-center items-end">
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-[12vw] leading-[0.8] font-black tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-50 dark:from-gray-800 dark:to-gray-950/50 opacity-50"
        >
          COURSECONNECT
        </motion.h1>
      </div>
    </section>
  );
}

