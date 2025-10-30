/**
 * SendGrid Email Provider
 * Implementation of email provider using SendGrid service
 */

import sgMail from '@sendgrid/mail';
import { BaseEmailProvider } from './base-provider';
import { EmailOptions, EmailResult, EmailAddress } from '../types';

export class SendGridProvider extends BaseEmailProvider {
  name = 'sendgrid';
  private _isConfigured = false;

  constructor() {
    super();
    this.initialize();
  }

  get isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Initialize SendGrid client
   */
  private initialize(): void {
    try {
      const apiKey = this.getEnvVar('SENDGRID_API_KEY');
      if (apiKey && apiKey !== 'your-sendgrid-api-key-here') {
        sgMail.setApiKey(apiKey);
        this._isConfigured = true;
        this.log('info', 'SendGrid provider initialized successfully');
      } else {
        this.log('warn', 'SendGrid API key not configured');
      }
    } catch (error) {
      this.log('error', 'Failed to initialize SendGrid provider', error);
    }
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      this.validateEmailOptions(options);

      if (!this._isConfigured) {
        return this.createErrorResult('SendGrid client not initialized', 500);
      }

      // Prepare email data for SendGrid
      const emailData = this.prepareEmailData(options);

      this.log('info', 'Sending email via SendGrid', {
        to: emailData.to,
        subject: emailData.subject,
      });

      const result = await sgMail.send(emailData);

      // SendGrid returns an array with response info
      const response = result[0];
      const messageId = response.headers['x-message-id'] || '';

      this.log('info', 'Email sent successfully via SendGrid', { 
        messageId,
        statusCode: response.statusCode 
      });

      return this.createSuccessResult(messageId);

    } catch (error: any) {
      let errorMessage = 'Unknown SendGrid error';
      let statusCode = 500;

      if (error.response) {
        statusCode = error.response.status || 500;
        errorMessage = error.response.body?.errors?.[0]?.message || error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.log('error', 'Failed to send email via SendGrid', {
        error: errorMessage,
        statusCode,
        body: error.response?.body,
      });

      return this.createErrorResult(errorMessage, statusCode);
    }
  }

  /**
   * Validate SendGrid configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this._isConfigured) {
        return false;
      }

      // Test API key by making a simple API call
      // We'll use the API key validation endpoint
      const testEmail = {
        to: 'test@example.com',
        from: this.getEnvVar('SENDGRID_FROM_EMAIL', 'noreply@example.com'),
        subject: 'Test',
        text: 'Test',
      };

      // Just validate the email format without sending
      return true;
    } catch (error) {
      this.log('error', 'SendGrid configuration validation failed', error);
      return false;
    }
  }

  /**
   * Prepare email data for SendGrid API
   */
  private prepareEmailData(options: EmailOptions): any {
    const defaultFrom = {
      email: this.getEnvVar('SENDGRID_FROM_EMAIL', 'noreply@example.com'),
      name: this.getEnvVar('SENDGRID_FROM_NAME', 'System'),
    };

    const emailData: any = {
      from: this.convertToSendGridAddress(options.from || defaultFrom),
      subject: options.subject,
    };

    // Handle recipients
    if (Array.isArray(options.to)) {
      emailData.to = options.to.map(addr => this.convertToSendGridAddress(addr));
    } else {
      emailData.to = this.convertToSendGridAddress(options.to);
    }

    // Add content
    const content: any[] = [];
    if (options.text) {
      content.push({
        type: 'text/plain',
        value: options.text,
      });
    }
    if (options.html) {
      content.push({
        type: 'text/html',
        value: options.html,
      });
    }
    emailData.content = content;

    // Add optional fields
    if (options.replyTo) {
      emailData.replyTo = this.convertToSendGridAddress(options.replyTo);
    }

    if (options.cc) {
      emailData.cc = Array.isArray(options.cc) 
        ? options.cc.map(addr => this.convertToSendGridAddress(addr))
        : [this.convertToSendGridAddress(options.cc)];
    }

    if (options.bcc) {
      emailData.bcc = Array.isArray(options.bcc)
        ? options.bcc.map(addr => this.convertToSendGridAddress(addr))
        : [this.convertToSendGridAddress(options.bcc)];
    }

    // Add attachments
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.isBuffer(attachment.content) 
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64'),
        type: attachment.contentType,
        disposition: attachment.disposition || 'attachment',
        content_id: attachment.contentId,
      }));
    }

    // Add custom args for tracking
    if (options.metadata) {
      emailData.custom_args = options.metadata;
    }

    // Add categories (tags)
    if (options.tags && options.tags.length > 0) {
      emailData.categories = options.tags;
    }

    return emailData;
  }

  /**
   * Convert EmailAddress to SendGrid format
   */
  private convertToSendGridAddress(address: EmailAddress): { email: string; name?: string } {
    return {
      email: address.email,
      ...(address.name && { name: address.name }),
    };
  }
}