"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface AnimatedToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const variants = {
  default: {
    icon: Info,
    bgColor: 'bg-background',
    borderColor: 'border-border',
    iconColor: 'text-foreground',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30',
    borderColor: 'border-emerald-200/50 dark:border-emerald-700/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export function AnimatedToast({ 
  id, 
  title, 
  description, 
  variant = 'default', 
  duration = 5000,
  onClose 
}: AnimatedToastProps) {
  const { icon: Icon, bgColor, borderColor, iconColor } = variants[variant] || variants.default;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.3 
      }}
      className={`
        relative w-80 p-5 rounded-2xl border-2 shadow-2xl backdrop-blur-xl
        ${bgColor} ${borderColor}
        cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300
        ${variant === 'success' ? 'ring-2 ring-emerald-500/20 dark:ring-emerald-400/20' : ''}
      `}
      onClick={() => onClose(id)}
    >
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 15,
            delay: 0.1 
          }}
          className={`flex-shrink-0 ${variant === 'success' ? 'w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30' : iconColor}`}
        >
          <Icon className={variant === 'success' ? 'w-5 h-5 text-white' : `w-5 h-5 ${iconColor}`} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <motion.h4
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-base font-bold ${
              variant === 'success' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent' 
                : 'text-foreground'
            }`}
          >
            {title}
          </motion.h4>
          
          {description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-sm mt-2 leading-relaxed ${
                variant === 'success' 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-muted-foreground'
              }`}
            >
              {description}
            </motion.p>
          )}
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
            variant === 'success' 
              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
              : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <XCircle className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 right-0 h-1 origin-left rounded-b-2xl ${
          variant === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-60' 
            : 'bg-current opacity-20'
        }`}
      />
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: AnimatedToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <AnimatedToast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
