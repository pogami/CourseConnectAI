import { NextRequest } from 'next/server';

/**
 * Test endpoint to simulate rate limit errors
 * 
 * Usage:
 * POST /api/test/rate-limit
 * Body: { "attempt": 1 } // 1-5 to simulate retries, 0 or omit to succeed
 * 
 * This helps test the retry logic and user-friendly error messages
 */
export async function POST(request: NextRequest) {
  try {
    const { attempt = 0 } = await request.json();
    
    // Simulate rate limit for attempts 1-5
    if (attempt > 0 && attempt <= 5) {
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      
      return new Response(JSON.stringify({
        type: 'error',
        status: 429,
        message: `Rate limit exceeded (429). Retrying automatically...`,
        retryAfter: Math.ceil(waitTime / 1000),
        attempt: attempt,
        maxAttempts: 5
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(waitTime / 1000).toString()
        }
      });
    }
    
    // Success after retries
    return new Response(JSON.stringify({
      type: 'success',
      message: 'Request succeeded after retries',
      answer: 'This is a test response. The retry logic worked correctly!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      type: 'error',
      message: error.message || 'Test endpoint error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


