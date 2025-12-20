import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const { title, description, timestamp, url, userAgent, user } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const recipientEmail = 'courseconnect.noreply@gmail.com';
    const resend = getResend();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .header { background: #2563eb; padding: 32px; text-align: left; }
            .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
            .content { padding: 40px; }
            .meta { background: #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 32px; border: 1px solid #e2e8f0; }
            .meta-item { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .meta-value { font-size: 14px; color: #1e293b; font-weight: 500; margin-bottom: 16px; }
            .meta-value:last-child { margin-bottom: 0; }
            .message-label { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
            .message-box { font-size: 16px; color: #1e293b; white-space: pre-wrap; background: #ffffff; border-left: 4px solid #2563eb; padding: 4px 0 4px 20px; line-height: 1.8; }
            .footer { padding: 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COURSECONNECT • VISION 2026</h1>
            </div>
            <div class="content">
              <div class="meta">
                <div class="meta-item">User Identity</div>
                <div class="meta-value">
                  ${user ? `${user.name || 'Anonymous User'} (${user.email})` : 'Guest User (Not logged in)'}
                </div>

                <div class="meta-item">Subject</div>
                <div class="meta-value">${title}</div>
                
                <div class="meta-item">Source Page</div>
                <div class="meta-value" style="color: #2563eb; text-decoration: none;">${url}</div>
                
                <div class="meta-item">Received At</div>
                <div class="meta-value">${new Date(timestamp).toLocaleString()}</div>
              </div>
              
              <div class="message-label">Feedback Content</div>
              <div class="message-box">${description}</div>
            </div>
            <div class="footer">
              <p>Sent from the intelligence-driven feedback system.</p>
              <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} CourseConnect AI</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      console.log('📧 FEEDBACK EMAIL PREVIEW (RESEND_API_KEY not configured):');
      console.log('Title:', title);
      console.log('Description:', description);
      return NextResponse.json({
        success: true,
        message: 'Feedback received (logged to console)',
      });
    }

    await resend.emails.send({
      from: 'CourseConnect AI <noreply@courseconnectai.com>',
      to: recipientEmail,
      subject: `Feedback: ${title}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    );
  }
}

