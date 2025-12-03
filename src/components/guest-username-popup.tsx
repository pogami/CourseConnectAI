"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, CheckCircle, XCircle } from 'lucide-react';

interface GuestUsernamePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

// Basic profanity filter - you can expand this list
const PROFANITY_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap', 'piss',
  'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'bitch',
  'stupid', 'idiot', 'moron', 'dumb', 'loser', 'hate', 'kill', 'die'
];

// Reserved usernames
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'mod', 'staff', 'support',
  'system', 'bot', 'ai', 'courseconnect', 'guest', 'anonymous',
  'user', 'test', 'demo', 'example', 'null', 'undefined'
];

export function GuestUsernamePopup({ isOpen, onClose, onUsernameSet }: GuestUsernamePopupProps) {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [usedUsernames, setUsedUsernames] = useState<Set<string>>(new Set());

  // Load used usernames from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('usedGuestUsernames');
    if (stored) {
      try {
        const usernames = JSON.parse(stored);
        setUsedUsernames(new Set(usernames));
      } catch (error) {
        console.warn('Failed to load used usernames:', error);
      }
    }
  }, []);

  // Save used usernames to localStorage
  const saveUsedUsername = (username: string) => {
    const newUsedUsernames = new Set(usedUsernames);
    newUsedUsernames.add(username.toLowerCase());
    setUsedUsernames(newUsedUsernames);
    localStorage.setItem('usedGuestUsernames', JSON.stringify(Array.from(newUsedUsernames)));
  };

  // Validate username
  const validateUsername = (value: string): { isValid: boolean; error: string } => {
    const trimmed = value.trim();
    
    // Check length
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Username must be at least 2 characters long' };
    }
    
    if (trimmed.length > 20) {
      return { isValid: false, error: 'Username must be 20 characters or less' };
    }
    
    // Check for valid characters (letters, numbers, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    // Check for profanity
    const lowerValue = trimmed.toLowerCase();
    for (const word of PROFANITY_WORDS) {
      if (lowerValue.includes(word)) {
        return { isValid: false, error: 'Username contains inappropriate content' };
      }
    }
    
    // Check for reserved usernames
    if (RESERVED_USERNAMES.includes(lowerValue)) {
      return { isValid: false, error: 'This username is reserved' };
    }
    
    // Check for duplicates
    if (usedUsernames.has(lowerValue)) {
      return { isValid: false, error: 'This username is already taken' };
    }
    
    return { isValid: true, error: '' };
  };

  // Handle username input change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Don't show validation errors while typing - only clear them
    if (error) {
      setError('');
      setIsValid(null);
    }
  };

  // Handle username input blur (when user stops typing)
  const handleUsernameBlur = () => {
    if (username.trim()) {
      const validation = validateUsername(username);
      setIsValid(validation.isValid);
      if (!validation.isValid) {
        setError(validation.error);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    setIsChecking(true);
    
    // Simulate a brief check (in real app, you might check against a server)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save the username as used
    saveUsedUsername(username.trim());
    
    // Set the username and close popup
    onUsernameSet(username.trim());
    onClose();
  };

  // Handle popup close
  const handleClose = () => {
    if (!isChecking) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Alias
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
            Enter a unique username to join the chat as a guest.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">@</span>
              </div>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onBlur={handleUsernameBlur}
                disabled={isChecking}
                className="pl-8 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-xl"
                maxLength={20}
              />
              {isValid === true && !error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-200">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-200">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            
            {/* Validation Message */}
            <div className="min-h-[20px]">
              {error && (
                <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-1.5 animate-in slide-in-from-top-1 fade-in">
                  {error}
                </p>
              )}
              {isValid === true && !error && (
                <p className="text-xs text-green-500 font-medium flex items-center justify-center gap-1.5 animate-in slide-in-from-top-1 fade-in">
                  Username available
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isChecking}
              className="h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!username.trim() || isValid !== true || isChecking}
              className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Join Chat'
              )}
            </Button>
          </div>
        </form>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 mt-2 border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Requirements</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div className={`w-1.5 h-1.5 rounded-full ${username.length >= 2 && username.length <= 20 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              2-20 characters
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div className={`w-1.5 h-1.5 rounded-full ${/^[a-zA-Z0-9_-]*$/.test(username) && username.length > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              Letters, numbers, underscores, hyphens
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div className={`w-1.5 h-1.5 rounded-full ${username.length > 0 && isValid === true ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              Unique & appropriate
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
