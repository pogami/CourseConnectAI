import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client-simple';

// Lazy initialization - only create Resend instance if API key exists
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, deviceInfo } = body;

    if (!userId || !userEmail || !deviceInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has new device alerts enabled
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const newDeviceAlertsEnabled = userData.settings?.security?.newDeviceAlerts ?? false;

    if (!newDeviceAlertsEnabled) {
      return NextResponse.json({
        success: true,
        message: 'New device alerts are disabled for this user'
      });
    }

    // Check if Resend is configured
    const resend = getResend();
    if (!resend) {
      console.log('📧 NEW DEVICE ALERT EMAIL PREVIEW (RESEND_API_KEY not configured):');
      console.log('To:', userEmail);
      console.log('Device Info:', deviceInfo);
      return NextResponse.json({
        success: true,
        message: 'Email preview logged (RESEND_API_KEY not configured)'
      });
    }

    const { type, browser, platform, location } = deviceInfo;
    const deviceName = `${browser} on ${platform} (${type})`;
    const locationStr = location || 'Unknown Location';
    const timestamp = new Date().toLocaleString();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Device Sign-In Alert</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6; color: #111827;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td valign="middle">
                            <div style="display: flex; align-items: center; gap: 12px;">
                              <img src="https://www.courseconnectai.com/apple-touch-icon.png" alt="CourseConnect AI" style="width: 32px; height: 32px; border-radius: 8px;" />
                              <span style="font-weight: 600; font-size: 16px; color: #111827; letter-spacing: -0.025em;">CourseConnect AI</span>
                            </div>
                          </td>
                          <td align="right" valign="middle">
                            <span style="background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; letter-spacing: 0.025em;">SECURITY ALERT</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content Area -->
                  <tr>
                    <td style="padding: 40px;">
                      <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">New Device Sign-In Detected</h1>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                        We detected a sign-in to your CourseConnect AI account from a new device.
                      </p>
                      
                      <!-- Device Info Card -->
                      <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                        <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Device Information</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom: 12px;" width="40%">
                              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Device</p>
                            </td>
                            <td style="padding-bottom: 12px;">
                              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${deviceName}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 12px;" width="40%">
                              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Location</p>
                            </td>
                            <td style="padding-bottom: 12px;">
                              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${locationStr}</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="40%">
                              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Time</p>
                            </td>
                            <td>
                              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${timestamp}</p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Security Notice -->
                      <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; border: 1px solid #fde68a; margin-bottom: 32px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #92400e;">If this wasn't you:</p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
                          Please secure your account immediately by changing your password and reviewing your account settings.
                        </p>
                      </div>

                      <!-- Action Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://www.courseconnectai.com/dashboard/settings" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Review Account Settings</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                        This is an automated security alert from CourseConnect AI
                      </p>
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
      to: userEmail,
      subject: 'New Device Sign-In Alert - CourseConnect AI',
      html: emailHtml,
    });

    console.log(`✅ New device alert email sent to ${userEmail} for device: ${deviceName}`);

    return NextResponse.json({
      success: true,
      message: 'New device alert email sent successfully'
    });
  } catch (error) {
    console.error('New device alert error:', error);
    return NextResponse.json(
      { error: 'Failed to send new device alert' },
      { status: 500 }
    );
  }
}

