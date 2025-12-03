import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// VAPID keys for push notifications
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY'
};

// Configure web-push only if valid keys are provided
if (vapidKeys.publicKey !== 'YOUR_VAPID_PUBLIC_KEY' && vapidKeys.privateKey !== 'YOUR_VAPID_PRIVATE_KEY') {
  try {
    webpush.setVapidDetails(
      'mailto:courseconnect.noreply@gmail.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (error) {
    console.warn('Failed to configure VAPID keys:', error);
  }
}

// Import push subscriptions from the subscribe endpoint
// In production, this would be a shared database
let pushSubscriptions: any[] = [];

// Function to send push notification to all subscribers
async function sendPushNotification(notificationData: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{action: string; title: string; icon?: string}>;
}) {
  const payload = JSON.stringify({
    title: notificationData.title,
    body: notificationData.body,
    icon: notificationData.icon || '/favicon.ico',
    badge: notificationData.badge || '/favicon.ico',
    tag: notificationData.tag || 'courseconnect-update',
    data: {
      url: '/changelog',
      timestamp: Date.now(),
      ...notificationData.data
    },
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View Update',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  });

  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Send to all subscriptions
  for (const subscription of pushSubscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);
      results.sent++;
      console.log('Push notification sent to:', subscription.endpoint);
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to ${subscription.endpoint}: ${error}`);
      console.error('Push notification failed:', error);
    }
  }

  return results;
}

// POST endpoint to send push notifications
export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json();

    if (!notificationData.title || !notificationData.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get current subscriptions (in production, this would be from database)
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/push-notifications/subscribe`);
      const data = await response.json();
      pushSubscriptions = data.subscriptions || [];
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      pushSubscriptions = [];
    }

    if (pushSubscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No push subscriptions found', sent: 0, failed: 0 },
        { status: 200 }
      );
    }

    const results = await sendPushNotification(notificationData);

    console.log(`Push notification campaign completed: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      message: 'Push notifications sent successfully',
      ...results
    }, { status: 200 });

  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send push notifications' },
      { status: 500 }
    );
  }
}

// GET endpoint to get notification statistics
export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com'}/api/push-notifications/subscribe`);
    const data = await response.json();
    
    return NextResponse.json({
      totalSubscriptions: data.totalSubscriptions || 0,
      message: 'Push notification statistics retrieved'
    });
  } catch (error) {
    return NextResponse.json({
      totalSubscriptions: 0,
      error: 'Failed to get statistics'
    });
  }
}
