import { Webhook } from '../entities/webhook';
import { WebhookId } from '../value-objects/webhook-id';

/**
 * Webhook Repository Interface
 */
export interface IWebhookRepository {
  /**
   * Save webhook (create or update)
   */
  save(webhook: Webhook): Promise<void>;

  /**
   * Find webhook by ID
   */
  findById(id: WebhookId): Promise<Webhook | null>;

  /**
   * Find webhooks by integration ID
   */
  findByIntegrationId(integrationId: string): Promise<Webhook[]>;

  /**
   * Find all webhooks with optional filters
   */
  findAll(options?: {
    integrationId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ webhooks: Webhook[]; total: number }>;

  /**
   * Find active webhooks for an integration
   */
  findActiveByIntegrationId(integrationId: string): Promise<Webhook[]>;

  /**
   * Delete webhook by ID
   */
  delete(id: WebhookId): Promise<void>;

  /**
   * Check if webhook exists
   */
  exists(id: WebhookId): Promise<boolean>;
}
