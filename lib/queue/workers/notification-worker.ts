/**
 * Notification Queue Worker
 * Processes notification jobs from the queue
 */

import { Job } from 'bullmq';
import { JobTypes } from '../config';
import { QueueJobData } from '../queue-manager';
import { emailService } from '../../email/email-service';
import { EmailTemplates } from '../../email/templates';
import { db as prisma } from "../../db";

export interface NotificationJobPayload {
  type: 'email' | 'push' | 'sms';
  template: string;
  recipients: string[];
  data: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: string;
}

export interface SystemAlertJobPayload {
  alertType: 'maintenance' | 'security' | 'performance' | 'feature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  affectedUsers?: string[];
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface WelcomeNotificationJobPayload {
  userId: string;
  userEmail: string;
  userName: string;
}

/**
 * Process notification jobs
 */
export async function processNotificationJob(job: Job<QueueJobData>): Promise<any> {
  const { type, payload, userId, organizationId } = job.data;

  console.log(`[NotificationWorker] Processing job ${job.id} of type ${type}`);

  try {
    switch (type) {
      case JobTypes.USER_NOTIFICATION:
        return await processGenericNotification(payload as NotificationJobPayload, job);

      case JobTypes.SYSTEM_NOTIFICATION:
        return await processSystemAlert(payload as SystemAlertJobPayload, job);

      case JobTypes.SEND_WELCOME_EMAIL:
        return await processWelcomeNotification(payload as WelcomeNotificationJobPayload, job);

      default:
        throw new Error(`Unknown notification job type: ${type}`);
    }
  } catch (error) {
    console.error(`[NotificationWorker] Job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Process generic notification
 */
async function processGenericNotification(payload: NotificationJobPayload, job: Job): Promise<any> {
  const { type, template, recipients, data, priority } = payload;

  console.log(`[NotificationWorker] Processing generic notification:`, {
    type,
    template,
    recipientCount: recipients.length,
    priority,
  });

  await job.updateProgress(10);

  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    // Update progress
    const progress = 10 + Math.round((i / recipients.length) * 80);
    await job.updateProgress(progress);

    try {
      let result;

      switch (type) {
        case 'email':
          result = await sendEmailNotification(template, recipient, data);
          break;

        case 'push':
          result = await sendPushNotification(template, recipient, data);
          break;

        case 'sms':
          result = await sendSMSNotification(template, recipient, data);
          break;

        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      results.push({
        recipient,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });

    } catch (error) {
      failureCount++;
      results.push({
        recipient,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Small delay between notifications
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await job.updateProgress(100);

  console.log(`[NotificationWorker] Generic notification completed:`, {
    jobId: job.id,
    type,
    template,
    total: recipients.length,
    success: successCount,
    failed: failureCount,
  });

  return {
    success: true,
    type,
    template,
    total: recipients.length,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Process system alert
 */
async function processSystemAlert(payload: SystemAlertJobPayload, job: Job): Promise<any> {
  const { alertType, severity, title, message, affectedUsers, actionRequired, actionUrl } = payload;

  console.log(`[NotificationWorker] Processing system alert:`, {
    alertType,
    severity,
    title,
    affectedUserCount: affectedUsers?.length || 0,
  });

  await job.updateProgress(10);

  let recipients: string[] = [];

  if (affectedUsers && affectedUsers.length > 0) {
    // Send to specific users
    recipients = affectedUsers;
  } else {
    // Send to all users or admins based on severity
    const users = await getAlertRecipients(severity);
    recipients = users.map(user => user.email);
  }

  await job.updateProgress(30);

  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i];
    
    // Update progress
    const progress = 30 + Math.round((i / recipients.length) * 60);
    await job.updateProgress(progress);

    try {
      // Get user info for personalization
      const user = await prisma.user.findUnique({
        where: { email },
        select: { name: true },
      });

      // Map severity to expected values
      const mappedSeverity = severity === 'low' ? 'info' : 
                           severity === 'medium' ? 'warning' : 
                           severity as 'high' | 'critical';

      const result = await EmailTemplates.sendSystemAlertEmail(emailService, {
        firstName: user?.name || 'User',
        email,
        alertType,
        alertTitle: title,
        alertMessage: message,
        severity: mappedSeverity,
        timestamp: new Date(),
        actionRequired: actionRequired ? 'Action is required for this alert' : undefined,
        actionUrl,
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      results.push({
        recipient: email,
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
      });

    } catch (error) {
      failureCount++;
      results.push({
        recipient: email,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Small delay between emails
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  await job.updateProgress(100);

  console.log(`[NotificationWorker] System alert completed:`, {
    jobId: job.id,
    alertType,
    severity,
    total: recipients.length,
    success: successCount,
    failed: failureCount,
  });

  return {
    success: true,
    alertType,
    severity,
    title,
    total: recipients.length,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Process welcome notification
 */
async function processWelcomeNotification(payload: WelcomeNotificationJobPayload, job: Job): Promise<any> {
  const { userId, userEmail, userName } = payload;

  console.log(`[NotificationWorker] Processing welcome notification for user:`, {
    userId,
    userEmail,
    userName,
  });

  await job.updateProgress(20);

  try {
    // Get full user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await job.updateProgress(50);

    // Send welcome email
    const result = await EmailTemplates.sendWelcomeEmail(emailService, {
      firstName: user.name || userName,
      lastName: '',
      email: user.email,
    });

    await job.updateProgress(100);

    console.log(`[NotificationWorker] Welcome notification completed:`, {
      jobId: job.id,
      userId,
      success: result.success,
      messageId: result.messageId,
    });

    return {
      success: result.success,
      userId,
      email: user.email,
      messageId: result.messageId,
      provider: result.provider,
      error: result.error,
    };

  } catch (error) {
    console.error(`[NotificationWorker] Welcome notification failed:`, error);
    throw error;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(template: string, recipient: string, data: Record<string, any>): Promise<any> {
  try {
    // Get user info for personalization
    const user = await prisma.user.findUnique({
      where: { email: recipient },
      select: { name: true },
    });

    const templateData = {
      ...data,
      firstName: user?.name || data.firstName || 'User',
      lastName: data.lastName || '',
      email: recipient,
    };

    // Send based on template type
    switch (template) {
      case 'welcome':
        return await EmailTemplates.sendWelcomeEmail(emailService, {
          firstName: templateData.firstName,
          lastName: templateData.lastName,
          email: templateData.email,
        });

      case 'password-reset':
        return await EmailTemplates.sendPasswordResetEmail(emailService, {
          firstName: templateData.firstName,
          email: templateData.email,
          resetUrl: (templateData as any).resetUrl || '',
          expiresIn: (templateData as any).expiresIn,
        });

      case 'report-notification':
        return await EmailTemplates.sendReportNotificationEmail(emailService, templateData as any);

      case 'system-alert':
        return await EmailTemplates.sendSystemAlertEmail(emailService, templateData as any);

      default:
        // Send generic email
        return await emailService.sendEmail({
          to: { email: recipient },
          subject: data.subject || 'Notification',
          html: data.html || data.message || 'You have a new notification.',
          text: data.text || data.message || 'You have a new notification.',
          tags: ['notification', template],
        });
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification (placeholder)
 */
async function sendPushNotification(template: string, recipient: string, data: Record<string, any>): Promise<any> {
  // Placeholder for push notification implementation
  console.log(`[NotificationWorker] Push notification (placeholder):`, {
    template,
    recipient,
    data,
  });

  return {
    success: true,
    messageId: `push_${Date.now()}`,
    provider: 'push',
  };
}

/**
 * Send SMS notification (placeholder)
 */
async function sendSMSNotification(template: string, recipient: string, data: Record<string, any>): Promise<any> {
  // Placeholder for SMS notification implementation
  console.log(`[NotificationWorker] SMS notification (placeholder):`, {
    template,
    recipient,
    data,
  });

  return {
    success: true,
    messageId: `sms_${Date.now()}`,
    provider: 'sms',
  };
}

/**
 * Get alert recipients based on severity
 */
async function getAlertRecipients(severity: string): Promise<Array<{ email: string }>> {
  switch (severity) {
    case 'critical':
    case 'high':
      // Send to all admins and users
      return await prisma.user.findMany({
        select: { email: true },
        where: {
          // Add role-based filtering if you have roles
          // role: { in: ['admin', 'user'] }
        },
      });

    case 'medium':
      // Send to admins only
      return await prisma.user.findMany({
        select: { email: true },
        where: {
          // Add role-based filtering if you have roles
          // role: 'admin'
        },
        take: 100, // Limit for medium alerts
      });

    case 'low':
    default:
      // Send to admins only, limited
      return await prisma.user.findMany({
        select: { email: true },
        where: {
          // Add role-based filtering if you have roles
          // role: 'admin'
        },
        take: 10, // Very limited for low priority
      });
  }
}