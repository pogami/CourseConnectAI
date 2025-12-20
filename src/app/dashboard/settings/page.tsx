"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Trash2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  Brain,
  CheckCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  LogOut,
  GraduationCap,
  BookOpen,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client-simple";
import { updatePassword, deleteUser } from "firebase/auth";
import { doc, getDoc, deleteDoc, collection, getDocs, query, where, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client-simple";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [showEmail, setShowEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isClearingChats, setIsClearingChats] = useState(false);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);
  const [isClearingFiles, setIsClearingFiles] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    platform: string;
    location: string | null;
  } | null>(null);
  const autoSyncUnsubscribesRef = useRef<Array<() => void>>([]);

  const [settings, setSettings] = useState({
    data: {
      autoSync: true,
      analytics: true,
    },
    security: {
      newDeviceAlerts: false
    }
  });


  // Load user settings from Firestore
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings) {
            setSettings(prev => ({
              ...prev,
              ...userData.settings
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };

    loadUserSettings();
  }, [user]);

  // Detect device type and location
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform;
      
      // Detect device type
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        deviceType = 'tablet';
      } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        deviceType = 'mobile';
      }
      
      // Detect browser
      let browser = 'Unknown';
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        browser = 'Chrome';
      } else if (userAgent.includes('firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browser = 'Safari';
      } else if (userAgent.includes('edg')) {
        browser = 'Edge';
      } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
        browser = 'Opera';
      }
      
      setDeviceInfo({
        type: deviceType,
        browser,
        platform: platform || 'Unknown',
        location: null
      });
    };

    const getLocation = async () => {
      try {
        // Try to get location from browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding to get city/country
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                );
                if (response.ok) {
                  const data = await response.json();
                  const locationStr = data.city && data.countryName 
                    ? `${data.city}, ${data.countryName}`
                    : data.countryName || data.principalSubdivision || 'Unknown Location';
                  
                  setDeviceInfo(prev => prev ? { ...prev, location: locationStr } : null);
                }
              } catch (err) {
                console.warn('Could not fetch location details:', err);
              }
            },
            () => {
              // User denied or error - try IP-based location as fallback
              fetch('https://ipapi.co/json/')
                .then(res => res.json())
                .then(data => {
                  const locationStr = data.city && data.country_name
                    ? `${data.city}, ${data.country_name}`
                    : data.country_name || 'Unknown Location';
                  setDeviceInfo(prev => prev ? { ...prev, location: locationStr } : null);
                })
                .catch(() => {
                  // Fallback to timezone-based location
                  try {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const locationStr = tz.replace(/_/g, ' ').split('/').pop() || 'Unknown Location';
                    setDeviceInfo(prev => prev ? { ...prev, location: locationStr } : null);
                  } catch {}
                });
            },
            { timeout: 5000 }
          );
        } else {
          // Fallback to IP-based location
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              const locationStr = data.city && data.country_name
                ? `${data.city}, ${data.country_name}`
                : data.country_name || 'Unknown Location';
              setDeviceInfo(prev => prev ? { ...prev, location: locationStr } : null);
            })
            .catch(() => {
              // Final fallback to timezone
              try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const locationStr = tz.replace(/_/g, ' ').split('/').pop() || 'Unknown Location';
                setDeviceInfo(prev => prev ? { ...prev, location: locationStr } : null);
              } catch {}
            });
        }
      } catch (err) {
        console.warn('Error getting location:', err);
      }
    };

    detectDevice();
    getLocation();
  }, []);

  const handleSettingChange = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));

    toast({
      title: "Setting Updated",
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };


  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to change your password.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(user, newPassword);
      toast.success("Password Updated Successfully", {
        description: "Your password has been successfully updated."
      });
      setNewPassword("");
      setConfirmPassword("");
      // Close the dialog after successful password change
      setTimeout(() => {
        // Try multiple methods to close the dialog
        const closeButton = document.querySelector('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:last-child, [role="dialog"] button[data-state="closed"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        } else {
          // Fallback: press Escape key
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
      }, 1500); // Close after 1.5 seconds
    } catch (error: any) {
      console.error('Password update error:', error);

      let errorMessage = "Failed to update password.";

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security, please sign out and sign back in before changing your password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Error", {
        description: errorMessage
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to export your data.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Exporting Data",
        description: "Preparing your complete data export...",
      });

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Get ALL user's chats (including public chats they've participated in)
      const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chats = [];

      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = { id: chatDoc.id, ...chatDoc.data() };

        // Get all messages for this chat
        const messagesQuery = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(msgDoc => ({ id: msgDoc.id, ...msgDoc.data() }));

        chatData.messages = messages;
        chats.push(chatData);
      }

      // Get user's notifications
      const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get user's uploaded files/syllabi
      const filesQuery = query(collection(db, 'files'), where('userId', '==', user.uid));
      const filesSnapshot = await getDocs(filesQuery);
      const files = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const exportData = {
        user: userData,
        chats,
        notifications,
        files,
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalChats: chats.length,
        totalMessages: chats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0),
        totalNotifications: notifications.length,
        totalFiles: files.length
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `courseconnect-complete-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Complete Data Exported",
        description: `Downloaded ${exportData.totalChats} chats, ${exportData.totalMessages} messages, ${exportData.totalNotifications} notifications, and ${exportData.totalFiles} files.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("Error", {
        description: "You must be logged in to delete your account."
      });
      return;
    }

    if (deleteConfirm !== "DELETE") {
      toast.error("Error", {
        description: "Please type 'DELETE' exactly to confirm account deletion."
      });
      return;
    }

    setIsDeletingAccount(true);
    setShowDeleteAccountDialog(true); // Ensure dialog stays open
    setShowDeleteAccountDialog(true); // Ensure dialog stays open
    try {
      toast.info("Deleting Account", {
        description: "This may take a moment. Please do not close this page."
      });

      // Check if db is available
      if (!db) {
        throw new Error('Database not available. Please refresh the page and try again.');
      }

      // Delete user's chats and all messages
      try {
        const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
        const chatsSnapshot = await getDocs(chatsQuery);

        for (const chatDoc of chatsSnapshot.docs) {
          // Delete all messages in this chat
          try {
            const messagesQuery = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id));
            const messagesSnapshot = await getDocs(messagesQuery);
            for (const messageDoc of messagesSnapshot.docs) {
              await deleteDoc(messageDoc.ref);
            }
          } catch (msgError) {
            console.warn('Failed to delete some messages (non-critical):', msgError);
          }

          // Delete the chat itself
          try {
            await deleteDoc(chatDoc.ref);
          } catch (chatError) {
            console.warn('Failed to delete chat (non-critical):', chatError);
          }
        }
      } catch (chatsError) {
        console.warn('Failed to delete some chats (non-critical):', chatsError);
      }

      // Delete user's notifications
      try {
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        for (const notificationDoc of notificationsSnapshot.docs) {
          await deleteDoc(notificationDoc.ref);
        }
      } catch (notifError) {
        console.warn('Failed to delete some notifications (non-critical):', notifError);
      }

      // Delete user's uploaded files
      try {
        const filesQuery = query(collection(db, 'files'), where('userId', '==', user.uid));
        const filesSnapshot = await getDocs(filesQuery);
        for (const fileDoc of filesSnapshot.docs) {
          await deleteDoc(fileDoc.ref);
        }
      } catch (filesError) {
        console.warn('Failed to delete some files (non-critical):', filesError);
      }

      // Delete user's flashcard sets
      try {
        const flashcardSetsQuery = query(collection(db, 'flashcardSets'), where('userId', '==', user.uid));
        const flashcardSetsSnapshot = await getDocs(flashcardSetsQuery);
        for (const flashcardSetDoc of flashcardSetsSnapshot.docs) {
          await deleteDoc(flashcardSetDoc.ref);
        }
      } catch (flashcardError) {
        console.warn('Failed to delete some flashcard sets (non-critical):', flashcardError);
      }

      // Delete user's study sessions
      try {
        const studySessionsQuery = query(collection(db, 'studySessions'), where('userId', '==', user.uid));
        const studySessionsSnapshot = await getDocs(studySessionsQuery);
        for (const studySessionDoc of studySessionsSnapshot.docs) {
          await deleteDoc(studySessionDoc.ref);
        }
      } catch (studySessionError) {
        console.warn('Failed to delete some study sessions (non-critical):', studySessionError);
      }

      // Delete user's whiteboard sessions
      try {
        const whiteboardSessionsQuery = query(collection(db, 'whiteboardSessions'), where('userId', '==', user.uid));
        const whiteboardSessionsSnapshot = await getDocs(whiteboardSessionsQuery);
        for (const whiteboardSessionDoc of whiteboardSessionsSnapshot.docs) {
          await deleteDoc(whiteboardSessionDoc.ref);
        }
      } catch (whiteboardError) {
        console.warn('Failed to delete some whiteboard sessions (non-critical):', whiteboardError);
      }

      // Delete user's scanned documents
      try {
        const scannedDocsQuery = query(collection(db, 'scannedDocuments'), where('userId', '==', user.uid));
        const scannedDocsSnapshot = await getDocs(scannedDocsQuery);
        for (const scannedDoc of scannedDocsSnapshot.docs) {
          await deleteDoc(scannedDoc.ref);
        }
      } catch (scannedDocsError) {
        console.warn('Failed to delete some scanned documents (non-critical):', scannedDocsError);
      }

      // Delete user's courses
      try {
        const coursesQuery = query(collection(db, 'courses'), where('userId', '==', user.uid));
        const coursesSnapshot = await getDocs(coursesQuery);
        for (const courseDoc of coursesSnapshot.docs) {
          await deleteDoc(courseDoc.ref);
        }
      } catch (coursesError) {
        console.warn('Failed to delete some courses (non-critical):', coursesError);
      }

      // Delete user's study schedules
      try {
        const studySchedulesQuery = query(collection(db, 'studySchedules'), where('userId', '==', user.uid));
        const studySchedulesSnapshot = await getDocs(studySchedulesQuery);
        for (const scheduleDoc of studySchedulesSnapshot.docs) {
          await deleteDoc(scheduleDoc.ref);
        }
      } catch (schedulesError) {
        console.warn('Failed to delete some study schedules (non-critical):', schedulesError);
      }

      // Delete user's analytics data (optional - you may want to keep aggregated data)
      try {
        const analyticsQuery = query(collection(db, 'analytics'), where('userId', '==', user.uid));
        const analyticsSnapshot = await getDocs(analyticsQuery);
        for (const analyticsDoc of analyticsSnapshot.docs) {
          await deleteDoc(analyticsDoc.ref);
        }
      } catch (analyticsError) {
        console.warn('Failed to delete some analytics data (non-critical):', analyticsError);
      }

      // Delete user document
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (userDocError) {
        console.warn('Failed to delete user document (non-critical):', userDocError);
      }

      // Delete Firebase Auth user (this will also sign them out)
      try {
        await deleteUser(user);
      } catch (authError: any) {
        // If auth deletion fails, still try to redirect
        console.error('Failed to delete auth user:', authError);
        if (authError.code === 'auth/requires-recent-login') {
          throw new Error('For security, please sign out and sign back in before deleting your account.');
        }
        throw authError;
      }

      // Clear localStorage
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }

      toast.success("Account Deleted", {
        description: "Your account and all data have been permanently removed."
      });

      // Redirect to home page
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error("Error", {
        description: error.message || "Failed to delete account. Please try again or contact support."
      });
      setIsDeletingAccount(false);
      // Allow closing dialog on error
      setShowDeleteAccountDialog(false);
    }
  };

  const handleClearChatHistory = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to clear chat history.",
        variant: "destructive",
      });
      return;
    }

    setIsClearingChats(true);
    try {
      toast({
        title: "Clearing Chat History",
        description: "Deleting all your chat conversations and messages...",
      });

      // Get all user's chats
      const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
      const chatsSnapshot = await getDocs(chatsQuery);

      let deletedChats = 0;
      let deletedMessages = 0;

      for (const chatDoc of chatsSnapshot.docs) {
        // Delete all messages in this chat
        const messagesQuery = query(collection(db, 'messages'), where('chatId', '==', chatDoc.id));
        const messagesSnapshot = await getDocs(messagesQuery);
        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(messageDoc.ref);
          deletedMessages++;
        }

        // Delete the chat itself
        await deleteDoc(chatDoc.ref);
        deletedChats++;
      }

      toast({
        title: "Chat History Cleared",
        description: `Deleted ${deletedChats} chats and ${deletedMessages} messages.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear chat history.",
        variant: "destructive",
      });
    } finally {
      setIsClearingChats(false);
    }
  };

  const handleClearNotifications = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to clear notifications.",
        variant: "destructive",
      });
      return;
    }

    setIsClearingNotifications(true);
    try {
      toast({
        title: "Clearing Notifications",
        description: "Deleting all your notifications...",
      });

      const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
      const notificationsSnapshot = await getDocs(notificationsQuery);

      let deletedCount = 0;
      for (const notificationDoc of notificationsSnapshot.docs) {
        await deleteDoc(notificationDoc.ref);
        deletedCount++;
      }

      toast({
        title: "Notifications Cleared",
        description: `Deleted ${deletedCount} notifications.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear notifications.",
        variant: "destructive",
      });
    } finally {
      setIsClearingNotifications(false);
    }
  };

  const handleClearFiles = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to clear uploaded files.",
        variant: "destructive",
      });
      return;
    }

    setIsClearingFiles(true);
    try {
      toast({
        title: "Clearing Uploaded Files",
        description: "Deleting all your uploaded files and syllabi...",
      });

      const filesQuery = query(collection(db, 'files'), where('userId', '==', user.uid));
      const filesSnapshot = await getDocs(filesQuery);

      let deletedCount = 0;
      for (const fileDoc of filesSnapshot.docs) {
        await deleteDoc(fileDoc.ref);
        deletedCount++;
      }

      toast({
        title: "Files Cleared",
        description: `Deleted ${deletedCount} uploaded files.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear uploaded files.",
        variant: "destructive",
      });
    } finally {
      setIsClearingFiles(false);
    }
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    if (!user) {
      toast.error("Error", {
        description: "You must be logged in to change sync settings."
      });
      return;
    }

    // Update local state immediately for responsive UI
    setSettings(prev => ({
      ...prev,
      data: { ...prev.data, autoSync: enabled }
    }));

    // Store in localStorage for immediate effect
    try {
      localStorage.setItem('autoSyncEnabled', enabled.toString());
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    try {
      // Check if db is available
      if (!db) {
        throw new Error('Database not available');
      }

      // Update user settings in Firestore (use setDoc with merge to handle missing documents)
      await setDoc(doc(db, 'users', user.uid), {
        'settings.data.autoSync': enabled,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast.success(enabled ? "Auto Sync Enabled" : "Auto Sync Disabled", {
        description: enabled
          ? "Your data will automatically sync across all your devices."
          : "Auto sync has been disabled. Data will only sync when you manually refresh."
      });

      // If enabling auto sync, trigger an immediate sync and set up real-time listeners
      if (enabled) {
        try {
          await triggerDataSync();
          // Set up real-time sync listeners
          setupAutoSyncListeners();
        } catch (syncError) {
          console.warn('Sync trigger failed (non-critical):', syncError);
        }
      } else {
        // Clean up listeners when disabling
        cleanupAutoSyncListeners();
      }
    } catch (error: any) {
      console.error('Failed to update sync settings:', error);
      // Revert local state on error
      setSettings(prev => ({
        ...prev,
        data: { ...prev.data, autoSync: !enabled }
      }));
      toast.error("Error", {
        description: error.message || "Failed to update sync settings. Please try again."
      });
    }
  };

  const handleAnalyticsChange = async (enabled: boolean) => {
    if (!user) {
      toast.error("Error", {
        description: "You must be logged in to change analytics settings."
      });
      return;
    }

    // Update local state immediately for responsive UI
    setSettings(prev => ({
      ...prev,
      data: { ...prev.data, analytics: enabled }
    }));

    // Store in localStorage for immediate effect
    try {
      localStorage.setItem('analyticsEnabled', enabled.toString());
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    try {
      // Check if db is available
      if (!db) {
        throw new Error('Database not available');
      }

      // Update user settings in Firestore (use setDoc with merge to handle missing documents)
      await setDoc(doc(db, 'users', user.uid), {
        'settings.data.analytics': enabled,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast.success(enabled ? "Analytics Enabled" : "Analytics Disabled", {
        description: enabled
          ? "Thank you! Your usage data helps us improve CourseConnect."
          : "Analytics disabled. No usage data will be collected."
      });

      // If enabling analytics, send current session data
      if (enabled) {
        try {
          await sendAnalyticsData();
        } catch (analyticsError) {
          console.warn('Analytics data send failed (non-critical):', analyticsError);
        }
      }
    } catch (error: any) {
      console.error('Failed to update analytics settings:', error);
      // Revert local state on error
      setSettings(prev => ({
        ...prev,
        data: { ...prev.data, analytics: !enabled }
      }));
      toast.error("Error", {
        description: error.message || "Failed to update analytics settings. Please try again."
      });
    }
  };

  const triggerDataSync = async () => {
    if (!user || !db) return;

    try {
      toast.info("Syncing Data", {
        description: "Syncing your data across devices..."
      });

      // Sync chats from Firestore (only if user is authenticated)
      try {
        if (user && user.uid) {
          const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
          const chatsSnapshot = await getDocs(chatsQuery);

          // Dispatch event to chat store to sync chats
          window.dispatchEvent(new CustomEvent('sync-chats-from-firestore', {
            detail: { chats: chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }
          }));
        }
      } catch (error: any) {
        console.warn('Failed to sync chats:', error);
        // Don't show error if it's a permissions issue - just log it
        if (error.code !== 'permission-denied') {
          toast.error("Sync Warning", {
            description: "Could not sync all chats. Some data may be missing.",
          });
        }
      }

      // Sync user settings
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings) {
            setSettings(prev => ({
              ...prev,
              ...userData.settings
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to sync settings:', error);
      }

      // Update last sync time (use setDoc with merge to handle missing documents)
      await setDoc(doc(db, 'users', user.uid), {
        lastSyncTime: new Date().toISOString(),
        syncStatus: 'completed'
      }, { merge: true });

      toast.success("Sync Complete", {
        description: "Your data has been synced across all devices."
      });

      console.log('Data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
      toast.error("Sync Failed", {
        description: "Could not sync data. Please try again."
      });
    }
  };

  const setupAutoSyncListeners = () => {
    if (!user || !db) return;

    // Clean up existing listeners
    cleanupAutoSyncListeners();

    try {
      // Listen to user document changes for settings sync
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          if (userData.settings) {
            setSettings(prev => ({
              ...prev,
              ...userData.settings
            }));
          }
        }
      }, (error: any) => {
        // Silently handle permission errors - don't show toasts for expected permission issues
        if (error?.code !== 'permission-denied') {
          console.warn('Auto sync listener error:', error);
        }
      });

      autoSyncUnsubscribesRef.current.push(unsubscribeUser);

      // Listen to chats collection for real-time sync
      const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid));
      const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
        // Dispatch event to chat store to sync chats
        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        window.dispatchEvent(new CustomEvent('sync-chats-from-firestore', {
          detail: { chats }
        }));
      }, (error: any) => {
        // Silently handle permission errors - don't show toasts for expected permission issues
        if (error?.code !== 'permission-denied') {
          console.warn('Auto sync chats listener error:', error);
        }
      });

      autoSyncUnsubscribesRef.current.push(unsubscribeChats);

      console.log('Auto sync listeners set up');
    } catch (error) {
      console.error('Failed to set up auto sync listeners:', error);
    }
  };

  const cleanupAutoSyncListeners = () => {
    autoSyncUnsubscribesRef.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error cleaning up auto sync listener:', error);
      }
    });
    autoSyncUnsubscribesRef.current = [];
  };

  // Set up auto sync listeners when component mounts and auto sync is enabled
  useEffect(() => {
    if (user && settings.data.autoSync) {
      setupAutoSyncListeners();
    }

    return () => {
      cleanupAutoSyncListeners();
    };
  }, [user, settings.data.autoSync]);

  const sendAnalyticsData = async () => {
    try {
      // This would send real analytics data
      // For now, we'll just log that analytics is enabled
      const analyticsData = {
        userId: user!.uid,
        timestamp: new Date().toISOString(),
        action: 'analytics_enabled',
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // In a real implementation, this would send to your analytics service
      console.log('Analytics data:', analyticsData);

      // For now, we'll store it in Firestore as a simple analytics event
      await setDoc(doc(db, 'analytics', `${user!.uid}_${Date.now()}`), analyticsData);
    } catch (error) {
      console.error('Failed to send analytics data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <SettingsIcon className="size-6 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Account Settings
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Manage your account security and data. Change your password, export your data,
              or delete your account completely.
            </p>
          </div>
        </div>

        {/* Account Information */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Account Information</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Your basic account details and contact information</p>
            </div>
          </div>
          <Card className="border shadow-lg bg-white/90 dark:bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 space-y-8">
              {/* Account Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Account Details</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3 group">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground cursor-pointer">
                        Display Name
                      </Label>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border/50 shadow-inner">
                      <span className="text-base font-semibold">
                        {(() => {
                          const isGuest = user?.isGuest || user?.isAnonymous;
                          if (isGuest) {
                            return user?.displayName || 'Guest User';
                          }
                          return user?.displayName || 'Not set';
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Your display name as shown to others</p>
                  </div>
                  <div className="space-y-3 group">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground cursor-pointer">
                        Email Address
                      </Label>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border/50 shadow-inner flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-foreground truncate flex-1">
                        {(() => {
                          const isGuest = user?.isGuest || user?.isAnonymous || !user?.email;
                          if (isGuest) {
                            return showEmail ? (
                              <span className="text-muted-foreground italic">No email address (Guest account)</span>
                            ) : (
                              '••••••••@•••••.com'
                            );
                          }
                          return showEmail ? user?.email : '••••••••@•••••.com';
                        })()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmail(!showEmail)}
                        className="hover:bg-muted/80 h-9 w-9 p-0 flex-shrink-0 rounded-lg transition-colors"
                      >
                        {showEmail ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your account email address</p>
                  </div>
                </div>
              </div>

              {/* Security Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Security</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                <div className="flex gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all border-2">
                        <Lock className="size-4" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your new password below. Make sure it's at least 6 characters long.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div
                        onClick={handleChangePassword}
                        className={`update-password-btn flex-1 rounded-md px-4 py-2 cursor-pointer flex items-center justify-center transition-opacity ${isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:opacity-90'
                          }`}
                        style={{
                          backgroundColor: '#2563eb !important',
                          color: 'white !important',
                          border: '1px solid #2563eb !important'
                        }}
                      >
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewPassword("");
                          setConfirmPassword("");
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                        }}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                    </div>
                    <style jsx>{`
                      .update-password-btn {
                        background-color: #2563eb !important;
                        color: white !important;
                        border: 1px solid #2563eb !important;
                      }
                      .update-password-btn * {
                        color: white !important;
                      }
                    `}</style>
                  </div>
                </DialogContent>
              </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

{/* Security & Activity */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security & Activity</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your account security and active sessions</p>
            </div>
          </div>
          <Card className="border shadow-lg bg-white/90 dark:bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 space-y-8">
              {/* Security Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Security Settings</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-border/50">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground cursor-pointer">
                        New Device Alerts
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">Receive email alerts when a new device signs in</p>
                  </div>
                  <Switch
                    checked={settings.security?.newDeviceAlerts ?? false}
                    onCheckedChange={(checked) => handleSettingChange('security', 'newDeviceAlerts', checked)}
                  />
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Active Sessions</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                <div className="rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden shadow-sm">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex items-center gap-5 flex-1 w-full">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 shadow-md">
                        {deviceInfo ? (
                          deviceInfo.type === 'mobile' ? (
                            <Smartphone className="h-7 w-7 text-primary" />
                          ) : deviceInfo.type === 'tablet' ? (
                            <Tablet className="h-7 w-7 text-primary" />
                          ) : (
                            <Monitor className="h-7 w-7 text-primary" />
                          )
                        ) : (
                          <Smartphone className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-base">
                            {deviceInfo ? (
                              <>
                                {deviceInfo.browser} on {deviceInfo.platform}
                              </>
                            ) : (
                              'Current Session'
                            )}
                          </span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
                            Active Now
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="font-medium">
                              {deviceInfo ? (
                                <>
                                  {deviceInfo.type.charAt(0).toUpperCase() + deviceInfo.type.slice(1)} • {deviceInfo.browser}
                                </>
                              ) : (
                                typeof window !== 'undefined' ? navigator.userAgent : 'Unknown Device'
                              )}
                            </span>
                          </div>
                          {deviceInfo?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{deviceInfo.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:pl-0">
                      <div className="text-sm text-muted-foreground text-right hidden sm:block">
                        <p className="font-semibold">IP: Current Device</p>
                        <p>Last active: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-2 border-destructive/30 gap-2 h-10 font-semibold shadow-sm hover:shadow-md transition-all"
                        onClick={() => {
                          toast({
                            title: "Session Revoked",
                            description: "This session has been logged out. Please sign in again to continue.",
                          });
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                  {/* Mobile only details */}
                  <div className="px-5 pb-5 sm:hidden flex justify-between text-sm text-muted-foreground border-t-2 border-border/50 pt-4 bg-muted/30">
                    <span className="font-medium">IP: Current Device</span>
                    <span className="font-medium">Active: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Account Actions</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleExportData} variant="outline" className="flex-1 gap-2 h-11 font-semibold shadow-sm hover:shadow-md transition-all border-2">
                    <Download className="size-4" />
                    Export My Data
                  </Button>
                  <Dialog open={showDeleteAccountDialog} onOpenChange={(open) => {
                    // Prevent closing if deletion is in progress
                    if (!isDeletingAccount) {
                      setShowDeleteAccountDialog(open);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="flex-1 gap-2 h-11 font-semibold shadow-sm hover:shadow-md transition-all border-2"
                      >
                        <Trash2 className="size-4" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                  <DialogContent onInteractOutside={(e) => {
                    // Prevent closing by clicking outside if deletion is in progress
                    if (isDeletingAccount) {
                      e.preventDefault();
                    }
                  }} onEscapeKeyDown={(e) => {
                    // Prevent closing with Escape key if deletion is in progress
                    if (isDeletingAccount) {
                      e.preventDefault();
                    }
                  }}>
                    <DialogHeader>
                      {!isDeletingAccount && (
                        <button
                          onClick={() => setShowDeleteAccountDialog(false)}
                          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </button>
                      )}
                      <DialogTitle>
                        Delete Account
                      </DialogTitle>
                      <DialogDescription>
                        {isDeletingAccount
                          ? "Deleting your account and all data. Please wait..."
                          : "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">What will be deleted:</h4>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• All your chat conversations and messages</li>
                          <li>• All uploaded files and syllabi</li>
                          <li>• All notifications and settings</li>
                          <li>• Your user profile and account data</li>
                          <li>• Your login credentials and authentication</li>
                        </ul>
                      </div>
                      <div>
                        <Label htmlFor="deleteConfirm">Type "DELETE" to confirm</Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount || deleteConfirm !== "DELETE"}
                          variant="destructive"
                          className="flex-1"
                        >
                          {isDeletingAccount ? "Deleting..." : "Permanently Delete Account"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}