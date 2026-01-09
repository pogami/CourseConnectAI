// Simplified Firebase client configuration
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Get authDomain - always use the Firebase auth domain (no localhost override)
// This must be a domain that Firebase Auth hosts handlers for (e.g. auth.courseconnectai.com)
// For production, use auth.courseconnectai.com which points to Firebase Hosting
// For localhost, Firebase will handle it automatically
const getAuthDomain = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Local development - Firebase will handle localhost automatically
    return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "courseconnect-61eme.firebaseapp.com";
  }
  // Production - use the auth subdomain that points to Firebase Hosting
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "auth.courseconnectai.com";
};

// Get Firebase config - dynamically set authDomain
const getFirebaseConfig = () => {
  return {
    "projectId": "courseconnect-61eme",
    "appId": "1:150901346125:web:116c79e5f3521488e97104",
    "storageBucket": "courseconnect-61eme.firebasestorage.app",
    "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
    "authDomain": getAuthDomain(),
    "messagingSenderId": "150901346125",
  };
};

// Initialize Firebase lazily (only on client side)
let app: any;
let storage: any, db: any, auth: any;
let initializedAuthDomain: string | null = null;

const initializeFirebase = () => {
  const firebaseConfig = getFirebaseConfig();
  const currentAuthDomain = firebaseConfig.authDomain;
  
  // If Firebase is already initialized but with a different authDomain, we need to reinitialize
  // This can happen when switching between localhost and production
  if (app && initializedAuthDomain && initializedAuthDomain !== currentAuthDomain) {
    console.log(`🔄 Auth domain changed from ${initializedAuthDomain} to ${currentAuthDomain}, reinitializing...`);
    // Note: Firebase doesn't allow reinitialization easily, but we can check if the domain matches
  }
  
  if (app && initializedAuthDomain === currentAuthDomain) {
    return { app, storage, db, auth };
  }
  
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      initializedAuthDomain = currentAuthDomain;
      console.log("✅ Firebase initialized successfully");
      console.log("🔐 Auth Domain:", firebaseConfig.authDomain);
    } else {
      app = getApps()[0];
      // Check if we need to update the auth domain
      // Since we can't change it after init, we'll log a warning if it's different
      if (!initializedAuthDomain) {
        initializedAuthDomain = currentAuthDomain;
        console.log("✅ Using existing Firebase app");
        console.log("🔐 Expected Auth Domain:", firebaseConfig.authDomain);
      }
    }

    storage = getStorage(app);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Only set auth persistence in browser environment (not in API routes)
    if (typeof window !== 'undefined' && auth) {
      // This will only run in the browser, not in server-side API routes
      // We skip setPersistence on server-side to avoid crashes
    }
    
    console.log("✅ Firebase services initialized");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    // Create minimal mock objects
    storage = null;
    db = null;
    auth = null;
  }
  
  return { app, storage, db, auth };
};

// Initialize immediately
const initialized = initializeFirebase();
app = initialized.app;
storage = initialized.storage;
db = initialized.db;
auth = initialized.auth;

export { app, storage, db, auth, initializeFirebase };
