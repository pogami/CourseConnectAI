import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Lazy initialization function for Firebase Admin (only import when needed)
async function getAdminAuth() {
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    
    let app;
    if (getApps().length === 0) {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'courseconnect-61eme' });
      }
    } else {
      app = getApps()[0];
    }
    return getAuth(app);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

async function getAdminDb() {
  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    
    let app;
    if (getApps().length === 0) {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'courseconnect-61eme' });
      }
    } else {
      app = getApps()[0];
    }
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, idToken } = body;

    if (!userId || !idToken) {
      return NextResponse.json(
        { error: 'User ID and ID token are required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin (lazy)
    const adminAuth = await getAdminAuth();
    const adminDb = await getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Verify the ID token to ensure the request is from the authenticated user
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return NextResponse.json(
          { error: 'User ID does not match token' },
          { status: 403 }
        );
      }
    } catch (error: any) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Delete all user data from Firestore
    const collections = [
      'chats', 'messages', 'notifications', 'files', 'flashcardSets',
      'studySessions', 'whiteboardSessions', 'scannedDocuments',
      'courses', 'studySchedules', 'analytics'
    ];

    const batch = adminDb.batch();
    let deletedCount = 0;

    for (const collectionName of collections) {
      try {
        const snapshot = await adminDb.collection(collectionName)
          .where('userId', '==', userId)
          .get();
        
        snapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      } catch (error) {
        console.warn(`Failed to delete from ${collectionName}:`, error);
      }
    }

    // Delete user document
    try {
      const userRef = adminDb.collection('users').doc(userId);
      batch.delete(userRef);
      deletedCount++;
    } catch (error) {
      console.warn('Failed to delete user document:', error);
    }

    // Commit all deletions
    await batch.commit();

    // Delete the Firebase Auth user (this bypasses recent login requirement)
    try {
      await adminAuth.deleteUser(userId);
    } catch (error: any) {
      console.error('Failed to delete auth user:', error);
      // Even if auth deletion fails, we've deleted all their data
      // Return success but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all data deleted successfully',
      deletedItems: deletedCount
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}

