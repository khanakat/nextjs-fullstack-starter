import { sendEmail } from '@/lib/email';
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  emailVerificationTemplate,
  notificationEmailTemplate,
} from '@/lib/email-templates';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FullStack Starter';

export class EmailService {
  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(to: string, name: string) {
    try {
      const template = welcomeEmailTemplate({ name, appName: APP_NAME });
      
      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(to: string, name: string, resetToken: string) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      const template = passwordResetEmailTemplate({ 
        name, 
        resetUrl, 
        appName: APP_NAME 
      });
      
      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  static async sendEmailVerification(to: string, name: string, verificationToken: string) {
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
      const template = emailVerificationTemplate({ 
        name, 
        verificationUrl, 
        appName: APP_NAME 
      });
      
      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Send notification email
   */
  static async sendNotification(
    to: string, 
    title: string, 
    message: string, 
    actionUrl?: string, 
    actionText?: string
  ) {
    try {
      const template = notificationEmailTemplate({ 
        title, 
        message, 
        actionUrl, 
        actionText, 
        appName: APP_NAME 
      });
      
      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails (for newsletters, announcements, etc.)
   */
  static async sendBulkEmail(
    recipients: string[], 
    subject: string, 
    html: string, 
    text?: string
  ) {
    try {
      const batchSize = 50; // Resend's batch limit
      const batches = [];
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      const results = [];
      for (const batch of batches) {
        const result = await sendEmail({
          to: batch,
          subject,
          html,
          text,
        });
        results.push(result);
        
        // Add delay between batches to avoid rate limiting
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to send bulk email:', error);
      throw error;
    }
  }

  /**
   * Send custom email with template
   */
  static async sendCustomEmail(
    to: string | string[], 
    subject: string, 
    html: string, 
    text?: string
  ) {
    try {
      return await sendEmail({
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send custom email:', error);
      throw error;
    }
  }
}