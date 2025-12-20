import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error - db is exported as any but can be Firestore
import { db } from '@/lib/firebase/admin';
import type { Firestore } from 'firebase-admin/firestore';

// Type assertion for db since it can be Firestore or mock
const typedDb: Firestore | null = db as Firestore | null;

export const runtime = 'nodejs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function verifyAdmin(request: NextRequest): boolean {
  // Security check: require environment variable to be set
  if (!ADMIN_PASSWORD) {
    return false;
  }
  
  const password = request.headers.get('x-admin-password') || request.nextUrl.searchParams.get('password');
  return password === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Admin SDK is properly configured
    if (!typedDb || typeof typedDb.collection !== 'function') {
      return NextResponse.json(
        { 
          error: 'Firebase Admin SDK not configured',
          message: 'Please configure Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) to view users.',
          users: []
        },
        { status: 503 }
      );
    }

    // Use Admin SDK to bypass security rules
    try {
      const usersSnapshot = await typedDb.collection('users').get();
      const users = usersSnapshot.docs.map((doc: any) => ({
        uid: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ users });
    } catch (dbError: any) {
      // If it's a credentials error, return empty array with helpful message
      if (dbError.message?.includes('credentials') || dbError.message?.includes('authentication')) {
        return NextResponse.json({
          users: [],
          message: 'Firebase Admin SDK credentials not configured. Users list unavailable in development mode.'
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch users',
        users: []
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uid, action } = await request.json();
    
    if (!uid || !action) {
      return NextResponse.json(
        { error: 'UID and action are required' },
        { status: 400 }
      );
    }

    if (!typedDb || typeof typedDb.collection !== 'function') {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not configured' },
        { status: 503 }
      );
    }

    if (action === 'ban') {
      await typedDb.collection('users').doc(uid).update({ banned: true });
      return NextResponse.json({ success: true, message: 'User banned' });
    } else if (action === 'unban') {
      await typedDb.collection('users').doc(uid).update({ banned: false });
      return NextResponse.json({ success: true, message: 'User unbanned' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    if (!typedDb || typeof typedDb.collection !== 'function') {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not configured' },
        { status: 503 }
      );
    }
    await typedDb.collection('users').doc(uid).delete();
    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

