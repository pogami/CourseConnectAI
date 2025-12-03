"use client";

import { motion } from "framer-motion";
import { CCLogo } from "@/components/icons/cc-logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <CCLogo className="h-20 w-auto md:h-24" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
        >
          CourseConnect <span className="text-blue-600 dark:text-blue-400">AI</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
