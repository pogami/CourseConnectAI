import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

// Lazy initialization - only create Resend instance if API key exists
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin (lazy)
    const adminAuth = await getAdminAuth();
    
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }
    
    // Ensure we can parse the request body
    let email;
    try {
      const body = await request.json();
      email = body.email;
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Email is required.' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate password reset link using Firebase Admin
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth not initialized');
    }

      const continueUrl = process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
        : 'https://www.courseconnectai.com/reset-password';
    
    const firebaseResetLink = await adminAuth.generatePasswordResetLink(normalizedEmail, {
      url: continueUrl,
      handleCodeInApp: false,
    });
    
    // Extract oobCode from Firebase's link to create a direct link
    let resetLink = firebaseResetLink;
    try {
      const url = new URL(firebaseResetLink);
      const oobCode = url.searchParams.get('oobCode');
      if (oobCode) {
        // Create direct link to our reset-password page
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com';
        resetLink = `${baseUrl}/reset-password?mode=resetPassword&oobCode=${oobCode}`;
      }
    } catch (error) {
      console.warn('Could not parse Firebase reset link, using original:', error);
      // Fallback to original link if parsing fails
    }

    // Check if Resend is configured
    const resend = getResend();
    if (!resend) {
      console.warn('⚠️ Resend API key not configured - cannot send password reset email');
      return NextResponse.json(
        { 
          error: 'Email service not configured',
          message: 'Please set RESEND_API_KEY in your environment variables',
        },
        { status: 503 }
      );
    }

    // Beautiful password reset email template
    const resetEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your CourseConnect password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6; color: #111827;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header with gradient -->
                    <tr>
                      <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td valign="middle" align="center">
                              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                                <img src="https://www.courseconnectai.com/apple-touch-icon.png" alt="CourseConnect AI" style="width: 40px; height: 40px; border-radius: 8px;" />
                                <span style="font-weight: 600; font-size: 20px; color: #ffffff; letter-spacing: -0.025em;">CourseConnect</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">Reset Your Password 🔐</h1>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Hi there! 👋 We received a request to reset the password for your CourseConnect account (${normalizedEmail}).
                        </p>
                        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Click the button below to create a new password:
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <tr>
                            <td align="center">
                              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                                Reset Password →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Security Notice -->
                        <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; border: 1px solid #fcd34d; margin-bottom: 24px;">
                          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #92400e;">⏰ Link Expires in 1 Hour</p>
                          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #78350f;">
                            This link will expire in 1 hour for your security.
                          </p>
                        </div>

                        <!-- Security Notice -->
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #374151;">🔒 Didn't Request This?</p>
                          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4b5563;">
                            If you didn't request a password reset, you can safely ignore this email. Your account is still secure.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          &copy; ${new Date().getFullYear()} CourseConnect AI. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
    `;

    // Send email via Resend
    await resend.emails.send({
      from: 'CourseConnect AI <noreply@courseconnectai.com>',
      to: normalizedEmail,
      subject: 'Reset your CourseConnect password 🔐',
      html: resetEmailHtml,
    });

    console.log(`✅ Password reset email sent to ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });

  } catch (error: any) {
    console.error('Password reset error:', error);
    
    // Ensure we always return JSON, even for unexpected errors
    try {
      return NextResponse.json(
        { 
          error: 'Failed to send password reset email. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (jsonError) {
      // Fallback if JSON.stringify fails
      console.error('Failed to create JSON response:', jsonError);
      return new NextResponse(
        JSON.stringify({ error: 'An unexpected error occurred' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  }
}

