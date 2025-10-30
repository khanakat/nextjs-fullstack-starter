/**
 * Mock Email Provider
 * Implementation for testing and development environments
 */

import { BaseEmailProvider } from './base-provider';
import { EmailOptions, EmailResult } from '../types';

export class MockProvider extends BaseEmailProvider {
  name = 'mock';
  isConfigured = true;
  private sentEmails: Array<{ options: EmailOptions; result: EmailResult }> = [];

  /**
   * Send email (mock implementation)
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      this.validateEmailOptions(options);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate mock message ID
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = this.createSuccessResult(messageId);

      // Store sent email for testing purposes
      this.sentEmails.push({ options, result });

      this.log('info', 'Mock email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId,
      });

      // Log email content for development
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== MOCK EMAIL ===');
        console.log('To:', options.to);
        console.log('From:', options.from);
        console.log('Subject:', options.subject);
        if (options.html) {
          console.log('HTML Content:', options.html.substring(0, 200) + '...');
        }
        if (options.text) {
          console.log('Text Content:', options.text.substring(0, 200) + '...');
        }
        console.log('Message ID:', messageId);
        console.log('==================\n');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Mock email failed', error);
      return this.createErrorResult(errorMessage);
    }
  }

  /**
   * Validate configuration (always returns true for mock)
   */
  async validateConfiguration(): Promise<boolean> {
    return true;
  }

  /**
   * Get sent emails (for testing)
   */
  getSentEmails(): Array<{ options: EmailOptions; result: EmailResult }> {
    return [...this.sentEmails];
  }

  /**
   * Clear sent emails history
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  /**
   * Get last sent email (for testing)
   */
  getLastSentEmail(): { options: EmailOptions; result: EmailResult } | null {
    return this.sentEmails.length > 0 ? this.sentEmails[this.sentEmails.length - 1] : null;
  }

  /**
   * Simulate email failure (for testing)
   */
  async sendEmailWithFailure(options: EmailOptions, errorMessage = 'Simulated failure'): Promise<EmailResult> {
    this.log('warn', 'Simulating email failure', { errorMessage });
    return this.createErrorResult(errorMessage, 500);
  }

  /**
   * Get email statistics (mock data)
   */
  getStats() {
    return {
      sent: this.sentEmails.length,
      failed: 0,
      pending: 0,
      bounced: 0,
      delivered: this.sentEmails.length,
      opened: Math.floor(this.sentEmails.length * 0.7), // Mock 70% open rate
      clicked: Math.floor(this.sentEmails.length * 0.3), // Mock 30% click rate
    };
  }
}