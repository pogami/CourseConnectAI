import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Auth redirect handler
 * This route handles OAuth redirects from Google sign-in
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUrl = searchParams.get('redirectUrl');
    const apiKey = searchParams.get('apiKey');
    const authType = searchParams.get('authType');

    // If this is an OAuth callback, redirect back to the original page
    if (apiKey || authType) {
      if (redirectUrl) {
        try {
          const decodedUrl = decodeURIComponent(redirectUrl);
          // Ensure we're redirecting to the correct origin (localhost in dev, production in prod)
          const targetUrl = new URL(decodedUrl);
          const currentOrigin = request.nextUrl.origin;
          
          // If the redirectUrl points to a different origin, use the current origin instead
          if (targetUrl.origin !== currentOrigin && (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1'))) {
            // We're in development, redirect to localhost
            const localUrl = new URL(targetUrl.pathname + targetUrl.search, currentOrigin);
            return NextResponse.redirect(localUrl);
          }
          
          return NextResponse.redirect(decodedUrl);
        } catch {
          return NextResponse.redirect(redirectUrl);
        }
      }
      // Default: redirect to login page on current origin
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Default: redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Auth handler error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

