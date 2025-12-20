import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/firebase/server';

export const runtime = 'nodejs';

// Lazy initialization - only create Resend instance if API key exists
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

// Simple admin password check (you should use proper auth in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'courseconnect';

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const password = authHeader.replace('Bearer ', '');
  return password === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
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
      console.warn('⚠️ Firebase not configured - cannot fetch waitlist');
      return NextResponse.json(
        { 
          error: 'Firebase not configured',
          message: 'Please configure Firebase Admin SDK to use this feature',
          total: 0,
          sent: 0,
          failed: 0,
        },
        { status: 503 }
      );
    }

    // Fetch all waitlist emails where notified: false
    let waitlistRef;
    let unnotifiedSnapshot;
    
    try {
      waitlistRef = db.collection('waitlist');
      unnotifiedSnapshot = await waitlistRef
        .where('notified', '==', false)
        .get();
    } catch (fetchError: any) {
      console.error('Error fetching waitlist:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch waitlist',
          message: fetchError.message || 'Database query failed',
          total: 0,
          sent: 0,
          failed: 0,
        },
        { status: 500 }
      );
    }

    if (unnotifiedSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No unnotified emails found',
        count: 0,
      });
    }

    const emails = unnotifiedSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      email: doc.data().email,
      createdAt: doc.data().createdAt,
    }));

    console.log(`📧 Found ${emails.length} unnotified waitlist subscribers`);

    // Check if Resend is configured
    const resend = getResend();
    if (!resend) {
      console.warn('⚠️ Resend API key not configured - cannot send emails');
      return NextResponse.json(
        { 
          error: 'Resend API key not configured',
          message: 'Please set RESEND_API_KEY in your environment variables',
          total: emails.length,
          sent: 0,
          failed: emails.length,
        },
        { status: 503 }
      );
    }

    // Email template for launch notification
    const launchEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Student Connections is Here! 🎉</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6; color: #111827;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 40px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td valign="middle" align="center">
                              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                                <img src="https://www.courseconnectai.com/apple-touch-icon.png" alt="CourseConnect AI" style="width: 32px; height: 32px; border-radius: 8px;" />
                                <span style="font-weight: 600; font-size: 18px; color: #ffffff; letter-spacing: -0.025em;">CourseConnect AI</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">It's Here! 🎉</h1>
                        <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.6; color: #4b5563; font-weight: 600;">
                          Student Connections is now live!
                        </p>
                        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          You asked to be notified when this feature launched, and the day has finally arrived! Connect with students in your course or similar classes at your school and other institutions.
                        </p>
                        
                        <!-- Feature Highlights -->
                        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; border: 1px solid #86efac; margin-bottom: 32px;">
                          <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">What You Can Do Now</p>
                          <ul style="margin: 0; padding-left: 20px; color: #166534;">
                            <li style="margin-bottom: 8px;">Connect with students in the same course at your school</li>
                            <li style="margin-bottom: 8px;">Find study partners in similar courses at other institutions</li>
                            <li style="margin-bottom: 8px;">Join shared class chats and form study groups</li>
                            <li style="margin-bottom: 0;">Study smarter together with classmates</li>
                          </ul>
                        </div>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                          <tr>
                            <td align="center">
                              <a href="https://www.courseconnectai.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(20, 184, 166, 0.3);">
                                Connect with Students Now →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                          Just upload your syllabus and you'll automatically be matched with other students studying the same or similar courses. The first student to upload creates the chat—everyone else can discover and join instantly.
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

    // Send emails in batches (Resend allows up to 50 recipients per batch)
    const BATCH_SIZE = 50;
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      
      try {
        // Resend batch API - send to multiple recipients
        const batchResults = await Promise.allSettled(
          batch.map(({ email }: { email: string }) =>
            resend.emails.send({
              from: 'CourseConnect AI <noreply@courseconnectai.com>',
              to: email,
              subject: '🎉 Student Connections is Live!',
              html: launchEmailHtml,
            })
          )
        );

        // Update notified status for successful sends
        for (let j = 0; j < batch.length; j++) {
          const result = batchResults[j];
          const batchItem = batch[j];
          const { id, email }: { id: string; email: string } = batchItem;

          if (result.status === 'fulfilled') {
            try {
              // Mark as notified (only if Firebase is available)
              if (waitlistRef && typeof waitlistRef.doc === 'function') {
                await waitlistRef.doc(id).update({ notified: true, notifiedAt: new Date().toISOString() });
              }
              sentCount++;
              console.log(`✅ Notification sent to: ${email}`);
            } catch (updateError: any) {
              console.warn(`⚠️ Email sent but failed to update status for ${email}:`, updateError.message);
              sentCount++; // Still count as sent since email was delivered
            }
          } else {
            failedCount++;
            failedEmails.push(email);
            const errorReason = result.reason?.message || result.reason || 'Unknown error';
            console.error(`❌ Failed to send to ${email}:`, errorReason);
          }
        }
      } catch (batchError: any) {
        console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError?.message || batchError);
        failedCount += batch.length;
        batch.forEach(({ email }: { email: string }) => failedEmails.push(email));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${sentCount} subscribers`,
      total: emails.length,
      sent: sentCount,
      failed: failedCount,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (error: any) {
    console.error('Error notifying waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', message: error.message },
      { status: 500 }
    );
  }
}

