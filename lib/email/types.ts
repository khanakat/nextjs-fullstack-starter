/**
 * Email System Types and Interfaces
 * Provides type definitions for the email service abstraction layer
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: EmailAddress;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  statusCode?: number;
  timestamp: Date;
}

export interface EmailProvider {
  name: string;
  isConfigured: boolean;
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  validateConfiguration(): Promise<boolean>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

export interface EmailQueueJob {
  id: string;
  type: 'single' | 'bulk' | 'template';
  options: EmailOptions;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  createdAt: Date;
  scheduledFor?: Date;
}

export interface EmailStats {
  sent: number;
  failed: number;
  pending: number;
  bounced: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export type EmailProviderType = 'resend' | 'sendgrid' | 'mock';

export interface EmailConfig {
  defaultProvider: EmailProviderType;
  fallbackProviders: EmailProviderType[];
  defaultFrom: EmailAddress;
  maxRetries: number;
  retryDelay: number;
  enableQueue: boolean;
  enableTracking: boolean;
  providers: {
    resend?: {
      apiKey: string;
      domain?: string;
    };
    sendgrid?: {
      apiKey: string;
      fromEmail?: string;
      fromName?: string;
    };
  };
}