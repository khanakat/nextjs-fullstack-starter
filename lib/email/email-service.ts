/**
 * Email Service
 * Main service that manages email providers with fallback support
 */

import { EmailProvider, EmailOptions, EmailResult, EmailConfig, EmailProviderType } from './types';
import { logger } from "@/lib/logger";
import { ResendProvider } from './providers/resend-provider';
import { SendGridProvider } from './providers/sendgrid-provider';
import { MockProvider } from './providers/mock-provider';
import { TemplateManager } from "./templates/template-manager";
import { ErrorHandler, EmailError, withRetry } from "@/lib/error-handling";

export class EmailService {
  private providers: Map<EmailProviderType, EmailProvider> = new Map();
  private config: EmailConfig;
  private templateManager: TemplateManager;

  constructor(config?: Partial<EmailConfig>) {
    this.config = this.buildConfig(config);
    this.templateManager = new TemplateManager();
    this.initializeProviders();
  }

  /**
   * Build configuration with defaults
   */
  private buildConfig(config?: Partial<EmailConfig>): EmailConfig {
    return {
      defaultProvider: config?.defaultProvider || 'resend',
      fallbackProviders: config?.fallbackProviders || ['sendgrid', 'mock'],
      defaultFrom: config?.defaultFrom || {
        email: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
        name: process.env.DEFAULT_FROM_NAME || 'System',
      },
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      enableQueue: config?.enableQueue ?? true,
      enableTracking: config?.enableTracking ?? true,
      providers: config?.providers || {},
    };
  }

  /**
   * Initialize all email providers
   */
  private initializeProviders(): void {
    // Initialize providers
    this.providers.set('resend', new ResendProvider());
    this.providers.set('sendgrid', new SendGridProvider());
    this.providers.set('mock', new MockProvider());

    // Log configured providers
    const configuredProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured)
      .map(([type, _]) => type);

    console.log('[EmailService] Configured providers:', configuredProviders);
  }

  /**
   * Get primary provider
   */
  private get primaryProvider(): EmailProvider {
    const provider = this.providers.get(this.config.defaultProvider);
    if (!provider) {
      throw new EmailError(`Primary provider ${this.config.defaultProvider} not found`);
    }
    return provider;
  }

  /**
   * Get fallback provider
   */
  private get fallbackProvider(): EmailProvider | null {
    for (const providerType of this.config.fallbackProviders) {
      const provider = this.providers.get(providerType);
      if (provider && provider.isConfigured) {
        return provider;
      }
    }
    return null;
  }

  /**
   * Send an email using the primary provider with fallback
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    
    logger.info("Sending email", "email", {
      to: Array.isArray(options.to) ? options.to.length : 1,
      subject: options.subject,
      provider: this.primaryProvider.name,
      hasTemplate: !!options.template,
    });

    // Process template if provided
    if (options.template && options.templateData) {
      try {
        const processedTemplate = await this.templateManager.render(
          options.template,
          options.templateData
        );
        
        // For now, use the processed template as HTML content
        // In a full implementation, you would parse the template to extract subject, html, and text
        options.html = processedTemplate;
        if (!options.subject) {
          options.subject = `Email from ${options.template} template`;
        }
      } catch (error) {
        throw new EmailError(`Template processing failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Try primary provider with retry
    const primaryResult = await withRetry.email(
      () => this.primaryProvider.sendEmail(options),
      `email-primary-${this.primaryProvider.name}`
    );

    if (primaryResult.success) {
      logger.info("Email sent successfully", "email", {
        provider: this.primaryProvider.name,
        messageId: primaryResult.result?.messageId,
        duration: Date.now() - startTime,
      });
      
      return primaryResult.result!;
    }

    logger.warn("Primary email provider failed", "email", {
      provider: this.primaryProvider.name,
      error: primaryResult.error?.message,
      attempts: primaryResult.attempts,
    });

    // Try fallback provider if available
    if (this.fallbackProvider) {
      logger.info("Attempting fallback email provider", "email", {
        provider: this.fallbackProvider.name,
      });

      const fallbackResult = await withRetry.email(
        () => this.fallbackProvider!.sendEmail(options),
        `email-fallback-${this.fallbackProvider.name}`
      );

      if (fallbackResult.success) {
        logger.info("Email sent via fallback provider", "email", {
          provider: this.fallbackProvider.name,
          messageId: fallbackResult.result?.messageId,
          duration: Date.now() - startTime,
        });
        
        return fallbackResult.result!;
      }

      logger.error("Fallback email provider also failed", "email", {
        provider: this.fallbackProvider.name,
        error: fallbackResult.error?.message,
        attempts: fallbackResult.attempts,
      });
    }

    // Both providers failed
    const errorMessage = `All email providers failed. Primary: ${primaryResult.error?.message}${
      this.fallbackProvider ? `, Fallback: ${this.fallbackProvider.name} failed` : ''
    }`;
    
    logger.error("All email providers failed", "email", {
      primaryProvider: this.primaryProvider.name,
      fallbackProvider: this.fallbackProvider?.name,
      primaryError: primaryResult.error?.message,
      duration: Date.now() - startTime,
    });
    
    throw new EmailError(errorMessage);
  }

  /**
   * Send email with retry logic
   */
  private async sendWithRetry(provider: EmailProvider, options: EmailOptions): Promise<EmailResult> {
    let lastResult: EmailResult | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await provider.sendEmail(options);
        
        if (result.success) {
          return result;
        }

        lastResult = result;

        // Don't retry on certain errors (like invalid email format)
        if (this.shouldNotRetry(result)) {
          break;
        }

        if (attempt < this.config.maxRetries) {
          console.log(`[EmailService] Retrying ${provider.name} in ${this.config.retryDelay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }

      } catch (error) {
        lastResult = {
          success: false,
          provider: provider.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        };
      }
    }

    return lastResult || {
      success: false,
      provider: provider.name,
      error: 'Max retries exceeded',
      timestamp: new Date(),
    };
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(result: EmailResult): boolean {
    if (!result.error) return false;

    const nonRetryableErrors = [
      'invalid email',
      'malformed email',
      'invalid recipient',
      'authentication failed',
      'api key invalid',
    ];

    return nonRetryableErrors.some(error => 
      result.error!.toLowerCase().includes(error)
    );
  }

  /**
   * Get ordered list of providers to try
   */
  private getProvidersToTry(): EmailProviderType[] {
    const providers: EmailProviderType[] = [this.config.defaultProvider];
    
    // Add fallback providers
    for (const fallback of this.config.fallbackProviders) {
      if (fallback !== this.config.defaultProvider) {
        providers.push(fallback);
      }
    }

    return providers;
  }

  /**
   * Validate all provider configurations
   */
  async validateProviders(): Promise<Record<EmailProviderType, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [type, provider] of this.providers) {
      try {
        results[type] = await provider.validateConfiguration();
      } catch (error) {
        console.error(`[EmailService] Failed to validate ${type}:`, error);
        results[type] = false;
      }
    }

    return results as Record<EmailProviderType, boolean>;
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Record<EmailProviderType, { configured: boolean; name: string }> {
    const status: Record<string, { configured: boolean; name: string }> = {};

    for (const [type, provider] of this.providers) {
      status[type] = {
        configured: provider.isConfigured,
        name: provider.name,
      };
    }

    return status as Record<EmailProviderType, { configured: boolean; name: string }>;
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Process emails in batches to avoid overwhelming providers
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.sendEmail(email));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Get email statistics from mock provider (for testing)
   */
  getStats() {
    const mockProvider = this.providers.get('mock') as MockProvider;
    return mockProvider?.getStats() || {
      sent: 0,
      failed: 0,
      pending: 0,
      bounced: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailService = new EmailService();