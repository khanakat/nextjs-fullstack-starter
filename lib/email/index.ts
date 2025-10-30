/**
 * Email System Exports
 * Central export point for all email-related functionality
 */

// Types and interfaces
export * from './types';

// Main service
export { EmailService, emailService } from './email-service';

// Providers
export { BaseEmailProvider } from './providers/base-provider';
export { ResendProvider } from './providers/resend-provider';
export { SendGridProvider } from './providers/sendgrid-provider';
export { MockProvider } from './providers/mock-provider';

// Re-export commonly used types for convenience
export type {
  EmailAddress,
  EmailOptions,
  EmailResult,
  EmailProvider,
  EmailTemplate,
  EmailConfig,
  EmailProviderType,
} from './types';