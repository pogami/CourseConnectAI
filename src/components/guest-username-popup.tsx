"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, CheckCircle, XCircle } from 'lucide-react';

interface GuestUsernamePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

const PROFANITY_WORDS = [
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
  'shit', 'shitting', 'shitted', 'shitter', 'shits',
  'bitch', 'bitches', 'bitching', 'bitched',
  'asshole', 'assholes', 'dick', 'dicks', 'pussy', 'pussies',
  'damn', 'damned', 'damning', 'hell', 'crap', 'piss',
  'nigger', 'nigga', 'niggas', 'chink', 'chinks', 'spic', 'spics',
  'kike', 'kikes', 'wetback', 'wetbacks', 'gook', 'gooks',
  'fag', 'fags', 'faggot', 'faggots', 'dyke', 'dykes', 'tranny', 'trannies',
  'retard', 'retarded', 'retards', 'moron', 'morons', 'idiot', 'idiots',
  'stupid', 'dumb', 'dumbass', 'dumbasses', 'whore', 'slut',
  'loser', 'hate', 'kill', 'die'
];

const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'mod', 'staff', 'support',
  'system', 'bot', 'ai', 'courseconnect', 'guest', 'anonymous',
  'user', 'test', 'demo', 'example', 'null', 'undefined'
];

export function GuestUsernamePopup({ isOpen, onClose, onUsernameSet }: GuestUsernamePopupProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError('');
    }
  }, [isOpen]);

  // Validate username
  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    
    if (!trimmed) return null; // Empty is OK (no error shown)
    if (trimmed.length < 2) return 'Username must be at least 2 characters';
    if (trimmed.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Only letters, numbers, underscores, and hyphens allowed';
    
    const lower = trimmed.toLowerCase();
    if (PROFANITY_WORDS.some(word => lower.includes(word))) return 'Username contains inappropriate content';
    if (RESERVED_USERNAMES.includes(lower)) return 'This username is reserved';
    
    return null; // Valid
  };

  // Real-time validation
  useEffect(() => {
    if (!username.trim()) {
      setError('');
      return;
    }
    setError(validate(username) || '');
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }

    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Username is valid - proceed
    onUsernameSet(trimmed);
    onClose();
  };

  const isValid = username.trim() && !error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-blue-600 dark:text-blue-400">
            Choose Your Alias
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
            Enter a username to join the chat as a guest.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">@</span>
              </div>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl"
                maxLength={20}
              />
              {isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            
            <div className="min-h-[20px] text-center">
              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}
              {isValid && (
                <p className="text-xs text-green-500 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-3 w-3" />
                  Looks good!
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              Join Chat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
