"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, signInAnonymously, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client-simple";
import { doc, setDoc, getDoc, writeBatch, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleLogo } from "@/components/icons/google-logo";
import { Loader2, User, ArrowRight } from "lucide-react";
import { useAnimatedToast } from "@/hooks/use-animated-toast";
import { ToastContainer } from "@/components/animated-toast";
import { CCLogo } from "@/components/icons/cc-logo";
import { useChatStore, Chat } from "@/hooks/use-chat-store";
import { GuestUsernamePopup } from "@/components/guest-username-popup";
import { motion, AnimatePresence } from "framer-motion";

interface LoginFormProps {
  initialState?: 'login' | 'signup';
}

export function LoginForm({ initialState = 'login' }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(initialState === 'signup');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showGuestUsernamePopup, setShowGuestUsernamePopup] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast, toasts, removeToast } = useAnimatedToast();
  const { chats: guestChats, clearGuestData } = useChatStore();


  useEffect(() => {
    setIsMounted(true);
    setIsSigningUp(initialState === 'signup');
  }, [initialState]);

  // Handle redirect result from Google sign-in (only when coming back from redirect)
  useEffect(() => {
    if (!auth) return;

    // Check if we're coming back from a redirect (check URL params or use getRedirectResult)
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User just signed in via redirect
          const user = result.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const isNewUser = !userDoc.exists();

          if (isNewUser) {
            await setDoc(doc(db, "users", user.uid), {
              displayName: user.displayName || "Google User",
              email: user.email,
              profilePicture: user.photoURL || null,
              graduationYear: "",
              school: "",
              major: "",
              provider: "google",
              createdAt: new Date().toISOString()
            });

            // Store flags to show onboarding for new users
            localStorage.setItem('showOnboarding', 'true');
            sessionStorage.setItem('justSignedUp', 'true');
          } else {
            // Existing user - update profile picture if needed
            const userData = userDoc.data();
            if (user.photoURL && (!userData.profilePicture || userData.profilePicture !== user.photoURL)) {
              await setDoc(doc(db, "users", user.uid), {
                profilePicture: user.photoURL
              }, { merge: true });
            }
          }

          // Migrate guest data
          migrateGuestData(user.uid).catch(error => {
            console.error('Guest data migration failed:', error);
          });

          // Set flag to prevent dashboard from redirecting to login
          sessionStorage.setItem('justLoggedIn', 'true');
          
          // Clear the redirect URL
          sessionStorage.removeItem('googleSignInRedirect');
          
          // Redirect to dashboard
          console.log('✅ Google sign-in successful, redirecting to dashboard...');
          router.push('/dashboard');
        }
      } catch (error) {
        // No redirect result or error - that's fine, user is just on login page
        console.log('No redirect result:', error);
      }
    };

    checkRedirectResult();
  }, [auth, router]);

  const migrateGuestData = async (userId: string) => {
    try {
      const chatIds = Object.keys(guestChats);
      if (chatIds.length === 0) {
        return;
      }

      // Firestore batch limit is 500 operations, so we need to split into multiple batches
      const MAX_BATCH_SIZE = 500;
      const chatsToMigrate: Array<{ chatId: string; chat: Chat }> = [];

      // Check which chats need to be migrated (don't exist in Firestore yet)
      const checkPromises = chatIds.map(async (chatId) => {
        const chat = guestChats[chatId];
        const chatDocRef = doc(db, "chats", chatId);
        const chatDocSnap = await getDoc(chatDocRef);

        if (!chatDocSnap.exists()) {
          chatsToMigrate.push({ chatId, chat });
        }
      });

      await Promise.all(checkPromises);

      if (chatsToMigrate.length === 0) {
        console.log('No new chats to migrate');
        return;
      }

      // Process in batches of MAX_BATCH_SIZE - 1 (reserve 1 for user doc update)
      const batches: Array<Array<{ chatId: string; chat: Chat }>> = [];
      for (let i = 0; i < chatsToMigrate.length; i += MAX_BATCH_SIZE - 1) {
        batches.push(chatsToMigrate.slice(i, i + MAX_BATCH_SIZE - 1));
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batchChats = batches[batchIndex];
        const batch = writeBatch(db);

        for (const { chatId, chat } of batchChats) {
          try {
            // Save ALL chat data including courseData, metadata, and other properties
            const chatData: any = {
              name: chat.name || chat.title,
              messages: chat.messages || [],
              userId: userId,
              createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: chat.updatedAt ? new Date(chat.updatedAt).toISOString() : new Date().toISOString()
            };

            // Include optional fields if they exist
            if (chat.chatType) chatData.chatType = chat.chatType;
            if (chat.classGroupId) chatData.classGroupId = chat.classGroupId;
            if (chat.members) chatData.members = chat.members;
            if (chat.courseData) {
              // Save complete courseData including assignments, exams, and all course info
              chatData.courseData = chat.courseData;
            }
            if (chat.metadata) {
              // Save metadata including quizzes, study plans, topics covered
              chatData.metadata = chat.metadata;
            }

            const chatDocRef = doc(db, "chats", chatId);
            batch.set(chatDocRef, chatData);
          } catch (error) {
            console.warn(`Failed to prepare chat ${chatId} for migration:`, error);
            errorCount++;
          }
        }

        // Update user doc with chat IDs (only in the last batch to avoid overwriting)
        if (batchIndex === batches.length - 1) {
          const userDocRef = doc(db, "users", userId);
          batch.set(userDocRef, { chats: chatIds }, { merge: true });
        }

        try {
          await batch.commit();
          successCount += batchChats.length;
          console.log(`✅ Migrated batch ${batchIndex + 1}/${batches.length} (${batchChats.length} chats)`);
        } catch (error: any) {
          // Check if it's a document size limit error
          if (error?.code === 'invalid-argument' || error?.message?.includes('size')) {
            console.warn('⚠️ One or more chats may be too large for Firestore. Attempting to migrate messages in chunks...');
            // Try to save with limited messages if document is too large
            for (const { chatId, chat } of batchChats) {
              try {
                const limitedChatData: any = {
                  name: chat.name || chat.title,
                  messages: (chat.messages || []).slice(-500), // Keep last 500 messages
                  userId: userId,
                  createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : new Date().toISOString(),
                  updatedAt: chat.updatedAt ? new Date(chat.updatedAt).toISOString() : new Date().toISOString()
                };

                if (chat.chatType) limitedChatData.chatType = chat.chatType;
                if (chat.classGroupId) limitedChatData.classGroupId = chat.classGroupId;
                if (chat.members) limitedChatData.members = chat.members;
                if (chat.courseData) limitedChatData.courseData = chat.courseData;
                if (chat.metadata) limitedChatData.metadata = chat.metadata;

                const limitedBatch = writeBatch(db);
                const chatDocRef = doc(db, "chats", chatId);
                limitedBatch.set(chatDocRef, limitedChatData);
                await limitedBatch.commit();
                successCount++;
                console.log(`✅ Migrated chat ${chatId} with limited messages (last 500)`);
              } catch (limitedError) {
                console.error(`❌ Failed to migrate chat ${chatId} even with limited messages:`, limitedError);
                errorCount++;
              }
            }
          } else {
            console.error(`❌ Batch ${batchIndex + 1} migration failed:`, error);
            errorCount += batchChats.length;
          }
        }
      }

      // Only clear guest data if migration was mostly successful
      if (successCount > 0) {
        clearGuestData();
        console.log(`✅ Guest data migration completed: ${successCount} chats migrated${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      } else {
        console.warn('⚠️ No chats were migrated successfully. Guest data preserved.');
      }
    } catch (error) {
      console.error('❌ Error migrating guest data:', error);
      // Don't throw error - let user continue to dashboard
      // Guest data will remain in localStorage for retry
    }
  }


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let user;
      if (isSigningUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // Set a default display name from email if not provided
        const defaultDisplayName = email.split('@')[0];
        await updateProfile(user, { displayName: defaultDisplayName });
        await setDoc(doc(db, "users", user.uid), {
          displayName: defaultDisplayName,
          email,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        }, { merge: true });

        toast({ title: "Account Created!", description: "You have been successfully signed up." });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        toast({ title: "Signed In!", description: "Welcome back." });
      }

      // Migrate guest data (non-blocking)
      migrateGuestData(user.uid).catch(error => {
        console.error('Guest data migration failed:', error);
      });

      // Clear guest data after successful account creation/sign-in
      if (isSigningUp) {
        // Clear guest user data from localStorage
        localStorage.removeItem('guestUser');
        localStorage.removeItem('guest-notifications');
        localStorage.removeItem('guest-onboarding-completed');

        // Store flag to show onboarding
        localStorage.setItem('showOnboarding', 'true');
        sessionStorage.setItem('justSignedUp', 'true');

        // Add a small delay to ensure localStorage is cleared before navigation
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        // For regular sign-in, clear guest data and navigate
        localStorage.removeItem('guestUser');
        localStorage.removeItem('guest-notifications');
        localStorage.removeItem('guest-onboarding-completed');

        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      }

    } catch (error: any) {
      console.error('Account creation error:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Account Creation Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleGoogleSignIn = async () => {
      setIsSubmittingGoogle(true);
      
      // Ensure Firebase is initialized with the correct authDomain
      if (typeof window !== 'undefined') {
        const { initializeFirebase } = await import('@/lib/firebase/client-simple');
        initializeFirebase();
      }
      
      const provider = new GoogleAuthProvider();

      // Add additional scopes and parameters for better compatibility
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      try {
        // Use popup instead of redirect for better UX - user stays on page
        console.log('🔐 Attempting Google sign-in with popup...');
        console.log('🔐 Auth domain:', auth?.config?.authDomain || 'not set');
        console.log('🔐 Current origin:', window.location.origin);
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('✅ Google sign-in successful:', user.email);
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isNewUser = !userDoc.exists();

        if (isNewUser) {
          await setDoc(doc(db, "users", user.uid), {
            displayName: user.displayName || "Google User",
            email: user.email,
            profilePicture: user.photoURL || null,
            graduationYear: "",
            school: "",
            major: "",
            provider: "google",
            createdAt: new Date().toISOString()
          });

          // Store flags to show onboarding for new users
          localStorage.setItem('showOnboarding', 'true');
          sessionStorage.setItem('justSignedUp', 'true');
        } else {
          // Existing user - update profile picture if needed
          const userData = userDoc.data();
          if (user.photoURL && (!userData.profilePicture || userData.profilePicture !== user.photoURL)) {
            await setDoc(doc(db, "users", user.uid), {
              profilePicture: user.photoURL
            }, { merge: true });
          }
        }

        // Migrate guest data
        migrateGuestData(user.uid).catch(error => {
          console.error('Guest data migration failed:', error);
        });

        // Clear guest data
        localStorage.removeItem('guestUser');
        localStorage.removeItem('guest-notifications');
        localStorage.removeItem('guest-onboarding-completed');

        setIsSubmittingGoogle(false);
        
        // Redirect to dashboard
        toast({
          title: "Signed In!",
          description: "Welcome back.",
        });
        
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Google Sign-in Error:', error);
        setIsSubmittingGoogle(false);

        // If user closed popup, don't show error - just silently cancel
        if (error?.code === 'auth/popup-closed-by-user') {
          console.log('User closed Google sign-in popup');
          return; // Don't show error toast
        }

        let description = "Could not sign in with Google. Please try again or use another method.";

        if (error?.code === 'auth/operation-not-allowed') {
          description = "Google sign-in is not enabled. Please enable it in your Firebase console's Authentication settings.";
        } else if (error?.code === 'auth/unauthorized-domain') {
          description = `This domain (${window.location.hostname}) is not authorized. Please add it to authorized domains in Firebase Console → Authentication → Settings.`;
        } else if (error?.code === 'auth/invalid-action' || error?.message?.includes('invalid_request')) {
          description = `Invalid action/request. Please check your OAuth configuration:
          1. Add '${window.location.hostname}' to Firebase Console → Authentication → Settings → Authorized domains
          2. Add '${window.location.origin}' to Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized JavaScript origins`;
        } else if (error?.message?.includes('redirect_uri_mismatch')) {
          description = `Redirect URI mismatch. Please add '${window.location.origin}' to Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs`;
        } else if (error?.code === 'auth/network-request-failed') {
          description = "Network error. Please check your internet connection and try again.";
        } else if (error?.code === 'auth/too-many-requests') {
          description = "Too many failed attempts. Please try again later.";
        } else if (error?.code === 'auth/configuration-not-found') {
          description = "Firebase configuration not found. Please check your Firebase project settings.";
        } else if (error?.code === 'auth/invalid-api-key') {
          description = "Invalid Firebase API key. Please check your Firebase configuration.";
        } else if (error?.code === 'auth/app-not-authorized') {
          description = "Firebase app not authorized. Please check your Firebase project configuration.";
        }

        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: `${description}\n\nError Code: ${error?.code || 'Unknown'}\nError Message: ${error?.message || 'No details available'}`,
        });
      }
    };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: errorMessage,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };


  const handleGuestLogin = async () => {
    // Show username popup instead of directly logging in
    setShowGuestUsernamePopup(true);
  }

  const handleGuestUsernameSet = async (username: string) => {
    setIsSubmittingGuest(true);

    try {
      console.log("Starting guest login process with username:", username);

      // Create a simple guest user object with the chosen username
      const guestUser = {
        uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        displayName: username,
        email: null,
        photoURL: null,
        isAnonymous: true,
        isGuest: true
      };

      console.log("Created guest user:", guestUser);

      // Store guest info in localStorage FIRST (before Firebase operations)
      try {
        localStorage.setItem('guestUser', JSON.stringify(guestUser));
        console.log("Stored guest user in localStorage");
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('guestNameUpdated'));
      } catch (storageError) {
        console.error("Failed to store guest user in localStorage:", storageError);
        throw new Error("Failed to save guest session. Please check your browser settings.");
      }

      // Show success message
      toast({
        title: `Welcome, ${username}!`,
        description: "You're now exploring CourseConnect. Create an account anytime to save your progress.",
        variant: 'success'
      });

      console.log("Redirecting to dashboard...");

      // Redirect IMMEDIATELY - don't wait for Firebase operations
      router.push('/dashboard');

      // Do Firebase operations in the background (non-blocking)
      // Sign in anonymously so Firestore rules recognize the session
      (async () => {
        try {
          // Check if auth is available
          if (!auth) {
            console.warn("Auth not available, skipping anonymous sign-in");
            return;
          }

          const anonCred = await signInAnonymously(auth);
          const anonUid = anonCred?.user?.uid;
          console.log("Anonymous sign-in successful (background):", anonUid);

          // Create/update minimal user profile for anonymous user (non-blocking)
          if (anonUid && db) {
            try {
              await setDoc(doc(db, "users", anonUid), {
                displayName: username,
                isAnonymous: true,
                createdAt: new Date().toISOString()
              }, { merge: true });
              console.log("Guest user profile created in Firestore (background)");
            } catch (e) {
              console.warn("Failed to write anonymous user profile (non-critical):", e);
            }
          }
        } catch (authError: any) {
          console.warn("Anonymous sign-in failed (background), continuing with guest mode:", authError);
          // This is fine - guest mode works with localStorage only
        }
      })();

    } catch (error: any) {
      console.error("Guest login error:", error);
      setIsSubmittingGuest(false);
      toast({
        variant: "destructive",
        title: "Guest Login Failed",
        description: error.message || "Could not sign in as guest. Please try again or refresh the page.",
      });
    }
  }


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md relative"
      suppressHydrationWarning
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-visible" suppressHydrationWarning>
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[60px]"
        />
      </div>

      <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 dark:border-gray-700/40 shadow-2xl overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />

        <div className="relative p-8 md:p-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative rounded-2xl bg-white/50 dark:bg-gray-800/50 p-4 border border-white/50 dark:border-gray-700/50 backdrop-blur-md shadow-lg group-hover:scale-105 transition-transform duration-500">
                  <CCLogo className="h-12 w-auto" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {isSigningUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {isSigningUp ? "Start your academic journey today" : "Enter your details to continue"}
              </p>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Guest Login Button - Prominent for new users */}
            {isSigningUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <Button
                  variant="outline"
                  className="w-full h-14 text-base font-medium border-2 border-dashed border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group relative overflow-hidden"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isSubmittingGuest ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <User className="mr-2 h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="relative z-10">Try as Guest <span className="text-gray-400 mx-1">•</span> No Account Needed</span>
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or continue with email</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                      className="h-12 pl-4 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    {!isSigningUp && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline transition-colors"
                        disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                    className="h-12 pl-4 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-300"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                ) : (
                  <span className="flex items-center">
                    {isSigningUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-300"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
            >
              {isSubmittingGoogle ? (
                <Loader2 className="animate-spin mr-3 h-5 w-5" />
              ) : (
                <GoogleLogo className="mr-3 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isSigningUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setIsSigningUp(false)}
                      className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline transition-colors"
                      disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setIsSigningUp(true)}
                      className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline transition-colors"
                      disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                    >
                      Create one
                    </button>
                  </>
                )}
              </p>

              {/* Guest login option for login mode */}
              {!isSigningUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6"
                >
                  <button
                    onClick={handleGuestLogin}
                    disabled={isSubmitting || isSubmittingGoogle || isSubmittingGuest}
                    className="text-xs font-medium text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2 mx-auto group"
                  >
                    {isSubmittingGuest ? (
                      <Loader2 className="animate-spin h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3 group-hover:scale-110 transition-transform" />
                    )}
                    Continue as Guest
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-white/10"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isResettingPassword}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                    disabled={isResettingPassword}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword || !resetEmail}
                    className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isResettingPassword ? (
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    ) : null}
                    Send Link
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Username Popup */}
      <GuestUsernamePopup
        isOpen={showGuestUsernamePopup}
        onClose={() => setShowGuestUsernamePopup(false)}
        onUsernameSet={handleGuestUsernameSet}
      />

      {/* Animated Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </motion.div>
  );
}
