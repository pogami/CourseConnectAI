import { NextRequest, NextResponse } from 'next/server';

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

    // Temporarily disabled for build - will fix post-deploy
    return NextResponse.json({
      error: 'Service temporarily unavailable',
      message: 'This endpoint is being updated. Please check back soon.',
      users: []
    }, { status: 503 });
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
  return NextResponse.json(
    { error: 'Service temporarily unavailable' },
    { status: 503 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Service temporarily unavailable' },
    { status: 503 }
  );
}
