import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (only if credentials are available)
let app: any = null;
let adminDb: any = null;

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

// Only initialize if we have the required environment variables
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  try {
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
    
    if (getApps().length === 0) {
      app = initializeApp(firebaseAdminConfig, 'waitlist-admin');
    } else {
      app = getApps()[0];
    }
    
    adminDb = getFirestore(app);
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase Admin init failed:', error.message);
    console.error('Error details:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
    });
    adminDb = createMockDb();
  }
} else {
  adminDb = createMockDb();
}

export { adminDb as db };
export { adminDb };


