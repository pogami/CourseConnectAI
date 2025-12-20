"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: Array<{
    userId: string;
    userName: string;
    userPhotoURL?: string;
  }>;
  className?: string;
}

export function TypingIndicator({ users, className = "" }: TypingIndicatorProps) {
  if (users.length === 0) return null;
  
  // Debug log for typing users
  console.log('TypingIndicator rendering users:', users.map(u => ({ 
    userId: u.userId, 
    userName: u.userName
  })));

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else if (users.length === 3) {
      return `${users[0].userName}, ${users[1].userName}, and ${users[2].userName} are typing...`;
    } else {
      const firstThree = users.slice(0, 3).map(u => u.userName).join(', ');
      return `${firstThree}, and ${users.length - 3} others are typing...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/30",
        "text-xs sm:text-sm",
        className
      )}
    >
      {/* Profile pictures */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <Avatar key={user.userId} className="w-8 h-8 border-2 border-background">
            <AvatarImage 
              src={user.userPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} 
              alt={user.userName} 
            />
            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              {user.userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {users.length > 3 && (
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">
              +{users.length - 3}
            </span>
          </div>
        )}
      </div>

      {/* Typing animation and text */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: 0.4,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {getTypingText()}
        </span>
      </div>
    </motion.div>
  );
}
