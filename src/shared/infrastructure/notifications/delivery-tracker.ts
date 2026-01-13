/**
 * Notification Delivery Tracker
 * Tracks delivery attempts, status, and metrics for notifications
 */

import { ChannelType } from '../../domain/notifications/value-objects/notification-channel';

export interface DeliveryRecord {
  notificationId: string;
  channel: ChannelType;
  delivered: boolean;
  deliveredAt?: Date;
  attempts: DeliveryAttemptRecord[];
  messageId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAttemptRecord {
  attemptedAt: Date;
  success: boolean;
  error?: string;
  retryCount: number;
  deliveryTime?: number; // milliseconds
}

export interface DeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  deliveryRate: number;
  byChannel: Map<ChannelType, ChannelStats>;
}

export interface ChannelStats {
  total: number;
  successful: number;
  failed: number;
  averageDeliveryTime: number;
}

/**
 * In-Memory Delivery Tracker
 * For production, this should be replaced with database persistence
 */
export class InMemoryDeliveryTracker {
  private deliveries: Map<string, DeliveryRecord[]> = new Map();
  private readonly maxRecordsPerNotification = 100;

  /**
   * Record a delivery attempt
   */
  recordDeliveryAttempt(
    notificationId: string,
    channel: ChannelType,
    success: boolean,
    options: {
      messageId?: string;
      error?: string;
      deliveryTime?: number;
    } = {}
  ): void {
    const key = this.getKey(notificationId, channel);
    let record = this.getRecord(notificationId, channel);

    if (!record) {
      record = {
        notificationId,
        channel,
        delivered: false,
        attempts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const attempt: DeliveryAttemptRecord = {
      attemptedAt: new Date(),
      success,
      error: options.error,
      retryCount: record.attempts.length,
      deliveryTime: options.deliveryTime,
    };

    record.attempts.push(attempt);
    record.updatedAt = new Date();

    if (success) {
      record.delivered = true;
      record.deliveredAt = new Date();
      record.messageId = options.messageId;
      record.error = undefined;
    } else {
      record.error = options.error;
    }

    // Store the record
    if (!this.deliveries.has(notificationId)) {
      this.deliveries.set(notificationId, []);
    }

    const records = this.deliveries.get(notificationId)!;
    const existingIndex = records.findIndex(r => r.channel === channel);

    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    // Limit records per notification
    if (records.length > this.maxRecordsPerNotification) {
      records.shift();
    }
  }

  /**
   * Get delivery status for a notification and channel
   */
  getDeliveryStatus(
    notificationId: string,
    channel: ChannelType
  ): {
    delivered: boolean;
    deliveredAt?: Date;
    attempts: number;
    lastAttempt?: Date;
    error?: string;
  } {
    const record = this.getRecord(notificationId, channel);

    if (!record) {
      return {
        delivered: false,
        attempts: 0,
      };
    }

    const lastAttempt = record.attempts[record.attempts.length - 1];

    return {
      delivered: record.delivered,
      deliveredAt: record.deliveredAt,
      attempts: record.attempts.length,
      lastAttempt: lastAttempt?.attemptedAt,
      error: record.error,
    };
  }

  /**
   * Get all delivery records for a notification
   */
  getNotificationDeliveries(notificationId: string): DeliveryRecord[] {
    return this.deliveries.get(notificationId) || [];
  }

  /**
   * Check if notification has pending deliveries
   */
  hasPendingDeliveries(notificationId: string): boolean {
    const records = this.deliveries.get(notificationId) || [];
    return records.some(r => !r.delivered);
  }

  /**
   * Cancel pending deliveries
   */
  cancelPendingDeliveries(
    notificationId: string,
    channels?: ChannelType[]
  ): number {
    const records = this.deliveries.get(notificationId) || [];
    let cancelledCount = 0;

    for (const record of records) {
      if (!record.delivered) {
        if (!channels || channels.includes(record.channel)) {
          record.error = 'Cancelled';
          record.updatedAt = new Date();
          cancelledCount++;
        }
      }
    }

    return cancelledCount;
  }

  /**
   * Get delivery statistics for a time period
   */
  getDeliveryStats(
    startDate: Date,
    endDate: Date,
    channel?: ChannelType
  ): DeliveryStats {
    const stats: DeliveryStats = {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      deliveryRate: 0,
      byChannel: new Map(),
    };

    let totalDeliveryTime = 0;
    let deliveryTimeCount = 0;

    // Iterate through all records
    for (const records of this.deliveries.values()) {
      for (const record of records) {
        // Filter by channel if specified
        if (channel && record.channel !== channel) {
          continue;
        }

        // Filter by date range
        if (record.createdAt < startDate || record.createdAt > endDate) {
          continue;
        }

        stats.totalDeliveries++;

        if (record.delivered) {
          stats.successfulDeliveries++;
        } else if (record.error) {
          stats.failedDeliveries++;
        }

        // Calculate delivery time
        for (const attempt of record.attempts) {
          if (attempt.deliveryTime) {
            totalDeliveryTime += attempt.deliveryTime;
            deliveryTimeCount++;
          }
        }

        // Update channel stats
        if (!stats.byChannel.has(record.channel)) {
          stats.byChannel.set(record.channel, {
            total: 0,
            successful: 0,
            failed: 0,
            averageDeliveryTime: 0,
          });
        }

        const channelStats = stats.byChannel.get(record.channel)!;
        channelStats.total++;

        if (record.delivered) {
          channelStats.successful++;
        } else if (record.error) {
          channelStats.failed++;
        }
      }
    }

    // Calculate averages
    if (deliveryTimeCount > 0) {
      stats.averageDeliveryTime = totalDeliveryTime / deliveryTimeCount;
    }

    if (stats.totalDeliveries > 0) {
      stats.deliveryRate = stats.successfulDeliveries / stats.totalDeliveries;
    }

    // Calculate channel averages
    for (const [channelType, channelStats] of stats.byChannel) {
      if (channelStats.total > 0) {
        // Calculate average delivery time for this channel
        let channelDeliveryTime = 0;
        let channelDeliveryCount = 0;

        for (const records of this.deliveries.values()) {
          for (const record of records) {
            if (record.channel === channelType) {
              for (const attempt of record.attempts) {
                if (attempt.deliveryTime) {
                  channelDeliveryTime += attempt.deliveryTime;
                  channelDeliveryCount++;
                }
              }
            }
          }
        }

        if (channelDeliveryCount > 0) {
          channelStats.averageDeliveryTime = channelDeliveryTime / channelDeliveryCount;
        }
      }
    }

    return stats;
  }

  /**
   * Clear old records (for memory management)
   */
  clearOldRecords(olderThan: Date): number {
    let clearedCount = 0;

    for (const [notificationId, records] of this.deliveries) {
      const filteredRecords = records.filter(r => r.createdAt >= olderThan);
      clearedCount += records.length - filteredRecords.length;

      if (filteredRecords.length === 0) {
        this.deliveries.delete(notificationId);
      } else {
        this.deliveries.set(notificationId, filteredRecords);
      }
    }

    return clearedCount;
  }

  /**
   * Clear all records (for testing)
   */
  clearAll(): void {
    this.deliveries.clear();
  }

  /**
   * Get total number of tracked notifications
   */
  getTotalTrackedNotifications(): number {
    return this.deliveries.size;
  }

  /**
   * Get total number of delivery records
   */
  getTotalDeliveryRecords(): number {
    let total = 0;
    for (const records of this.deliveries.values()) {
      total += records.length;
    }
    return total;
  }

  /**
   * Get a specific delivery record
   */
  private getRecord(notificationId: string, channel: ChannelType): DeliveryRecord | undefined {
    const records = this.deliveries.get(notificationId) || [];
    return records.find(r => r.channel === channel);
  }

  /**
   * Generate a unique key for notification + channel
   */
  private getKey(notificationId: string, channel: ChannelType): string {
    return `${notificationId}:${channel}`;
  }
}

/**
 * Singleton instance
 */
let trackerInstance: InMemoryDeliveryTracker | null = null;

/**
 * Get or create the delivery tracker instance
 */
export function getDeliveryTracker(): InMemoryDeliveryTracker {
  if (!trackerInstance) {
    trackerInstance = new InMemoryDeliveryTracker();
  }
  return trackerInstance;
}

/**
 * Set a custom delivery tracker (for testing)
 */
export function setDeliveryTracker(tracker: InMemoryDeliveryTracker): void {
  trackerInstance = tracker;
}

/**
 * Reset the delivery tracker (for testing)
 */
export function resetDeliveryTracker(): void {
  trackerInstance = null;
}
