"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu01Icon,
  Cancel01Icon,
  Home01Icon,
  Chatting01Icon,
  FolderUploadIcon,
  BookOpen01Icon,
  UserGroupIcon,
  Settings01Icon,
  Notification01Icon
} from "hugeicons-react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client-simple";
// Realtime Database removed
import { useToast } from "@/hooks/use-toast";
import { useChatStore } from "@/hooks/use-chat-store";

interface MobileNavigationProps {
  user?: any;
  className?: string;
}

export function MobileNavigation({ user, className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { clearGuestData } = useChatStore();

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home01Icon },
    { name: "Class Chat", href: "/dashboard/chat", icon: Chatting01Icon },
    { name: "Syllabus Upload", href: "/dashboard/upload", icon: FolderUploadIcon },
    { name: "Notifications", href: "/dashboard/notifications", icon: Notification01Icon },
  ];

  const closeSheet = () => setIsOpen(false);

  const handleLogout = async () => {
    console.log('=== MOBILE LOGOUT INITIATED ===');
    console.log('User:', user);
    
    if (!user) {
      window.location.href = '/home';
      return;
    }

    // Handle guest logout
    if (user.isGuest || user.isAnonymous) {
      console.log('Mobile guest user logout');
      localStorage.removeItem('guestUser');
      localStorage.removeItem('uploaded-syllabi'); // Clear uploaded syllabi on logout
      clearGuestData();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your guest account.",
      });
      setTimeout(() => {
        window.location.href = '/home';
      }, 1000);
      return;
    }

    try {
      console.log('Mobile starting Firebase logout process');
      toast({
        title: "Logging out...",
        description: "You are being signed out of your account.",
      });

      // Realtime Database status tracking removed
      console.log('Preparing to sign out from mobile');

      // Sign out from Firebase Auth
      await signOut(auth);
      console.log('Mobile Firebase signOut completed');
      
      // Clear any local state
      clearGuestData();
      localStorage.removeItem('guestUser');
      localStorage.removeItem('showOnboarding');
      localStorage.removeItem('uploaded-syllabi'); // Clear uploaded syllabi on logout
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Force redirect with multiple methods
      setTimeout(() => {
        console.log('Mobile executing redirect...');
        window.location.href = '/home';
        setTimeout(() => {
          if (window.location.pathname !== '/home') {
            console.log('Mobile backup redirect triggered');
            window.location.replace('/home');
          }
        }, 500);
      }, 1000);
      
    } catch (error) {
      console.error('Mobile logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error signing you out. Please try again.",
      });
      
      setTimeout(() => {
        window.location.href = '/home';
      }, 2000);
    }
  };

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 touch-manipulation hover:bg-transparent"
            aria-label="Open navigation menu"
          >
            <Menu01Icon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link href="/dashboard" onClick={closeSheet}>
                <h2 className="text-xl font-bold text-primary">CourseConnect</h2>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent"
                onClick={closeSheet}
              >
                <Cancel01Icon className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 border-b bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeSheet}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors touch-manipulation"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/dashboard/settings" onClick={closeSheet}>
                  <Settings01Icon className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-transparent"
                onClick={() => {
                  closeSheet();
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
