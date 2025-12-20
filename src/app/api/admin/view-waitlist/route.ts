import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';

export const runtime = 'nodejs';

// Simple admin password check
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'courseconnect';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const password = authHeader.replace('Bearer ', '');
  return password === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Firebase is configured
    if (!db || typeof db.collection !== 'function') {
      return NextResponse.json(
        { 
          error: 'Firebase not configured',
          waitlist: [],
          total: 0,
        },
        { status: 503 }
      );
    }

    // Fetch all waitlist emails
    let waitlistRef;
    let snapshot;
    
    try {
      waitlistRef = db.collection('waitlist');
      snapshot = await waitlistRef.get();
    } catch (fetchError: any) {
      console.error('Error fetching waitlist:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch waitlist',
          message: fetchError.message || 'Database query failed',
          waitlist: [],
          total: 0,
        },
        { status: 500 }
      );
    }

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No waitlist signups found',
        waitlist: [],
        total: 0,
        notified: 0,
        unnotified: 0,
      });
    }

    const waitlist = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      email: doc.data().email,
      createdAt: doc.data().createdAt,
      notified: doc.data().notified || false,
      notifiedAt: doc.data().notifiedAt || null,
      feature: doc.data().feature || 'student-connections',
    }));

    const notified = waitlist.filter((item: any) => item.notified).length;
    const unnotified = waitlist.filter((item: any) => !item.notified).length;

    return NextResponse.json({
      success: true,
      waitlist: waitlist.sort((a: any, b: any) => {
        // Sort by notified status (unnotified first), then by date (newest first)
        if (a.notified !== b.notified) {
          return a.notified ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
      total: waitlist.length,
      notified,
      unnotified,
    });
  } catch (error: any) {
    console.error('Error viewing waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist', message: error.message },
      { status: 500 }
    );
  }
}





