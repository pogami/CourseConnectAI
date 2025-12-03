"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BookOpen,
  MessageSquare,
  Upload,
  Settings,
  User,
  Bell,
  Home,
  LayoutDashboard,
  LogOut,
  Zap,
  Search,
  GraduationCap,
  FileText,
  BarChart,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/hooks/use-chat-store';
import { auth } from '@/lib/firebase/client-simple';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

export function GlobalCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { chats } = useChatStore();

  // Get category color for badges
  const getCategory = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('music') || lower.includes('mua')) return 'Music';
    if (lower.includes('physics') || lower.includes('phy')) return 'Science';
    if (lower.includes('biology') || lower.includes('bio')) return 'Science';
    if (lower.includes('chemistry') || lower.includes('chem')) return 'Science';
    if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra')) return 'Math';
    if (lower.includes('english') || lower.includes('literature')) return 'English';
    if (lower.includes('history') || lower.includes('hist')) return 'History';
    if (lower.includes('computer') || lower.includes('cs')) return 'Tech';
    return 'Other';
  };

  const getCategoryColorClasses = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Music': 'bg-purple-500 text-white',
      'Science': 'bg-blue-500 text-white',
      'Math': 'bg-green-500 text-white',
      'English': 'bg-red-500 text-white',
      'History': 'bg-amber-500 text-white',
      'Tech': 'bg-cyan-500 text-white',
      'Other': 'bg-gray-500 text-white',
    };
    return colors[category] || colors['Other'];
  };

  // Get all class chats
  const classChats = Object.entries(chats).filter(([_, chat]) => chat.chatType === 'class');

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear uploaded syllabi on logout
      localStorage.removeItem('uploaded-syllabi');
      toast.success('Logged out successfully! 👋');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to log out');
      console.error('Logout error:', error);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search courses, chats, settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(() => router.push('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/chat'))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chats</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/upload'))}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload Syllabus</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Courses */}
        {classChats.length > 0 && (
          <>
            <CommandGroup heading="Your Courses">
              {classChats.map(([chatId, chat]) => {
                const category = getCategory(chat.title);
                const colorClasses = getCategoryColorClasses(category);
                return (
                <CommandItem 
                  key={chatId} 
                  onSelect={() => handleSelect(() => router.push(`/dashboard/chat?chatId=${chatId}`))}
                >
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span className="flex-1">{chat.title}</span>
                    <Badge className={`ml-auto text-xs ${colorClasses}`}>
                      {category}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/chat?chatId=private-general-chat'))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>General Chat (AI)</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/flashcards'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Flashcards</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Settings & Account */}
        <CommandGroup heading="Settings & Account">
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => router.push('/dashboard/notifications'))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(handleLogout)}>
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span className="text-red-500">Log Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

