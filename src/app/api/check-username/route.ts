import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const runtime = 'nodejs';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = {
  maxRequests: 10, // Max requests per window
  windowMs: 60000, // 1 minute window
};

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or a combination of headers for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    // Clean up expired entries while we're at it
    cleanupExpiredEntries(now);
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

function cleanupExpiredEntries(now: number) {
  // Clean up expired entries (limit cleanup to avoid performance issues)
  if (rateLimitMap.size > 1000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { available: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Check if username is already taken in Firestore
    // Use a more efficient query with limit(1) since we only need to know if it exists
    const usersRef = collection(db, 'users');
    
    // Try to find any user with this exact displayName (case-insensitive)
    // We'll use a range query to find potential matches, then filter
    const q = query(
      usersRef,
      where('displayName', '>=', normalizedUsername),
      where('displayName', '<=', normalizedUsername + '\uf8ff'),
      limit(5) // Reduced from 10 to 5 for faster queries
    );

    const snapshot = await getDocs(q);
    // Check if any user has this exact username (case-insensitive)
    const isTaken = snapshot.docs.some(doc => {
      const data = doc.data();
      return data.displayName?.toLowerCase() === normalizedUsername;
    });

    return NextResponse.json({
      available: !isTaken,
      username: normalizedUsername
    });
  } catch (error: any) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}

