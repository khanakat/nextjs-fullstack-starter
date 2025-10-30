/**
 * Queue System Index
 * Main entry point for the queue system
 */

import { QueueManager, queueManager } from './queue-manager';
import { QueuePriority } from './config';

export { QueueManager } from './queue-manager';
export { queueConfig, QueuePriority, JobTypes, getRedisConfig } from './config';
export type { QueueConfig } from './config';
export type { QueueJobData, QueueJobOptions } from './queue-manager';

export {
  processEmailJob,
  processExportJob,
  processNotificationJob,
} from './workers';

export type {
  EmailJobPayload,
  BulkEmailJobPayload,
  TemplateEmailJobPayload,
  ExportJobPayload,
  ScheduledReportJobPayload,
  NotificationJobPayload,
  SystemAlertJobPayload,
  WelcomeNotificationJobPayload,
} from './workers';

// Create and export a singleton queue manager instance
let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
}

/**
 * Convert string priority to number
 */
function getPriorityNumber(priority: 'high' | 'normal' | 'low' = 'normal'): number {
  switch (priority) {
    case 'high':
      return QueuePriority.HIGH;
    case 'low':
      return QueuePriority.LOW;
    case 'normal':
    default:
      return QueuePriority.NORMAL;
  }
}

// Helper functions for common queue operations
export const QueueHelpers = {
  /**
   * Add email job to queue
   */
  async sendEmail(payload: import('./workers').EmailJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addEmailJob({
      type: 'send-email' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add bulk email job to queue
   */
  async sendBulkEmail(payload: import('./workers').BulkEmailJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addEmailJob({
      type: 'send-bulk-email' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add template email job to queue
   */
  async sendTemplateEmail(payload: import('./workers').TemplateEmailJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addEmailJob({
      type: 'send-template-email' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add export job to queue
   */
  async exportData(payload: import('./workers').ExportJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addExportJob({
      type: 'export-data' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add report generation job to queue
   */
  async generateReport(payload: import('./workers').ExportJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addReportJob({
      type: 'generate-report' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add scheduled report job to queue
   */
  async runScheduledReport(payload: import('./workers').ScheduledReportJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addReportJob({
      type: 'scheduled-report' as import('./config').JobType,
      payload,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add notification job to queue
   */
  async sendNotification(payload: import('./workers').NotificationJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    userId?: string;
    organizationId?: string;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addNotificationJob({
      type: 'user-notification' as import('./config').JobType,
      payload,
      userId: options?.userId,
      organizationId: options?.organizationId,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Add system alert job to queue
   */
  async sendSystemAlert(payload: import('./workers').SystemAlertJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addNotificationJob({
      type: 'system-notification' as import('./config').JobType,
      payload,
    }, {
      priority: getPriorityNumber(options?.priority || 'high'), // System alerts are high priority by default
      delay: options?.delay,
    });
  },

  /**
   * Add welcome notification job to queue
   */
  async sendWelcomeNotification(payload: import('./workers').WelcomeNotificationJobPayload, options?: {
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
  }) {
    const queueManager = getQueueManager();
    return await queueManager.addNotificationJob({
      type: 'user-notification' as import('./config').JobType,
      payload,
    }, {
      priority: getPriorityNumber(options?.priority),
      delay: options?.delay,
    });
  },

  /**
   * Get queue statistics
   */
  async getStats() {
    const queueManager = getQueueManager();
    return await queueManager.getAllQueueStats();
  },

  /**
   * Pause all queues
   */
  async pauseAll() {
    const queueManager = getQueueManager();
    const queues = ['email', 'export', 'report', 'notification'];
    const results = [];
    for (const queueName of queues) {
      try {
        await queueManager.pauseQueue(queueName);
        results.push({ queue: queueName, status: 'paused' });
      } catch (error) {
        results.push({ queue: queueName, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  },

  /**
   * Resume all queues
   */
  async resumeAll() {
    const queueManager = getQueueManager();
    const queues = ['email', 'export', 'report', 'notification'];
    const results = [];
    for (const queueName of queues) {
      try {
        await queueManager.resumeQueue(queueName);
        results.push({ queue: queueName, status: 'resumed' });
      } catch (error) {
        results.push({ queue: queueName, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  },

  /**
   * Clean old jobs from all queues
   */
  async cleanAll(olderThan: number = 24 * 60 * 60 * 1000) {
    const queueManager = getQueueManager();
    const queues = ['email', 'export', 'report', 'notification'];
    const results = [];
    for (const queueName of queues) {
      try {
        await queueManager.cleanQueue(queueName, olderThan);
        results.push({ queue: queueName, status: 'cleaned' });
      } catch (error) {
        results.push({ queue: queueName, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  },

  /**
   * Shutdown queue system gracefully
   */
  async shutdown() {
    const queueManager = getQueueManager();
    await queueManager.shutdown();
    queueManagerInstance = null;
  },
};