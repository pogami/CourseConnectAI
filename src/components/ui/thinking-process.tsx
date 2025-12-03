"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ThinkingProcessProps {
  status?: 'thinking' | 'complete' | 'error';
  defaultOpen?: boolean;
  thinkingContent?: string;
  customText?: string;
}

export function ThinkingProcess({ 
  status = 'thinking',
  customText,
}: ThinkingProcessProps) {
  const [isThinking, setIsThinking] = useState(status === 'thinking');

  useEffect(() => {
    setIsThinking(status === 'thinking');
  }, [status]);

  if (!isThinking) {
    return null;
  }

  const text = customText || "thinking...";

  return (
    <div className="my-2 flex items-center">
      <div className="flex">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-[0.16em]"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
