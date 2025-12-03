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
    const { name, email, subject, category, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const recipientEmail = 'courseconnect.noreply@gmail.com';
    const categoryText = category || 'General Inquiry';
    const subjectText = subject || `${categoryText} - Contact Form`;

    const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
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
                              <span style="background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; letter-spacing: 0.025em;">NEW INQUIRY</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                      <td style="padding: 40px;">
                        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">${subject || 'New Support Request'}</h1>
                        
                        <!-- Key Value Grid -->
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 16px;" width="30%">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">User</p>
                              </td>
                              <td style="padding-bottom: 16px;">
                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 16px;" width="30%">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
                              </td>
                              <td style="padding-bottom: 16px;">
                                <a href="mailto:${email}" style="margin: 0; font-size: 14px; font-weight: 500; color: #2563eb; text-decoration: none;">${email}</a>
                              </td>
                            </tr>
                            <tr>
                              <td width="30%">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Topic</p>
                              </td>
                              <td>
                                <span style="display: inline-block; padding: 4px 0; font-size: 14px; font-weight: 500; color: #111827; text-transform: capitalize;">${categoryText}</span>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Message Bubble -->
                        <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Message Content</p>
                        <div style="background-color: #ffffff; border-left: 3px solid #2563eb; padding: 0 0 0 16px; margin-bottom: 32px;">
                          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
                        </div>

                        <!-- Primary Action -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="mailto:${email}?subject=Re: ${subject || 'Support Request'}&body=Hi ${name.split(' ')[0]},%0D%0A%0D%0A" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; transition: background-color 0.2s;">Reply to ${name.split(' ')[0]}</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Minimal Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                          Received via CourseConnect AI Contact Form
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
      console.log('📧 CONTACT FORM EMAIL PREVIEW (RESEND_API_KEY not configured):');
      console.log('To:', recipientEmail);
      console.log('From:', email);
      console.log('Subject:', `Contact Form: ${subjectText}`);
      console.log('Category:', categoryText);
      console.log('Message:', message);
      // Return success even if email isn't configured (for development)
      return NextResponse.json({
        success: true,
        message: 'Message received (email not configured, logged to console)',
      });
    }

    // Send email via Resend
    await resend.emails.send({
      from: 'CourseConnect AI <noreply@courseconnectai.com>',
      to: recipientEmail,
      replyTo: email,
      subject: `Contact Form: ${subjectText}`,
      html: emailHtml,
    });

    console.log(`✅ Contact form email sent to ${recipientEmail} from ${email}`);

    // --- AUTO-CONFIRMATION EMAIL TO USER ---
    const confirmationHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Message Received</title>
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
                        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em;">We received your message!</h1>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Hi ${name.split(' ')[0]},
                        </p>
                        <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          Thanks for reaching out to CourseConnect AI. We've received your inquiry and our team will get back to you shortly.
                        </p>
                        
                        <!-- Message Summary -->
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Your Message</p>
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151; font-style: italic;">"${message}"</p>
                        </div>

                        <!-- Helpful Links -->
                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #111827;">In the meantime, you might find this helpful:</p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                          <a href="https://www.courseconnectai.com/contact#faq" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">→ View Frequently Asked Questions</a>
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
        to: email, // Send to the user
        subject: `We received your message: ${subject || 'Support Request'}`,
        html: confirmationHtml,
      });
      console.log(`✅ Confirmation email sent to user: ${email}`);
    } catch (confirmationError) {
      console.error('Failed to send confirmation email:', confirmationError);
      // Don't fail the request if confirmation fails, just log it
    }
    // ---------------------------------------

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

