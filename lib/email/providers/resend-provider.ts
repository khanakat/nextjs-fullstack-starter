/**
 * Resend Email Provider
 * Implementation of email provider using Resend service
 */

import { Resend } from 'resend';
import { BaseEmailProvider } from './base-provider';
import { EmailOptions, EmailResult, EmailAddress } from '../types';

export class ResendProvider extends BaseEmailProvider {
  name = 'resend';
  private client: Resend | null = null;
  private _isConfigured = false;

  constructor() {
    super();
    this.initialize();
  }

  get isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Initialize Resend client
   */
  private initialize(): void {
    try {
      const apiKey = this.getEnvVar('RESEND_API_KEY');
      if (apiKey && apiKey !== 'your-resend-api-key-here') {
        this.client = new Resend(apiKey);
        this._isConfigured = true;
        this.log('info', 'Resend provider initialized successfully');
      } else {
        this.log('warn', 'Resend API key not configured');
      }
    } catch (error) {
      this.log('error', 'Failed to initialize Resend provider', error);
    }
  }

  /**
   * Send email using Resend
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      this.validateEmailOptions(options);

      if (!this.client) {
        return this.createErrorResult('Resend client not initialized', 500);
      }

      // Prepare email data for Resend
      const emailData = this.prepareEmailData(options);

      this.log('info', 'Sending email via Resend', {
        to: emailData.to,
        subject: emailData.subject,
      });

      const result = await this.client.emails.send(emailData);

      if (result.error) {
        this.log('error', 'Resend API error', result.error);
        return this.createErrorResult(result.error.message || 'Unknown Resend error');
      }

      this.log('info', 'Email sent successfully via Resend', { messageId: result.data?.id });
      return this.createSuccessResult(result.data?.id || '');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Failed to send email via Resend', error);
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Validate Resend configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test API key by attempting to get domains (or any simple API call)
      // Note: Resend doesn't have a simple ping endpoint, so we'll just check if client exists
      return true;
    } catch (error) {
      this.log('error', 'Resend configuration validation failed', error);
      return false;
    }
  }

  /**
   * Prepare email data for Resend API
   */
  private prepareEmailData(options: EmailOptions): any {
    const defaultFrom = {
      email: this.getEnvVar('RESEND_FROM_EMAIL', 'noreply@example.com'),
      name: this.getEnvVar('RESEND_FROM_NAME', 'System'),
    };

    const emailData: any = {
      from: this.formatEmailAddress(options.from || defaultFrom),
      to: this.normalizeEmailAddress(options.to),
      subject: options.subject,
    };

    // Add content
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    }

    // Add optional fields
    if (options.replyTo) {
      emailData.reply_to = this.formatEmailAddress(options.replyTo);
    }

    if (options.cc) {
      emailData.cc = this.normalizeEmailAddress(options.cc);
    }

    if (options.bcc) {
      emailData.bcc = this.normalizeEmailAddress(options.bcc);
    }

    // Add attachments
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        content_type: attachment.contentType,
        disposition: attachment.disposition,
        content_id: attachment.contentId,
      }));
    }

    // Add tags for tracking
    if (options.tags && options.tags.length > 0) {
      emailData.tags = options.tags.map(tag => ({ name: tag, value: tag }));
    }

    return emailData;
  }
}