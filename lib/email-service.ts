import {
  sendEmail,
  sendBulkEmail,
  EmailType,
  EmailPriority,
  EmailProvider,
} from "@/lib/email";
import { logger } from "@/lib/logger";
import {
  welcomeEmailTemplate,
  WelcomeEmailData,
} from "@/lib/email-templates/welcome";
import {
  passwordResetEmailTemplate,
  PasswordResetEmailData,
} from "@/lib/email-templates/password-reset";
import {
  emailVerificationEmailTemplate,
} from "@/lib/email-templates/email-verification";
import {
  usageAlertEmailTemplate,
  UsageAlertEmailData,
} from "@/lib/email-templates/usage-alert";
import {
  scheduledReportEmailTemplate,
  ScheduledReportEmailData,
} from "@/lib/email-templates/scheduled-report";
import { AuditService } from "@/lib/services/audit";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FullStack Starter";

export class EmailService {
  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    to: string,
    name: string,
    priority: EmailPriority = "normal",
  ) {
    try {
      const template = welcomeEmailTemplate({
        userName: name,
        userEmail: to,
        appName: APP_NAME,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      } as WelcomeEmailData);

      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: "welcome",
        priority,
        metadata: { userName: name },
      });
    } catch (error) {
      logger.error("Failed to send welcome email", {
        to,
        name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
    priority: EmailPriority = "high",
  ) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      const template = passwordResetEmailTemplate({
        name,
        resetUrl,
      } as PasswordResetEmailData);

      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: "password-reset",
        priority,
        metadata: { userName: name, resetToken },
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        to,
        name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(
    to: string,
    name: string,
    verificationToken: string,
    priority: EmailPriority = "high",
  ) {
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
      const template = emailVerificationEmailTemplate({
        name,
        verificationUrl,
        expiresIn: "24 hours",
      });

      return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: "email-verification",
        priority,
        metadata: { userName: name, verificationToken },
      });
    } catch (error) {
      logger.error("Failed to send email verification", {
        to,
        name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send notification email (legacy method)
   */
  static async sendNotificationLegacy(
    to: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string,
    priority: EmailPriority = "normal",
  ) {
    try {
      const subject = title || `${APP_NAME} Notification`;
      const html = `<h1>${title}</h1><p>${message}</p>${actionUrl ? `<p><a href="${actionUrl}">${actionText || "View details"}</a></p>` : ""}`;
      const text = `${title}\n\n${message}${actionUrl ? `\n\n${actionText || "View details"}: ${actionUrl}` : ""}`;

      return await sendEmail({
        to,
        subject,
        html,
        text,
        type: "notification",
        priority,
        metadata: { title, actionUrl },
      });
    } catch (error) {
      logger.error("Failed to send notification email", {
        to,
        title,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send report email
   */
  static async sendReportEmail(
    to: string,
    reportName: string,
    reportType: string,
    summary: string,
    downloadUrl?: string,
    priority: EmailPriority = "normal",
  ) {
    try {
      const generatedAt = new Date().toLocaleString();
      const subject = `${reportName} Report - ${reportType}`;
      const html = `<h1>${reportName} Report</h1><p>Type: ${reportType}</p><p>Generated: ${generatedAt}</p><p>${summary}</p>${downloadUrl ? `<p><a href="${downloadUrl}">Download Report</a></p>` : ""}`;
      const text = `${reportName} Report\n\nType: ${reportType}\nGenerated: ${generatedAt}\n\n${summary}${downloadUrl ? `\n\nDownload: ${downloadUrl}` : ""}`;

      return await sendEmail({
        to,
        subject,
        html,
        text,
        type: "report",
        priority,
        metadata: { reportName, reportType, downloadUrl },
      });
    } catch (error) {
      logger.error("Failed to send report email", {
        to,
        reportName,
        reportType,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send system alert email
   */
  static async sendSystemAlert(
    to: string | string[],
    alertType: "warning" | "error" | "info",
    title: string,
    message: string,
    details?: string,
    actionRequired: boolean = false,
    actionUrl?: string,
    priority: EmailPriority = "high",
  ) {
    try {
      const subject = `${alertType.toUpperCase()}: ${title}`;
      const html = `<h1>${alertType.toUpperCase()}: ${title}</h1><p>${message}</p>${details ? `<p><strong>Details:</strong> ${details}</p>` : ""}${actionRequired && actionUrl ? `<p><a href="${actionUrl}">Action Required</a></p>` : ""}`;
      const text = `${alertType.toUpperCase()}: ${title}\n\n${message}${details ? `\n\nDetails: ${details}` : ""}${actionRequired && actionUrl ? `\n\nAction Required: ${actionUrl}` : ""}`;

      return await sendEmail({
        to,
        subject,
        html,
        text,
        type: "system-alert",
        priority: alertType === "error" ? "critical" : priority,
        metadata: { alertType, title, actionRequired },
      });
    } catch (error) {
      logger.error("Failed to send system alert email", {
        to: Array.isArray(to) ? to.length + " recipients" : to,
        alertType,
        title,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send bulk email (newsletters, announcements, etc.)
   */
  static async sendBulkEmail(
    recipients: string[],
    subject: string,
    html: string,
    text?: string,
    priority: EmailPriority = "low",
    batchSize: number = 50,
  ) {
    try {
      logger.info("Bulk email send initiated", `Recipients: ${recipients.length}, Subject: ${subject}, Priority: ${priority}, Batch Size: ${batchSize}`);

      return await sendBulkEmail({
        recipients,
        subject,
        html,
        text,
        type: "newsletter",
        priority,
        batchSize,
        metadata: { subject, recipientCount: recipients.length },
      });
    } catch (error) {
      logger.error("Failed to send bulk email", {
        recipientCount: recipients.length,
        subject,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send custom email with full control
   */
  static async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
    priority: EmailPriority = "normal",
    useQueue: boolean = true,
  ) {
    try {
      return await sendEmail({
        to,
        subject,
        html,
        text,
        type: "notification",
        priority,
        useQueue,
        metadata: { subject, custom: true },
      });
    } catch (error) {
      logger.error("Failed to send custom email", {
        to: Array.isArray(to) ? to.length + " recipients" : to,
        subject,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send scheduled report notification
   */
  static async sendScheduledReportNotification(
    to: string,
    reportName: string,
    schedule: string,
    nextRun: Date,
    priority: EmailPriority = "low",
  ) {
    try {
      const subject = `Scheduled Report: ${reportName}`;
      const html = `<h1>Scheduled Report: ${reportName}</h1><p>Your scheduled report "${reportName}" is configured to run ${schedule}. The next execution is scheduled for ${nextRun.toLocaleString()}.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reports">View Reports</a></p>`;
      const text = `Scheduled Report: ${reportName}\n\nYour scheduled report "${reportName}" is configured to run ${schedule}. The next execution is scheduled for ${nextRun.toLocaleString()}.\n\nView Reports: ${process.env.NEXT_PUBLIC_APP_URL}/reports`;

      return await sendEmail({
        to,
        subject,
        html,
        text,
        type: "notification",
        priority,
        metadata: { reportName, schedule, nextRun: nextRun.toISOString() },
      });
    } catch (error) {
      logger.error("Failed to send scheduled report notification", {
        to,
        reportName,
        schedule,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send usage alert email
   */
  static async sendUsageAlert(
    to: string,
    data: UsageAlertEmailData,
    options: {
      priority?: EmailPriority;
      provider?: string;
      organizationId?: string;
    } = {},
  ): Promise<void> {
    try {
      const template = usageAlertEmailTemplate(data);

      await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: "usage-alert",
        priority: options.priority || "high",
        provider: options.provider as EmailProvider,
        metadata: {
          organizationId: options.organizationId,
          alertType: data.alertType,
          severity: data.severity,
        },
      });

      // Log the email sending
      if (options.organizationId) {
        await AuditService.log({
          action: "email.usage_alert.sent",
          resource: "email",
          resourceId: to,
          organizationId: options.organizationId,
          metadata: {
            alertType: data.alertType,
            severity: data.severity,
            currentValue: data.currentValue,
            threshold: data.threshold,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send usage alert email:", error);
      throw error;
    }
  }

  /**
   * Send scheduled report email
   */
  static async sendScheduledReport(
    to: string,
    data: ScheduledReportEmailData,
    options: {
      priority?: EmailPriority;
      provider?: string;
      organizationId?: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>; 
    } = {},
  ): Promise<void> {
    try {
      const template = scheduledReportEmailTemplate(data);

      await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: "scheduled-report",
        priority: options.priority || "normal",
        provider: options.provider as EmailProvider,
        attachments: options.attachments,
        metadata: {
          organizationId: options.organizationId,
          reportType: data.reportType,
          reportPeriod: data.reportPeriod,
        },
      });

      // Log the email sending
      if (options.organizationId) {
        await AuditService.log({
          action: "email.scheduled_report.sent",
          resource: "email",
          resourceId: to,
          organizationId: options.organizationId,
          metadata: {
            reportType: data.reportType,
            reportPeriod: data.reportPeriod,
            attachmentCount: options.attachments?.length || 0,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send scheduled report email:", error);
      throw error;
    }
  }

  /**
   * Send notification email (generic)
   */
  static async sendNotification(
    to: string,
    subject: string,
    content: {
      html: string;
      text: string;
    },
    options: {
      priority?: EmailPriority;
      provider?: string;
      organizationId?: string;
      type?: EmailType;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    try {
      await sendEmail({
        to,
        subject,
        html: content.html,
        text: content.text,
        type: options.type || "notification",
        priority: options.priority || "normal",
        provider: options.provider as EmailProvider,
        metadata: {
          organizationId: options.organizationId,
          ...options.metadata,
        },
      });

      // Log the email sending
      if (options.organizationId) {
        await AuditService.log({
          action: "email.notification.sent",
          resource: "email",
          resourceId: to,
          organizationId: options.organizationId,
          metadata: {
            subject,
            type: options.type || "notification",
            ...options.metadata,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send notification email:", error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(
    recipients: Array<{
      email: string;
      data?: Record<string, any>;
    }>,
    template: {
      subject: string;
      html: string;
      text: string;
    },
    options: {
      priority?: EmailPriority;
      provider?: string;
      organizationId?: string;
      type?: EmailType;
      batchSize?: number;
    } = {},
  ): Promise<void> {
    try {
      const batchSize = options.batchSize || 50;
      const batches = [];

      // Split recipients into batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      // Process batches sequentially to avoid overwhelming email providers
      for (const batch of batches) {
        const promises = batch.map((recipient) =>
          this.sendNotification(
            recipient.email,
            template.subject,
            {
              html: template.html,
              text: template.text,
            },
            {
              ...options,
              metadata: {
                ...options,
                recipientData: recipient.data,
              },
            },
          ),
        );

        await Promise.allSettled(promises);

        // Small delay between batches to be respectful to email providers
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Log bulk email operation
      if (options.organizationId) {
        await AuditService.log({
          action: "email.bulk_notification.sent",
          resource: "email",
          resourceId: "bulk",
          organizationId: options.organizationId,
          metadata: {
            recipientCount: recipients.length,
            batchCount: batches.length,
            subject: template.subject,
            type: options.type || "notification",
          },
        });
      }
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      throw error;
    }
  }
}
