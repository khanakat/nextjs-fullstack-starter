/**
 * Application Startup
 * Initializes all core services and systems
 */

import { logger } from './logger';
import { workerManager } from './queue/worker-init';
import { emailService } from './email/email-service';
import { queueManager } from './queue/queue-manager';

export class ApplicationStartup {
  private static instance: ApplicationStartup | null = null;
  private initialized = false;

  static getInstance(): ApplicationStartup {
    if (!ApplicationStartup.instance) {
      ApplicationStartup.instance = new ApplicationStartup();
    }
    return ApplicationStartup.instance;
  }

  /**
   * Initialize all application services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Application already initialized', 'startup');
      return;
    }

    try {
      logger.info('Starting application initialization', 'startup');

      // Initialize email service
      await this.initializeEmailService();

      // Initialize queue system (only in production or when explicitly requested)
      if (process.env.NODE_ENV === 'production' || process.env.INIT_WORKERS === 'true') {
        await this.initializeQueueSystem();
      } else {
        logger.info('Skipping queue system initialization in development', 'startup');
      }

      this.initialized = true;
      logger.info('Application initialization completed successfully', 'startup');

    } catch (error) {
      logger.error('Application initialization failed', 'startup', { error });
      throw error;
    }
  }

  /**
   * Initialize email service
   */
  private async initializeEmailService(): Promise<void> {
    try {
      logger.info('Initializing email service', 'startup');

      // Validate email providers
      const providerStatus = await emailService.validateProviders();
      const configuredProviders = Object.entries(providerStatus)
        .filter(([_, isValid]) => isValid)
        .map(([provider, _]) => provider);

      if (configuredProviders.length === 0) {
        logger.warn('No email providers configured', 'startup');
      } else {
        logger.info('Email service initialized', 'startup', { 
          configuredProviders 
        });
      }

    } catch (error) {
      logger.error('Failed to initialize email service', 'startup', { error });
      throw error;
    }
  }

  /**
   * Initialize queue system
   */
  private async initializeQueueSystem(): Promise<void> {
    try {
      logger.info('Initializing queue system', 'startup');

      // Check if Redis is available
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        logger.warn('Redis not configured, skipping queue system', 'startup');
        return;
      }

      // Initialize workers
      await workerManager.initialize();

      logger.info('Queue system initialized successfully', 'startup');

    } catch (error) {
      logger.error('Failed to initialize queue system', 'startup', { error });
      // Don't throw error for queue system in development
      if (process.env.NODE_ENV === 'production') {
        throw error;
      } else {
        logger.warn('Continuing without queue system in development', 'startup');
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      logger.info('Starting application shutdown', 'startup');

      // Shutdown queue workers
      if (workerManager.isInitialized) {
        await workerManager.shutdown();
      }

      this.initialized = false;
      logger.info('Application shutdown completed', 'startup');

    } catch (error) {
      logger.error('Error during application shutdown', 'startup', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services: Record<string, boolean> = {};
    let healthyCount = 0;
    let totalCount = 0;

    try {
      // Check email service
      totalCount++;
      const emailProviders = await emailService.validateProviders();
      const hasWorkingEmailProvider = Object.values(emailProviders).some(isValid => isValid);
      services.email = hasWorkingEmailProvider;
      if (hasWorkingEmailProvider) healthyCount++;

      // Check queue system (if initialized)
      if (workerManager.isInitialized) {
        totalCount++;
        try {
          const queueStats = await queueManager.getAllQueueStats();
          services.queue = Object.keys(queueStats).length > 0;
          if (services.queue) healthyCount++;
        } catch {
          services.queue = false;
        }
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === totalCount) {
        status = 'healthy';
      } else if (healthyCount > 0) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      logger.error('Health check failed', 'startup', { error });
      return {
        status: 'unhealthy',
        services,
        timestamp: new Date().toISOString(),
      };
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const applicationStartup = ApplicationStartup.getInstance();

// Auto-initialize if not in test environment
if (process.env.NODE_ENV !== 'test') {
  applicationStartup.initialize().catch(error => {
    logger.error('Failed to auto-initialize application', 'startup', { error });
  });
}

// Graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully', 'startup');
    await applicationStartup.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully', 'startup');
    await applicationStartup.shutdown();
    process.exit(0);
  });
}