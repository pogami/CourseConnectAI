import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client-simple';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export async function GET() {
  try {
    // Get active users (users active in last 5 minutes)
    let activeUsers = 0;
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
      
      activeUsers = usersSnapshot.docs.filter(doc => {
        const data = doc.data();
        const lastActive = data.lastActive;
        return lastActive && lastActive.toMillis() > fiveMinutesAgo.toMillis();
      }).length;
    } catch (error) {
      console.error('Error getting active users:', error);
    }

    // Check Firestore connection
    let firestoreConnected = false;
    try {
      await getDocs(collection(db, 'users'));
      firestoreConnected = true;
    } catch (error) {
      firestoreConnected = false;
    }

    return NextResponse.json({
      activeUsers,
      firestoreConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      activeUsers: 0,
      firestoreConnected: false,
      error: error?.message || 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}


