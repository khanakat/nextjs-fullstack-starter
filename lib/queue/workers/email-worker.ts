/**
 * Email Queue Worker
 * Processes email jobs from the queue
 */

import { Job } from 'bullmq';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email/email-service';
import { EmailTemplates } from '@/lib/email/templates';
import { ErrorHandler, EmailError, ErrorPatterns } from '@/lib/error-handling';
import { JobTypes } from '../config';
import { QueueJobData } from '../queue-manager';

export interface EmailJobPayload {
  to: string | { email: string; name?: string };
  from?: { email: string; name?: string };
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: any[];
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
}

export interface BulkEmailJobPayload {
  emails: EmailJobPayload[];
  batchSize?: number;
}

export interface TemplateEmailJobPayload {
  templateName: string;
  templateData: Record<string, any>;
  recipients: Array<{ email: string; name?: string; data?: Record<string, any> }>;
}

/**
 * Process email jobs
 */
export async function processEmailJob(job: Job<QueueJobData>): Promise<void> {
  const { data } = job;
  const payload = data.payload;
  
  const context = {
    operation: 'processEmailJob',
    metadata: {
      jobId: job.id,
      jobType: data.type,
      to: payload?.to || 'unknown',
    },
  };
  
  logger.info("Processing email job", "email-worker", context.metadata);

  const result = await ErrorHandler.safeExecute(
    async () => {
      await job.updateProgress(10);

      let emailResult;
      
      switch (data.type) {
        case JobTypes.SEND_EMAIL:
          emailResult = await processSingleEmail(payload, job);
          break;
        case JobTypes.SEND_BULK_EMAIL:
          emailResult = await processBulkEmail(payload, job);
          break;
        case JobTypes.SEND_TEMPLATE_EMAIL:
          emailResult = await processTemplateEmail(payload, job);
          break;
        default:
          emailResult = await processSingleEmail(payload, job);
          break;
      }

      await job.updateProgress(100);
      return emailResult;
    },
    context,
    ErrorPatterns.backgroundJob
  );

  if (result.success) {
    logger.info("Email job completed successfully", "email-worker", {
      ...context.metadata,
      result: result.data,
    });
  } else {
    logger.error("Email job failed after all retries", "email-worker", {
      ...context.metadata,
      error: result.error?.message,
      errorCode: result.error?.code,
    });
    
    throw result.error || new EmailError('Email job failed');
  }
}

/**
 * Process single email
 */
async function processSingleEmail(payload: EmailJobPayload, job: Job): Promise<any> {
  const emailOptions = {
    to: typeof payload.to === 'string' 
      ? { email: payload.to } 
      : payload.to,
    from: payload.from,
    subject: payload.subject || 'No Subject',
    html: payload.html,
    text: payload.text,
    attachments: payload.attachments,
    priority: payload.priority,
    tags: payload.tags,
  };

  const result = await emailService.sendEmail(emailOptions);

  if (!result.success) {
    throw new Error(`Email sending failed: ${result.error}`);
  }

  console.log(`[EmailWorker] Single email sent successfully:`, {
    jobId: job.id,
    messageId: result.messageId,
    provider: result.provider,
  });

  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
    timestamp: result.timestamp,
  };
}

/**
 * Process bulk email
 */
async function processBulkEmail(payload: BulkEmailJobPayload, job: Job): Promise<any> {
  const { emails, batchSize = 10 } = payload;
  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`[EmailWorker] Processing bulk email with ${emails.length} emails`);

  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Update job progress
    const progress = Math.round((i / emails.length) * 100);
    await job.updateProgress(progress);

    // Process batch
    const batchPromises = batch.map(async (emailData, index) => {
      try {
        const emailOptions = {
          to: typeof emailData.to === 'string' 
            ? { email: emailData.to } 
            : emailData.to,
          from: emailData.from,
          subject: emailData.subject || 'No Subject',
          html: emailData.html,
          text: emailData.text,
          attachments: emailData.attachments,
          priority: emailData.priority,
          tags: emailData.tags,
        };

        const result = await emailService.sendEmail(emailOptions);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }

        return {
          index: i + index,
          success: result.success,
          messageId: result.messageId,
          provider: result.provider,
          error: result.error,
        };

      } catch (error) {
        failureCount++;
        return {
          index: i + index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming providers
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await job.updateProgress(100);

  console.log(`[EmailWorker] Bulk email completed:`, {
    jobId: job.id,
    total: emails.length,
    success: successCount,
    failed: failureCount,
  });

  return {
    success: true,
    total: emails.length,
    successCount,
    failureCount,
    results,
  };
}

/**
 * Process template email
 */
async function processTemplateEmail(payload: TemplateEmailJobPayload, job: Job): Promise<any> {
  const { templateName, templateData, recipients } = payload;
  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`[EmailWorker] Processing template email '${templateName}' for ${recipients.length} recipients`);

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    // Update job progress
    const progress = Math.round((i / recipients.length) * 100);
    await job.updateProgress(progress);

    try {
      // Merge template data with recipient-specific data
      const mergedData = {
        ...templateData,
        ...recipient.data,
        firstName: recipient.name || recipient.data?.firstName || 'User',
        lastName: recipient.data?.lastName || '',
        email: recipient.email,
      };

      // Send template email based on template name
      let result;
      switch (templateName) {
        case 'welcome':
          result = await EmailTemplates.sendWelcomeEmail(emailService, {
            firstName: mergedData.firstName,
            lastName: mergedData.lastName || '',
            email: recipient.email,
          });
          break;

        case 'password-reset':
          result = await EmailTemplates.sendPasswordResetEmail(emailService, {
            firstName: mergedData.firstName,
            email: recipient.email,
            resetUrl: (mergedData as any).resetUrl,
            expiresIn: (mergedData as any).expiresIn,
          });
          break;

        case 'report-notification':
          result = await EmailTemplates.sendReportNotificationEmail(emailService, {
            firstName: mergedData.firstName,
            email: recipient.email,
            reportName: (mergedData as any).reportName,
            reportType: (mergedData as any).reportType,
            downloadUrl: (mergedData as any).downloadUrl,
            generatedAt: (mergedData as any).generatedAt,
            expiresAt: (mergedData as any).expiresAt,
            reportDescription: (mergedData as any).reportDescription,
            fileSize: (mergedData as any).fileSize,
          });
          break;

        case 'system-alert':
          result = await EmailTemplates.sendSystemAlertEmail(emailService, {
            firstName: mergedData.firstName,
            email: recipient.email,
            alertType: (mergedData as any).alertType,
            alertTitle: (mergedData as any).alertTitle,
            alertMessage: (mergedData as any).alertMessage,
            severity: (mergedData as any).severity,
            timestamp: (mergedData as any).timestamp,
            actionRequired: (mergedData as any).actionRequired,
            actionUrl: (mergedData as any).actionUrl,
          });
          break;

        default:
          throw new Error(`Unknown template: ${templateName}`);
      }

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      results.push({
        recipient: recipient.email,
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
      });

    } catch (error) {
      failureCount++;
      results.push({
        recipient: recipient.email,
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

  console.log(`[EmailWorker] Template email completed:`, {
    jobId: job.id,
    template: templateName,
    total: recipients.length,
    success: successCount,
    failed: failureCount,
  });

  return {
    success: true,
    template: templateName,
    total: recipients.length,
    successCount,
    failureCount,
    results,
  };
}