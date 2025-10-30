/**
 * Queue Configuration
 * Redis and BullMQ configuration settings
 */

import { ConnectionOptions } from 'bullmq';

export interface QueueConfig {
  redis: ConnectionOptions;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
  queues: {
    email: string;
    export: string;
    report: string;
    notification: string;
  };
}

/**
 * Get Redis connection configuration
 */
export function getRedisConfig(): ConnectionOptions {
  // Check if Redis URL is provided (for production)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return {
      url: redisUrl,
    };
  }

  // Default Redis configuration for development
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  };
}

/**
 * Default queue configuration
 */
export const queueConfig: QueueConfig = {
  redis: getRedisConfig(),
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
  queues: {
    email: 'email-queue',
    export: 'export-queue',
    report: 'report-queue',
    notification: 'notification-queue',
  },
};

/**
 * Queue priorities
 */
export const QueuePriority = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 20,
} as const;

/**
 * Job types for different queues
 */
export const JobTypes = {
  // Email jobs
  SEND_EMAIL: 'send-email',
  SEND_BULK_EMAIL: 'send-bulk-email',
  SEND_TEMPLATE_EMAIL: 'send-template-email',
  
  // Export jobs
  EXPORT_DATA: 'export-data',
  GENERATE_REPORT: 'generate-report',
  PROCESS_EXPORT: 'process-export',
  
  // Report jobs
  SCHEDULED_REPORT: 'scheduled-report',
  GENERATE_PDF_REPORT: 'generate-pdf-report',
  
  // Notification jobs
  SYSTEM_NOTIFICATION: 'system-notification',
  USER_NOTIFICATION: 'user-notification',
  SEND_WELCOME_EMAIL: 'send-welcome-email',
} as const;

export type JobType = typeof JobTypes[keyof typeof JobTypes];