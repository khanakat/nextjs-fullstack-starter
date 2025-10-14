import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { EmailService } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }

    const { type, data } = await req.json();
    const userEmail = user.emailAddresses[0].emailAddress;
    const userName = user.firstName || user.username || 'User';

    let result;

    switch (type) {
      case 'welcome':
        result = await EmailService.sendWelcomeEmail(userEmail, userName);
        break;

      case 'password-reset':
        // In a real app, you'd generate a secure token
        const resetToken = 'demo-reset-token-' + Date.now();
        result = await EmailService.sendPasswordResetEmail(userEmail, userName, resetToken);
        break;

      case 'email-verification':
        // In a real app, you'd generate a secure token
        const verificationToken = 'demo-verification-token-' + Date.now();
        result = await EmailService.sendEmailVerification(userEmail, userName, verificationToken);
        break;

      case 'notification':
        result = await EmailService.sendNotification(
          userEmail,
          data.title || 'Test Notification',
          data.message || 'This is a test notification from your app.',
          data.actionUrl,
          data.actionText
        );
        break;

      case 'custom':
        result = await EmailService.sendCustomEmail(
          userEmail,
          data.subject || 'Test Email',
          data.html || '<h1>Test Email</h1><p>This is a test email.</p>',
          data.text
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' }, 
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}