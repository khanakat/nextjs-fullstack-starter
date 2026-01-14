import { WebhookEvent } from '../entities/webhook-event';
import { WebhookEventId } from '../value-objects/webhook-event-id';

/**
 * Webhook Event Repository Interface
 */
export interface IWebhookEventRepository {
  /**
   * Save webhook event (create or update)
   */
  save(event: WebhookEvent): Promise<void>;

  /**
   * Find event by ID
   */
  findById(id: WebhookEventId): Promise<WebhookEvent | null>;

  /**
   * Find events by webhook ID
   */
  findByWebhookId(webhookId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{ events: WebhookEvent[]; total: number }>;

  /**
   * Find events by integration ID
   */
  findByIntegrationId(integrationId: string, options?: {
    limit?: number;
    offset?: number;
    action?: string;
    status?: string;
  }): Promise<{ events: WebhookEvent[]; total: number }>;

  /**
   * Find events with date range filter
   */
  findByDateRange(startDate: Date, endDate: Date, options?: {
    integrationId?: string;
    webhookId?: string;
  }): Promise<WebhookEvent[]>;

  /**
   * Get event statistics
   */
  getStats(webhookId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
  }>;

  /**
   * Delete old events
   */
  deleteOlderThan(date: Date): Promise<number>;
}
