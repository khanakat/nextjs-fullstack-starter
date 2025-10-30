/**
 * Base Email Provider
 * Abstract base class for all email providers
 */

import { EmailProvider, EmailOptions, EmailResult, EmailAddress } from '../types';

export abstract class BaseEmailProvider implements EmailProvider {
  abstract name: string;
  abstract isConfigured: boolean;

  /**
   * Send email using the provider
   */
  abstract sendEmail(options: EmailOptions): Promise<EmailResult>;

  /**
   * Validate provider configuration
   */
  abstract validateConfiguration(): Promise<boolean>;

  /**
   * Normalize email address to string format
   */
  protected normalizeEmailAddress(address: EmailAddress | EmailAddress[]): string | string[] {
    if (Array.isArray(address)) {
      return address.map(addr => this.formatEmailAddress(addr));
    }
    return this.formatEmailAddress(address);
  }

  /**
   * Format email address with name if provided
   */
  protected formatEmailAddress(address: EmailAddress): string {
    if (address.name) {
      return `${address.name} <${address.email}>`;
    }
    return address.email;
  }

  /**
   * Create standardized error result
   */
  protected createErrorResult(error: string, statusCode?: number): EmailResult {
    return {
      success: false,
      provider: this.name,
      error,
      statusCode,
      timestamp: new Date(),
    };
  }

  /**
   * Create standardized success result
   */
  protected createSuccessResult(messageId: string): EmailResult {
    return {
      success: true,
      messageId,
      provider: this.name,
      timestamp: new Date(),
    };
  }

  /**
   * Validate email options before sending
   */
  protected validateEmailOptions(options: EmailOptions): void {
    if (!options.to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    if (!options.html && !options.text && !options.template) {
      throw new Error('Email content (html, text, or template) is required');
    }

    // Validate email addresses
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const recipient of recipients) {
      if (!this.isValidEmail(recipient.email)) {
        throw new Error(`Invalid email address: ${recipient.email}`);
      }
    }
  }

  /**
   * Basic email validation
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get environment variable with fallback
   */
  protected getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key];
    if (!value && !fallback) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value || fallback || '';
  }

  /**
   * Log provider activity (can be overridden)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data) : '';
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message} ${logData}`);
  }
}