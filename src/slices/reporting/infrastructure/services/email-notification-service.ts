import { INotificationService } from '../../domain/services/notification-service';

/**
 * Email notification service for sending report notifications
 */
export class EmailNotificationService implements INotificationService {
  constructor(
    private readonly emailProvider: any, // Could be SendGrid, AWS SES, etc.
    private readonly fromEmail: string,
    private readonly baseUrl: string
  ) {}

  async sendReportReadyNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    recipientName?: string
  ): Promise<void> {
    const subject = `Report Ready: ${reportTitle}`;
    const htmlContent = this.generateReportReadyEmailTemplate(
      reportTitle,
      reportUrl,
      recipientName
    );

    await this.sendWithHandling(recipientEmail, () =>
      this.sendEmail(recipientEmail, subject, htmlContent)
    );
  }

  async sendScheduledReportNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    scheduleName: string,
    recipientName?: string
  ): Promise<void> {
    const subject = `Scheduled Report: ${reportTitle}`;
    const htmlContent = this.generateScheduledReportEmailTemplate(
      reportTitle,
      reportUrl,
      scheduleName,
      recipientName
    );

    await this.sendWithHandling(recipientEmail, () =>
      this.sendEmail(recipientEmail, subject, htmlContent)
    );
  }

  async sendReportFailureNotification(
    recipientEmail: string,
    reportTitle: string,
    errorMessage: string,
    recipientName?: string
  ): Promise<void> {
    const subject = `Report Generation Failed: ${reportTitle}`;
    const htmlContent = this.generateReportFailureEmailTemplate(
      reportTitle,
      errorMessage,
      recipientName
    );

    await this.sendWithHandling(recipientEmail, () =>
      this.sendEmail(recipientEmail, subject, htmlContent)
    );
  }

  async sendReportSharedNotification(
    recipientEmail: string,
    reportTitle: string,
    reportUrl: string,
    sharedByName: string,
    recipientName?: string,
    message?: string
  ): Promise<void> {
    const subject = `Report Shared: ${reportTitle}`;
    const htmlContent = this.generateReportSharedEmailTemplate(
      reportTitle,
      reportUrl,
      sharedByName,
      recipientName,
      message
    );

    await this.sendWithHandling(recipientEmail, () =>
      this.sendEmail(recipientEmail, subject, htmlContent)
    );
  }

  async sendBulkNotification(
    recipients: string[],
    subject: string,
    content: string
  ): Promise<void> {
    const promises = recipients.map(email =>
      this.sendWithHandling(email, () => this.sendEmail(email, subject, content))
    );

    await Promise.all(promises);
  }

  /**
   * Wraps email sending to provide consistent logging and error shaping for tests.
   */
  private async sendWithHandling(to: string, operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error instanceof Error ? error : new Error(String(error)));
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      if (message === 'Network timeout') {
        throw new Error('Network timeout');
      }
      if (message) {
        throw new Error(`Failed to send email notification: ${message}`);
      }
      throw new Error('Failed to send email notification: Unknown error');
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    try {
      // Mock implementation - replace with actual email service
      console.log(`Sending email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${htmlContent}`);

      // Example with SendGrid:
      // await this.emailProvider.send({
      //   to,
      //   from: this.fromEmail,
      //   subject,
      //   html: htmlContent,
      // });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Failed to send email notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateReportReadyEmailTemplate(
    reportTitle: string,
    reportUrl: string,
    recipientName?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Report Ready</h1>
          </div>
          <div class="content">
            ${recipientName ? `<p>Hi ${recipientName},</p>` : '<p>Hello,</p>'}
            <p>Your report "<strong>${reportTitle}</strong>" has been generated and is ready for viewing.</p>
            <p>Click the button below to view your report:</p>
            <a href="${reportUrl}" class="button">View Report</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${reportUrl}">${reportUrl}</a></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateScheduledReportEmailTemplate(
    reportTitle: string,
    reportUrl: string,
    scheduleName: string,
    recipientName?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Scheduled Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Scheduled Report</h1>
          </div>
          <div class="content">
            ${recipientName ? `<p>Hi ${recipientName},</p>` : '<p>Hello,</p>'}
            <p>Your scheduled report "<strong>${reportTitle}</strong>" from the schedule "<strong>${scheduleName}</strong>" has been generated.</p>
            <p>Click the button below to view your report:</p>
            <a href="${reportUrl}" class="button">View Report</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${reportUrl}">${reportUrl}</a></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateReportFailureEmailTemplate(
    reportTitle: string,
    errorMessage: string,
    recipientName?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Generation Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Report Generation Failed</h1>
          </div>
          <div class="content">
            ${recipientName ? `<p>Hi ${recipientName},</p>` : '<p>Hello,</p>'}
            <p>Unfortunately, the generation of your report "<strong>${reportTitle}</strong>" has failed.</p>
            <div class="error">
              <strong>Error:</strong> ${errorMessage}
            </div>
            <p>Please try generating the report again. If the problem persists, please contact support.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateReportSharedEmailTemplate(
    reportTitle: string,
    reportUrl: string,
    sharedByName: string,
    recipientName?: string,
    message?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Shared</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .message { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Report Shared</h1>
          </div>
          <div class="content">
            ${recipientName ? `<p>Hi ${recipientName},</p>` : '<p>Hello,</p>'}
            <p><strong>${sharedByName}</strong> has shared a report with you: "<strong>${reportTitle}</strong>"</p>
            ${message ? `<div class="message"><strong>Message:</strong> ${message}</div>` : ''}
            <p>Click the button below to view the shared report:</p>
            <a href="${reportUrl}" class="button">View Report</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${reportUrl}">${reportUrl}</a></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
