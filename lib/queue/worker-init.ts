/**
 * Queue Worker Initialization
 * Sets up and starts all queue workers
 */

import { queueManager } from './queue-manager';
import { processEmailJob, processExportJob, processNotificationJob } from './workers';
import { logger } from '@/lib/logger';

export class WorkerManager {
  private static instance: WorkerManager | null = null;
  private initialized = false;

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  /**
   * Initialize all queue workers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Workers already initialized', 'worker-manager');
      return;
    }

    try {
      logger.info('Initializing queue workers', 'worker-manager');

      // Wait for queue manager to be ready
      if (!queueManager.initialized) {
        logger.info('Waiting for queue manager to initialize', 'worker-manager');
        // Give queue manager time to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Create email worker
      const emailWorker = queueManager.createWorker(
        'email',
        processEmailJob,
        parseInt(process.env.QUEUE_CONCURRENCY || '5')
      );

      if (emailWorker) {
        logger.info('Email worker created successfully', 'worker-manager');
      }

      // Create export worker
      const exportWorker = queueManager.createWorker(
        'export',
        processExportJob,
        parseInt(process.env.QUEUE_CONCURRENCY || '5')
      );

      if (exportWorker) {
        logger.info('Export worker created successfully', 'worker-manager');
      }

      // Create notification worker
      const notificationWorker = queueManager.createWorker(
        'notification',
        processNotificationJob,
        parseInt(process.env.QUEUE_CONCURRENCY || '5')
      );

      if (notificationWorker) {
        logger.info('Notification worker created successfully', 'worker-manager');
      }

      this.initialized = true;
      logger.info('All queue workers initialized successfully', 'worker-manager');

    } catch (error) {
      logger.error('Failed to initialize queue workers', 'worker-manager', { error });
      throw error;
    }
  }

  /**
   * Shutdown all workers gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      logger.info('Shutting down queue workers', 'worker-manager');
      await queueManager.shutdown();
      this.initialized = false;
      logger.info('Queue workers shut down successfully', 'worker-manager');
    } catch (error) {
      logger.error('Error shutting down queue workers', 'worker-manager', { error });
      throw error;
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const workerManager = WorkerManager.getInstance();

// Auto-initialize in production or when explicitly requested
if (process.env.NODE_ENV === 'production' || process.env.INIT_WORKERS === 'true') {
  workerManager.initialize().catch(error => {
    logger.error('Failed to auto-initialize workers', 'worker-manager', { error });
  });
}