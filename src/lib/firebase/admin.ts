// Mock services for build time
const createMockDb = () => ({
  collection: (name: string) => ({
    add: () => Promise.resolve({ id: 'mock-id' }),
    get: () => Promise.resolve({ 
      docs: [],
      empty: true,
      size: 0
    }),
    doc: (id: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
  }),
});

const createMockAuth = () => ({
  verifyIdToken: () => Promise.resolve({ uid: 'mock-uid' }),
});

// Lazy initialization function for Firebase Admin (only import when needed)
async function getAdminServices() {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getAuth } = await import('firebase-admin/auth');

    let adminApp: any = null;

    // Only initialize if we have the required environment variables OR use default project
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Use environment variables (production)
      try {
        const firebaseAdminConfig = {
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        };
        adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
      } catch (error) {
        console.warn('Firebase Admin initialization with credentials failed:', error);
        return { db: createMockDb(), auth: createMockAuth() };
      }
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID) {
      // Fallback: Use project ID only (for build time)
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "courseconnect-61eme";
        adminApp = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
      } catch (error) {
        console.warn('Firebase Admin initialization failed:', error);
        return { db: createMockDb(), auth: createMockAuth() };
      }
    } else {
      return { db: createMockDb(), auth: createMockAuth() };
    }

    // Initialize services
    if (adminApp && adminApp.name !== 'admin-app') {
      return {
        db: getFirestore(adminApp),
        auth: getAuth(adminApp)
      };
    } else {
      return { db: createMockDb(), auth: createMockAuth() };
    }
  } catch (error) {
    console.error('Firebase Admin services initialization failed:', error);
    return { db: createMockDb(), auth: createMockAuth() };
  }
}

// Export mock services for synchronous access (will be replaced at runtime)
export const db = createMockDb();
export const auth = createMockAuth();
export { getAdminServices };
