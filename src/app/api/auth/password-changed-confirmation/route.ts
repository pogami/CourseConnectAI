import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Lazy initialization - only create Resend instance if API key exists
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const resend = getResend();

    if (!resend) {
      console.warn('⚠️ Resend API key not configured - cannot send password change confirmation email');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your password has been changed</title>
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
                        <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">Password Changed Successfully ✅</h1>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Hi there! 👋 This is a confirmation that the password for your CourseConnect account (${normalizedEmail}) was recently changed.
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #374151;">🔒 Didn't Request This?</p>
                          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4b5563;">
                            If you did not change your password, please contact our support team immediately or reset your password to secure your account.
                          </p>
                        </div>

                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          You can now use your new password to sign in to your account.
                        </p>
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

    await resend.emails.send({
      from: 'CourseConnect AI <noreply@courseconnectai.com>',
      to: normalizedEmail,
      subject: 'Your password was changed successfully ✅',
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending password change confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}

