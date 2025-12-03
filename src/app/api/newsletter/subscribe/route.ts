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
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in Firestore
    const subscribersRef = db.collection('newsletter_subscribers');
    const existingSubscriber = await subscribersRef
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existingSubscriber.empty) {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    // Add to Firestore
    const subscriberData = {
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      status: 'active',
      source: 'website_footer',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    await subscribersRef.add(subscriberData);

    // Send welcome email via Resend
    try {
      const resend = getResend();
      if (!resend) {
        console.warn('RESEND_API_KEY not configured, skipping welcome email');
      } else {
        await resend.emails.send({
        from: 'CourseConnect AI <noreply@courseconnectai.com>',
        to: normalizedEmail,
        subject: '🎓 Welcome to CourseConnect AI Newsletter!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to CourseConnect AI</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Welcome to CourseConnect AI!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi there! 👋</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thanks for subscribing to the CourseConnect AI newsletter! We're excited to have you join our community of students who are transforming their learning experience with AI.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                  <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">📬 What to expect:</h2>
                  <ul style="margin: 15px 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Study Tips & Tricks</strong> - Proven methods to boost your grades</li>
                    <li style="margin-bottom: 10px;"><strong>AI Learning Updates</strong> - Latest features and improvements</li>
                    <li style="margin-bottom: 10px;"><strong>Success Stories</strong> - How students are acing their courses</li>
                    <li style="margin-bottom: 10px;"><strong>Exclusive Offers</strong> - Early access to new features</li>
                  </ul>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Ready to get started? Upload your syllabus and let AI help you ace your courses!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com'}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                    Get Started Free →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  You're receiving this email because you subscribed to CourseConnect AI newsletter.<br>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com'}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com'}" style="color: #667eea; text-decoration: none;">Visit Website</a>
                </p>
                
                <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
                  © 2025 CourseConnect AI. All rights reserved.<br>
                  Made with ❤️ for students in Atlanta, Georgia
                </p>
              </div>
            </body>
          </html>
        `,
        });

        console.log(`✅ Welcome email sent to ${normalizedEmail}`);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Check your email for a welcome message.',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}

