// Create safe mock database that never crashes
const createMockDb = () => ({
  collection: (name: string) => ({
    add: (data: any) => {
      console.log('⚠️ Using mock database - operation not persisted:', name, data);
      return Promise.resolve({ id: 'mock-id-' + Date.now() });
    },
    where: (field: string, op: string, value: any) => ({
      get: () => Promise.resolve({ empty: true, docs: [], size: 0 }),
    }),
    doc: (id: string) => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
    }),
  }),
});

// Lazy initialization function for Firebase Admin (only import when needed)
async function getAdminDb() {
  // Only initialize if we have the required environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      // Handle escaped \n (from .env files) - only replace if they're actually escaped
      if (privateKey && privateKey.includes('\\n') && !privateKey.includes('\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      const firebaseAdminConfig = {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: privateKey!,
        }),
      };
      
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseAdminConfig, 'waitlist-admin');
      } else {
        app = getApps()[0];
      }
      
      const adminDb = getFirestore(app);
      console.log('✅ Firebase Admin initialized successfully');
      return adminDb;
    } catch (error: any) {
      console.error('❌ Firebase Admin init failed:', error.message);
      console.error('Error details:', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
      });
      return createMockDb();
    }
  } else {
    return createMockDb();
  }
}

// Export a promise that resolves to the db (for backward compatibility)
let dbPromise: Promise<any> | null = null;
const getDb = () => {
  if (!dbPromise) {
    dbPromise = getAdminDb();
  }
  return dbPromise;
};

// For synchronous access (will return mock if not initialized)
const db = createMockDb();

export { db, getDb };


