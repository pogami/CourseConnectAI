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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const recipientEmail = 'courseconnect.noreply@gmail.com';
    const emailLower = email.toLowerCase().trim();

    // Store email in Firebase waitlist collection
    try {
      if (db && typeof db.collection === 'function') {
        // Check if email already exists
        const waitlistRef = db.collection('waitlist');
        const existingEmail = await waitlistRef.where('email', '==', emailLower).limit(1).get();
        
        if (!existingEmail.empty) {
          return NextResponse.json({
            success: true,
            message: 'You\'re already on the list!',
            alreadyExists: true,
          });
        }

        // Add to waitlist
        await waitlistRef.add({
          email: emailLower,
          createdAt: new Date().toISOString(),
          feature: 'student-connections',
          notified: false,
        });
        console.log('✅ Email stored in waitlist:', emailLower);
      } else {
        console.warn('⚠️ Firebase not configured - email not stored in database');
      }
    } catch (dbError: any) {
      console.error('Error storing email in database:', dbError);
      // Continue even if database storage fails
    }

    const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Waitlist Signup</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f3f4f6; color: #111827;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Modern Header -->
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
                              <span style="background-color: #10b981; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; letter-spacing: 0.025em;">WAITLIST SIGNUP</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">New Waitlist Signup</h1>
                        
                        <!-- Key Value Grid -->
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 16px;" width="30%">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
                              </td>
                              <td style="padding-bottom: 16px;">
                                <a href="mailto:${emailLower}" style="margin: 0; font-size: 14px; font-weight: 500; color: #2563eb; text-decoration: none;">${emailLower}</a>
                              </td>
                            </tr>
                            <tr>
                              <td width="30%">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Feature</p>
                              </td>
                              <td>
                                <span style="display: inline-block; padding: 4px 0; font-size: 14px; font-weight: 500; color: #111827;">Student Connections</span>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Primary Action -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                This user wants to be notified when the student connections feature launches.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Minimal Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                          Received via CourseConnect AI Waitlist Form
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

    // Check if Resend is configured
    const resend = getResend();
    if (!resend) {
      console.log('📧 WAITLIST EMAIL PREVIEW (RESEND_API_KEY not configured):');
      console.log('To:', recipientEmail);
      console.log('Email:', emailLower);
      console.log('Feature: Student Connections');
      // Return success even if email isn't configured (for development)
      return NextResponse.json({
        success: true,
        message: 'You\'re on the list! We\'ll notify you when this feature launches.',
      });
    }

    // Send email via Resend
    await resend.emails.send({
      from: 'CourseConnect AI <noreply@courseconnectai.com>',
      to: recipientEmail,
      reply_to: emailLower,
      subject: `Waitlist Signup: Student Connections Feature`,
      html: emailHtml,
    });

    console.log(`✅ Waitlist signup email sent to ${recipientEmail} from ${emailLower}`);

    // --- AUTO-CONFIRMATION EMAIL TO USER ---
    const confirmationHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You're on the Waitlist!</title>
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
                              <div style="display: flex; align-items: center; gap: 24px;">
                                <img src="https://www.courseconnectai.com/apple-touch-icon.png" alt="CourseConnect AI" style="width: 32px; height: 32px; border-radius: 8px;" />
                                <span style="font-weight: 600; font-size: 16px; color: #111827; letter-spacing: -0.025em;">CourseConnect AI</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">You're on the list! 🎉</h1>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Thanks for your interest in CourseConnect AI's student connections feature!
                        </p>
                        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          We'll notify you the moment this feature launches. In the meantime, keep uploading your syllabi and getting the most out of your AI study companion.
                        </p>
                        
                        <!-- Feature Preview -->
                        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; border: 1px solid #86efac; margin-bottom: 32px;">
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">What to Expect</p>
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #166534;">
                            Connect with students in your course or similar classes at your school and other institutions. Form study groups and study smarter together.
                          </p>
                        </div>

                        <!-- Helpful Links -->
                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #111827;">In the meantime:</p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                          <a href="https://www.courseconnectai.com" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">→ Upload your syllabus and get started</a>
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

    try {
      await resend.emails.send({
        from: 'CourseConnect AI <noreply@courseconnectai.com>',
        to: emailLower,
        subject: `You're on the waitlist! 🎉`,
        html: confirmationHtml,
      });
      console.log(`✅ Confirmation email sent to user: ${emailLower}`);
    } catch (confirmationError) {
      console.error('Failed to send confirmation email:', confirmationError);
      // Don't fail the request if confirmation fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'You\'re on the list! We\'ll notify you when this feature launches.',
    });
  } catch (error: any) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Failed to add email to waitlist. Please try again later.' },
      { status: 500 }
    );
  }
}
