
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase/client-simple";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
// Removed firebase-error-handler import - using local implementations
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Loader2, User, Mail, GraduationCap, Calendar, Bell, MessageSquare, Settings, CreditCard, AlertTriangle, MapPin, Users, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { universities } from "@/lib/universities";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function ProfilePage() {
    const { toast } = useToast();
    const [user, loading, error] = useAuthState(auth);
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [school, setSchool] = useState("");
    const [major, setMajor] = useState("");
    const [graduationYear, setGraduationYear] = useState("");
    const [profilePicture, setProfilePicture] = useState<string>("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [location, setLocation] = useState("");
    const [birthday, setBirthday] = useState("");
    const [bio, setBio] = useState("");
    const [gpa, setGpa] = useState("");
    const [credits, setCredits] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState([
        {
            id: "chat",
            icon: <MessageSquare className="size-5 text-blue-500" />,
            title: "Chat Notifications",
            description: "New messages and mentions in study groups",
            enabled: true
        },
        {
            id: "assignments",
            icon: <Calendar className="size-5 text-green-500" />,
            title: "Assignment Reminders",
            description: "Deadlines and important dates",
            enabled: true
        },
        {
            id: "groups",
            icon: <User className="size-5 text-purple-500" />,
            title: "Study Group Updates",
            description: "New members and group activities",
            enabled: false
        }
    ]);

    // Load notification settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Restore icons for saved settings
                const restoredSettings = parsed.map((setting: any) => {
                    const defaultSetting = notificationSettings.find(s => s.id === setting.id);
                    return {
                        ...setting,
                        icon: defaultSetting?.icon || <Bell className="size-5 text-gray-500" />
                    };
                });
                setNotificationSettings(restoredSettings);
            } catch (error) {
                console.warn('Error parsing saved notification settings:', error);
            }
        }
    }, []);

    // Function to sync pending data when online
    const syncPendingData = async () => {
        if (!user) return;
        
        try {
            const pendingData = localStorage.getItem(`profileData_${user.uid}`);
            if (pendingData) {
                const profileData = JSON.parse(pendingData);
                if (profileData.pendingSync) {
                    const userDocRef = doc(db, "users", user.uid);
                    await localSafeFirebaseOperation(() => setDoc(userDocRef, {
                        displayName: profileData.displayName,
                        email: profileData.email,
                        school: profileData.school,
                        major: profileData.major,
                        graduationYear: profileData.graduationYear,
                        profilePicture: profileData.profilePicture,
                    }, { merge: true }), "sync pending profile data");
                    
                    // Remove pending flag
                    profileData.pendingSync = false;
                    localStorage.setItem(`profileData_${user.uid}`, JSON.stringify(profileData));
                    
                    console.log("Pending profile data synced successfully");
                }
            }
        } catch (error) {
            console.error("Error syncing pending data:", error);
        }
    };

    // Local safeFirebaseOperation with enhanced fallback handling
    const localSafeFirebaseOperation = async (operation: () => Promise<any>, operationName?: string, fallback?: () => void) => {
        try {
            return await operation();
        } catch (error: any) {
            console.log(`Firebase operation "${operationName || 'unknown'}" failed, using fallback:`, error.message);
            
            // Try to force Firebase online
            try {
                const { ensureFirebaseOnline } = await import('@/lib/firebase/client');
                await ensureFirebaseOnline();
            } catch (onlineError) {
                console.log("Failed to force Firebase online:", onlineError);
            }
            
            if (fallback) fallback();
            return null;
        }
    };

    useEffect(() => {
        if (loading) return; // Wait for auth to load
        if (!user) {
            router.push('/login');
            return;
        }
        
        // Check if user is a guest user (from localStorage)
        let isGuestUser = false;
        try {
            const guestData = localStorage.getItem('guestUser');
            if (guestData) {
                const parsed = JSON.parse(guestData);
                isGuestUser = parsed.isGuest === true;
            }
        } catch (error) {
            console.error("Error checking guest status:", error);
        }
        
        console.log("Profile load check - isGuestUser:", isGuestUser, "user.isGuest:", user.isGuest, "user.isAnonymous:", user.isAnonymous);
        
        if (isGuestUser || user.isGuest || user.isAnonymous) {
            // Handle guest user data from localStorage
            try {
                const guestData = localStorage.getItem('guestUser');
                if (guestData) {
                    const parsed = JSON.parse(guestData);
                    setDisplayName(parsed.displayName || "");
                    setProfilePicture(parsed.profilePicture || "");
                    
                    // Parse display name
                    const nameParts = (parsed.displayName || "").split(" ");
                    setFirstName(nameParts[0] || "");
                    setLastName(nameParts.slice(1).join(" ") || "");
                    
                    // Set other guest data
                    setSchool(parsed.school || "");
                    setMajor(parsed.major || "");
                    setGraduationYear(parsed.graduationYear || "");
                    setPhoneNumber(parsed.phoneNumber || "");
                    setLocation(parsed.location || "");
                    setBirthday(parsed.birthday || "");
                    setBio(parsed.bio || "");
                    setGpa(parsed.gpa || "");
                    setCredits(parsed.credits || "");
                    setAcademicYear(parsed.academicYear || "");
                }
                setIsLoading(false);
                return;
            } catch (error) {
                console.error("Error loading guest data:", error);
            }
        }
        
        const fetchUserData = async () => {
            setIsLoading(true);
            setDisplayName(user.displayName || "");
            setProfilePicture(user.photoURL || "");
            
            // Parse display name into first and last name
            const nameParts = (user.displayName || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            
            try {
                // First try to sync any pending data
                await syncPendingData();
                
                // Safe Firebase operation with offline fallback
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await localSafeFirebaseOperation(() => getDoc(userDocRef), "get user profile");

                if (userDocSnap && userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (userData) {
                        setSchool(userData.school || "");
                        setMajor(userData.major || "");
                        setGraduationYear(userData.graduationYear || "");
                        setPhoneNumber(userData.phoneNumber || "");
                        setLocation(userData.location || "");
                        setBirthday(userData.birthday || "");
                        setBio(userData.bio || "");
                        setGpa(userData.gpa || "");
                        setCredits(userData.credits || "");
                        setAcademicYear(userData.academicYear || "");
                        if (userData.profilePicture) {
                            setProfilePicture(userData.profilePicture);
                        }
                    }
                } else {
                    // No document exists, check for local data
                    const localData = localStorage.getItem(`profileData_${user.uid}`);
                    if (localData) {
                        const profileData = JSON.parse(localData);
                        setSchool(profileData.school || "");
                        setMajor(profileData.major || "");
                        setGraduationYear(profileData.graduationYear || "");
                        setPhoneNumber(profileData.phoneNumber || "");
                        setLocation(profileData.location || "");
                        setBirthday(profileData.birthday || "");
                        setBio(profileData.bio || "");
                        setGpa(profileData.gpa || "");
                        setCredits(profileData.credits || "");
                        setAcademicYear(profileData.academicYear || "");
                        if (profileData.profilePicture) {
                            setProfilePicture(profileData.profilePicture);
                        }
                    }
                    console.log("No user document found or Firebase offline, using defaults");
                }
            } catch (error: any) {
                console.error("Error fetching user data:", error);
                
                // Handle offline errors gracefully
                if (error.code === 'unavailable' || error.message?.includes('offline')) {
                    console.log("Firebase is offline, using cached/default data");
                    
                    // Try to load from local storage
                    const localData = localStorage.getItem(`profileData_${user.uid}`);
                    if (localData) {
                        const profileData = JSON.parse(localData);
                        setSchool(profileData.school || "");
                        setMajor(profileData.major || "");
                        setGraduationYear(profileData.graduationYear || "");
                        if (profileData.profilePicture) {
                            setProfilePicture(profileData.profilePicture);
                        }
                    }
                    
                    toast({
                        title: "Offline Mode",
                        description: "Profile data loaded from cache. Changes will sync when online.",
                        variant: "default",
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not load your profile data. Please try again.",
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();

    }, [user, loading, toast]);


    const getInitials = (name: string | null | undefined) => {
      if (!name) return "U";
      const parts = name.split(' ');
      if (parts.length > 1) {
          return parts[0][0] + parts[parts.length - 1][0];
      }
      return name[0];
    }

    const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<File> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const uploadWithTimeout = async (imageRef: any, file: File, timeoutMs: number = 60000): Promise<void> => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Upload timeout - please try again'));
            }, timeoutMs);

            uploadBytes(imageRef, file)
                .then(() => {
                    clearTimeout(timeout);
                    resolve();
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    };

    const handleProfilePictureUpload = async (file: File) => {
        if (!user) {
            console.error("No user found");
            return;
        }
        
        console.log("Starting profile picture upload for user:", user.uid);
        console.log("Original file details:", { name: file.name, size: file.size, type: file.type });
        
        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus("Preparing image...");
        setUploadSuccess(false);
        
        let compressedFile: File | null = null;
        
        try {
            // Show immediate preview
            const previewURL = URL.createObjectURL(file);
            setProfilePicture(previewURL);
            setUploadProgress(10);
            setUploadStatus("Showing preview...");
            
            // Handle guest users differently - use data URL instead of Firebase Storage
            let isGuestUser = false;
            try {
                const guestData = localStorage.getItem('guestUser');
                if (guestData) {
                    const parsed = JSON.parse(guestData);
                    isGuestUser = parsed.isGuest === true;
                }
            } catch (error) {
                console.error("Error checking guest status:", error);
            }
            
            console.log("Upload check - isGuestUser:", isGuestUser, "user.isGuest:", user.isGuest, "user.isAnonymous:", user.isAnonymous);
            
            if (isGuestUser || user.isGuest || user.isAnonymous) {
                console.log("Guest user detected - using data URL approach");
                
                try {
                    // Step 1: Start conversion
                    setUploadProgress(20);
                    setUploadStatus("Converting image...");
                    
                    // Convert file to data URL with progress simulation
                    const dataURL = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        
                        reader.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const progress = Math.round((event.loaded / event.total) * 60) + 20; // 20-80%
                                setUploadProgress(progress);
                            }
                        };
                        
                        reader.onload = () => {
                            setUploadProgress(80);
                            setUploadStatus("Processing...");
                            resolve(reader.result as string);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    
                    // Step 2: Save to localStorage
                    setUploadProgress(90);
                    setUploadStatus("Saving locally...");
                    
                    // Small delay to show the progress
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    const guestData = localStorage.getItem('guestUser');
                    let guestUserData = guestData ? JSON.parse(guestData) : {};
                    guestUserData.profilePicture = dataURL;
                    localStorage.setItem('guestUser', JSON.stringify(guestUserData));
                    console.log("Guest profile picture saved to localStorage");
                    
                    // Step 3: Complete
                    setUploadProgress(100);
                    setUploadStatus("Complete!");
                    
                    // Small delay to show completion
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Set the profile picture to the data URL (not the preview URL)
                    setProfilePicture(dataURL);
                    
                    // Notify other components that profile picture changed
                    window.dispatchEvent(new CustomEvent('profilePictureChanged', { 
                        detail: { profilePicture: dataURL } 
                    }));
                    
                    // Clean up the preview URL
                    URL.revokeObjectURL(previewURL);
                    
                    toast({
                        title: "Profile Picture Updated",
                        description: "Your profile picture has been successfully updated.",
                    });
                    
                    // Reset success state after 2 seconds
                    setTimeout(() => {
                        setUploadSuccess(false);
                        setUploadStatus("");
                    }, 2000);
                    
                    setIsUploading(false);
                    return;
                } catch (error) {
                    console.error("Error in guest upload:", error);
                    toast({
                        variant: "destructive",
                        title: "Upload Failed",
                        description: "Could not save profile picture. Please try again.",
                    });
                    setIsUploading(false);
                    return;
                }
            }
            
            // For authenticated users, use Firebase Storage
            setUploadProgress(20);
            setUploadStatus("Compressing image...");
            
            // Compress the image
            console.log("Compressing image...");
            setUploadStatus("Compressing image...");
            compressedFile = await compressImage(file);
            setUploadProgress(30);
            console.log("Compressed file details:", { name: compressedFile.name, size: compressedFile.size, type: compressedFile.type });
            
            // Create a reference to the file in Firebase Storage
            const imageRef = ref(storage, `profile-pictures/${user.uid}`);
            console.log("Created storage reference:", imageRef.fullPath);
            setUploadProgress(40);
            setUploadStatus("Uploading to cloud...");
            
            // Try alternative path if main path fails
            let finalImageRef = imageRef;
            
            // Upload the compressed file
            console.log("Uploading compressed file...");
            setUploadStatus("Uploading to cloud...");
            
            let uploadAttempts = 0;
            const maxAttempts = 3;
            let uploadSuccess = false;
            
            while (uploadAttempts < maxAttempts && !uploadSuccess) {
                try {
                    uploadAttempts++;
                    console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}`);
                    
                    if (uploadAttempts > 1) {
                        setUploadStatus(`Retrying upload... (${uploadAttempts}/${maxAttempts})`);
                        // Try alternative path on retry
                        finalImageRef = ref(storage, `users/${user.uid}/profile-picture`);
                        console.log("Trying alternative path:", finalImageRef.fullPath);
                    }
                    
                    await uploadWithTimeout(finalImageRef, compressedFile, 60000); // 60 second timeout
                    uploadSuccess = true;
                    console.log("File uploaded successfully");
                } catch (error) {
                    console.error(`Upload attempt ${uploadAttempts} failed:`, error);
                    
                    if (uploadAttempts >= maxAttempts) {
                        throw new Error(`Upload failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            setUploadProgress(70);
            
            // Get the download URL
            console.log("Getting download URL...");
            setUploadStatus("Finalizing...");
            const downloadURL = await getDownloadURL(finalImageRef);
            setUploadProgress(85);
            console.log("Download URL:", downloadURL);
            
            // Update the user's profile picture in Auth
            console.log("Updating Firebase Auth profile...");
            setUploadStatus("Updating profile...");
            await updateProfile(user, { photoURL: downloadURL });
            setUploadProgress(95);
            console.log("Firebase Auth profile updated");
            
            // Update the local state with the final URL
            setProfilePicture(downloadURL);
            
            // Handle guest users differently
            if (user.isGuest) {
                // Save profile picture to localStorage for guest users
                try {
                    const guestData = localStorage.getItem('guestUser');
                    let guestUserData = guestData ? JSON.parse(guestData) : {};
                    guestUserData.profilePicture = downloadURL;
                    localStorage.setItem('guestUser', JSON.stringify(guestUserData));
                    console.log("Guest profile picture saved to localStorage");
                    
                    // Dispatch custom event to notify other components
                    window.dispatchEvent(new CustomEvent('guestProfileUpdated'));
                } catch (error) {
                    console.error("Error saving guest profile picture:", error);
                }
            } else {
                // Update user data in Firestore for authenticated users
                console.log("Updating Firestore document...");
                const userDocRef = doc(db, "users", user.uid);
                await setDoc(userDocRef, {
                    profilePicture: downloadURL,
                }, { merge: true });
                console.log("Firestore document updated");
            }
            
            setUploadProgress(100);
            setUploadSuccess(true);
            setUploadStatus("Upload successful!");

            // Clean up the preview URL
            URL.revokeObjectURL(previewURL);

            toast({
                title: "Profile Picture Updated",
                description: "Your profile picture has been successfully updated.",
            });

            // Reset success state after 3 seconds
            setTimeout(() => {
                setUploadSuccess(false);
                setUploadStatus("");
            }, 3000);
        } catch (error) {
            console.error("Profile picture upload error:", error);
            
            // Fallback: Use data URL for immediate display
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataURL = e.target?.result as string;
                    setProfilePicture(dataURL);
                    
                    // Update Firestore with data URL (temporary solution)
                    const userDocRef = doc(db, "users", user.uid);
                    setDoc(userDocRef, {
                        profilePicture: dataURL,
                    }, { merge: true });
                };
                reader.readAsDataURL(compressedFile || file);
                
                toast({
                    title: "Profile Picture Updated (Local)",
                    description: "Your profile picture has been saved locally. Cloud sync will retry automatically.",
                });
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: `Could not upload your profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStatus("");
        }
    };

    const handleSave = async () => {
        if (!user) return;
        
        // Validate GPA and Credits before saving
        const gpaNum = parseFloat(gpa);
        const creditsNum = parseInt(credits);
        
        if (gpa && (gpaNum < 0 || gpaNum > 4)) {
            toast({
                variant: "destructive",
                title: "Invalid GPA",
                description: "GPA must be between 0.0 and 4.0",
            });
            return;
        }
        
        if (credits && (creditsNum < 0 || creditsNum > 130)) {
            toast({
                variant: "destructive",
                title: "Invalid Credits",
                description: "Credits must be between 0 and 130",
            });
            return;
        }
        
        setIsSaving(true);
        try {
            // Check if user is a guest user
            let isGuestUser = false;
            try {
                const guestData = localStorage.getItem('guestUser');
                if (guestData) {
                    const parsed = JSON.parse(guestData);
                    isGuestUser = parsed.isGuest === true;
                }
            } catch (error) {
                console.error("Error checking guest status:", error);
            }
            const fullName = `${firstName} ${lastName}`.trim();
            
            if (isGuestUser || user.isGuest || user.isAnonymous) {
                // Handle guest user data - save to localStorage
                const guestData = localStorage.getItem('guestUser');
                let guestUserData = guestData ? JSON.parse(guestData) : {};
                
                guestUserData = {
                    ...guestUserData,
                    displayName: fullName,
                    firstName,
                    lastName,
                    email: user.email,
                    school,
                    major,
                    graduationYear,
                    phoneNumber,
                    location,
                    birthday,
                    bio,
                    gpa,
                    credits,
                    academicYear,
                    profilePicture,
                    lastUpdated: Date.now()
                };
                
                localStorage.setItem('guestUser', JSON.stringify(guestUserData));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('guestProfileUpdated'));
                
                toast({
                    title: "Profile Updated",
                    description: "Your profile has been successfully saved locally.",
                });
            } else {
                // Handle authenticated user data
                if (user.displayName !== fullName) {
                    await updateProfile(user, { displayName: fullName });
                    setDisplayName(fullName);
                }

                // Update user data in Firestore with safe operation
                const userDocRef = doc(db, "users", user.uid);
                await localSafeFirebaseOperation(() => setDoc(userDocRef, {
                    displayName: fullName,
                    firstName,
                    lastName,
                    email: user.email,
                    school,
                    major,
                    graduationYear,
                    phoneNumber,
                    location,
                    birthday,
                    bio,
                    gpa,
                    credits,
                    academicYear,
                    profilePicture,
                }, { merge: true }), "save user profile");

                toast({
                    title: "Profile Updated",
                    description: "Your profile has been successfully updated.",
                });
            }
        } catch (error: any) {
            console.error("Profile update error:", error);
            
            // Handle offline errors gracefully
            if (error.code === 'unavailable' || error.message?.includes('offline')) {
                // Store data locally for when online
                const profileData = {
                    displayName: fullName,
                    firstName,
                    lastName,
                    email: user.email,
                    school,
                    major,
                    graduationYear,
                    phoneNumber,
                    location,
                    birthday,
                    bio,
                    gpa,
                    credits,
                    academicYear,
                    profilePicture,
                    lastUpdated: Date.now(),
                    pendingSync: true
                };
                localStorage.setItem(`profileData_${user.uid}`, JSON.stringify(profileData));
                
                toast({
                    title: "Offline Mode",
                    description: "Profile saved locally. Will sync when online.",
                    variant: "default",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Could not update your profile. Please try again.",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotificationSetting = async (id: string) => {
        const setting = notificationSettings.find(s => s.id === id);
        const newEnabled = !setting?.enabled;
        
        try {
            // Update local state immediately for better UX
            setNotificationSettings(prev => 
                prev.map(setting => 
                    setting.id === id 
                        ? { ...setting, enabled: newEnabled }
                        : setting
                )
            );

            // Save to localStorage for persistence (without React components)
            const updatedSettings = notificationSettings.map(s => 
                s.id === id ? { ...s, enabled: newEnabled } : s
            );
            const settingsToSave = updatedSettings.map(({ icon, ...rest }) => rest);
            localStorage.setItem('notificationSettings', JSON.stringify(settingsToSave));

            // If user is authenticated, save to server
            if (user) {
                const response = await fetch('/api/notifications/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.uid,
                        settings: settingsToSave
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save notification settings');
                }
            }

            toast({
                title: `${setting?.title} ${newEnabled ? 'Enabled' : 'Disabled'}`,
                description: `You will ${newEnabled ? 'now' : 'no longer'} receive ${setting?.title.toLowerCase()}.`,
            });
        } catch (error) {
            console.error('Error updating notification settings:', error);
            
            // Revert local state on error
            setNotificationSettings(prev => 
                prev.map(setting => 
                    setting.id === id 
                        ? { ...setting, enabled: !newEnabled }
                        : setting
                )
            );

            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update notification settings. Please try again.",
            });
        }
    };

    if (loading || isLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-9 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-7 w-40" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-11 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-11 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                         <Skeleton className="h-11 w-32" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your personal information and academic profile</p>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card & Academic Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Profile Card */}
                        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
                            <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                    <div className="relative mx-auto w-24 h-24">
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                            <AvatarImage src={profilePicture || user?.photoURL || ''} alt={user?.displayName || ''} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                                {getInitials(user?.displayName || user?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleProfilePictureUpload(file);
                                                }
                                            }}
                                            className="hidden"
                                            id="profile-picture-upload"
                                            disabled={isUploading}
                                        />
                                        <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                                            disabled={isUploading}
                                            onClick={() => {
                                                const fileInput = document.getElementById('profile-picture-upload') as HTMLInputElement;
                                                if (fileInput) {
                                                    fileInput.click();
                                                }
                                            }}
                                        >
                                            {isUploading ? (
                                                uploadSuccess ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                )
                                            ) : (
                                                <Camera className="h-4 w-4"/>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    {/* Upload Progress Indicator */}
                                    {isUploading && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{uploadStatus}</span>
                                                <span className="text-muted-foreground">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h2 className="text-xl font-bold">{displayName || 'John Doe'}</h2>
                                        <p className="text-muted-foreground">{major || 'Major'}</p>
                                        <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                            {academicYear || 'Junior'}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground">
                                        {bio || 'Tell us about yourself! What are your interests, goals, or what you love about your field of study?'}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <GraduationCap className="h-4 w-4" />
                                            <span>{(() => {
                                                try {
                                                    const guestData = localStorage.getItem('guestUser');
                                                    if (guestData) {
                                                        const parsed = JSON.parse(guestData);
                                                        if (parsed.isGuest === true) {
                                                            return 'Sign up to save your university';
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.error("Error checking guest status for university:", error);
                                                }
                                                return school || 'Enter your university';
                                            })()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{location || 'Enter your location'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{birthday || 'Enter your birthday'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Academic Stats Card */}
                        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Academic Stats</CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Enter your GPA and credits below for them to appear here
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">{gpa || '0'}</div>
                                        <div className="text-sm text-muted-foreground">GPA</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">{credits || '0'}</div>
                                        <div className="text-sm text-muted-foreground">Credits</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Personal Information Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="size-5 text-primary" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal details and contact information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="John"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                        id="email" 
                                        value={user?.email || ""} 
                                        disabled 
                                        className="bg-muted/30 text-muted-foreground"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input 
                                        id="phoneNumber" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                        disabled={isSaving}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                        <Input 
                                            id="location" 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Enter your location"
                                            disabled={isSaving}
                                        />
                                </div>
                                
                                {/* Major - editable */}
                                <div className="space-y-2">
                                    <Label htmlFor="major">Major</Label>
                                    <Input 
                                        id="major" 
                                        value={major}
                                        onChange={(e) => setMajor(e.target.value.slice(0,60))}
                                        placeholder="Enter your major"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birthday">Birthday</Label>
                                    <Input 
                                        id="birthday" 
                                        value={birthday}
                                        onChange={(e) => setBirthday(e.target.value)}
                                        placeholder="Enter your birthday"
                                        disabled={isSaving}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea 
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Enter your bio"
                                        disabled={isSaving}
                                        className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                
                                {/* Academic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Academic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="academicYear">Academic Year</Label>
                                            <Select value={academicYear} onValueChange={setAcademicYear} disabled={isSaving}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Freshman">Freshman</SelectItem>
                                                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                                                    <SelectItem value="Junior">Junior</SelectItem>
                                                    <SelectItem value="Senior">Senior</SelectItem>
                                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gpa">GPA (0.0 - 4.0)</Label>
                                            <Input 
                                                id="gpa" 
                                                type="number"
                                                min="0"
                                                max="4"
                                                step="0.1"
                                                value={gpa}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Only allow values between 0 and 4
                                                    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 4)) {
                                                        setGpa(value);
                                                    }
                                                }}
                                                placeholder="3.8"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="credits">Credits Earned (0 - 130)</Label>
                                            <Input 
                                                id="credits" 
                                                type="number"
                                                min="0"
                                                max="130"
                                                value={credits}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Only allow values between 0 and 130
                                                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 130)) {
                                                        setCredits(value);
                                                    }
                                                }}
                                                placeholder="89"
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t">
                                    <Button 
                                        onClick={handleSave} 
                                        disabled={isSaving}
                                        className="w-full"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2" /> 
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
