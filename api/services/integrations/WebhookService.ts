import { db as prisma } from "../../../lib/db";
import { providerRegistry } from "./ProviderRegistry";
import crypto from "crypto";
// import { z } from 'zod';

export interface WebhookEvent {
  id: string;
  provider: string;
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
  headers: Record<string, string>;
}

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelays: number[]; // in milliseconds
  backoffMultiplier: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
  shouldRetry: boolean;
}

// const WebhookEventSchema = z.object({
//   provider: z.string(),
//   event: z.string(),
//   data: z.any(),
//   timestamp: z.string().optional(),
//   signature: z.string().optional(),
// });

export class WebhookService {
  private static readonly DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
    maxRetries: 3,
    retryDelays: [1000, 5000, 15000], // 1s, 5s, 15s
    backoffMultiplier: 2,
  };

  /**
   * Process incoming webhook
   */
  static async processWebhook(
    webhookId: string,
    payload: any,
    headers: Record<string, string>,
    organizationId: string,
  ): Promise<WebhookProcessingResult> {
    try {
      // Get webhook configuration
      const webhook = await prisma.integrationWebhook.findFirst({
        where: {
          id: webhookId,
          status: "active",
          integration: {
            organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!webhook) {
        throw new Error("Webhook not found or inactive");
      }

      // Verify webhook signature
      const isValidSignature = await this.verifyWebhookSignature(
        webhook,
        payload,
        headers,
      );

      if (!isValidSignature) {
        await this.logWebhookEvent(
          webhook.integration.provider,
          "signature_verification_failed",
          "webhook_failed",
          {
            error: "Invalid webhook signature",
            headers: this.sanitizeHeaders(headers),
          },
          organizationId,
        );

        return {
          success: false,
          error: "Invalid webhook signature",
          shouldRetry: false,
        };
      }

      // Parse and validate webhook event
      const webhookEvent = this.parseWebhookEvent(
        webhook.integration.provider,
        payload,
        headers,
      );

      // Check if event is in allowed events list
      const allowedEvents = JSON.parse(webhook.events as string);
      if (!allowedEvents.includes(webhookEvent.event)) {
        await this.logWebhookEvent(
          webhook.integration.provider,
          "event_filtered",
          "webhook_filtered",
          {
            event: webhookEvent.event,
            allowedEvents,
          },
          organizationId,
        );

        return {
          success: true,
          shouldRetry: false,
        };
      }

      // Process webhook with provider
      const provider = providerRegistry.getProvider(
        webhook.integration.provider as any,
      );
      const processingResult = await provider.processWebhook(
        webhookEvent.event,
        webhookEvent.data,
        JSON.parse(webhook.integration.config as string),
      );

      // Log successful processing
      await this.logWebhookEvent(
        webhook.integration.provider,
        "processed",
        "webhook_processed",
        {
          event: webhookEvent.event,
          result: processingResult,
        },
        organizationId,
      );

      return {
        success: true,
        shouldRetry: false,
      };
    } catch (error) {
      console.error("Webhook processing failed:", error);

      // Log error
      await this.logWebhookEvent(
        "unknown",
        "processing_failed",
        "webhook_failed",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        organizationId,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        shouldRetry: this.shouldRetryError(error),
      };
    }
  }

  /**
   * Verify webhook signature
   */
  private static async verifyWebhookSignature(
    webhook: any,
    payload: any,
    headers: Record<string, string>,
  ): Promise<boolean> {
    try {
      const provider = providerRegistry.getProvider(
        webhook.integration.provider as any,
      );
      return await provider.verifyWebhookSignature(
        JSON.stringify(payload),
        headers["x-signature"] || headers["signature"] || "",
        webhook.secret,
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Parse webhook event from payload
   */
  private static parseWebhookEvent(
    provider: string,
    payload: any,
    headers: Record<string, string>,
  ): WebhookEvent {
    const eventId = this.generateEventId();

    // Provider-specific event parsing
    let event: string;
    let data: any;

    switch (provider) {
      case "slack":
        event = payload.type || "unknown";
        data = payload;
        break;
      case "stripe":
        event = payload.type || "unknown";
        data = payload.data;
        break;
      case "github":
        event = headers["x-github-event"] || "unknown";
        data = payload;
        break;
      default:
        event = payload.event || payload.type || "unknown";
        data = payload;
    }

    return {
      id: eventId,
      provider,
      event,
      data,
      timestamp: new Date(),
      signature: headers["x-signature"] || headers["x-hub-signature-256"],
      headers: this.sanitizeHeaders(headers),
    };
  }

  /**
   * Schedule webhook retry
   */
  static async scheduleWebhookRetry(
    webhookId: string,
    payload: any,
    headers: Record<string, string>,
    organizationId: string,
    retryCount: number = 0,
    config: WebhookRetryConfig = this.DEFAULT_RETRY_CONFIG,
  ): Promise<void> {
    if (retryCount >= config.maxRetries) {
      await this.logWebhookEvent(
        "unknown",
        "retry_exhausted",
        "webhook_retry_exhausted",
        {
          retryCount,
          maxRetries: config.maxRetries,
        },
        organizationId,
      );
      return;
    }

    const delay =
      config.retryDelays[retryCount] ||
      config.retryDelays[config.retryDelays.length - 1] *
        Math.pow(
          config.backoffMultiplier,
          retryCount - config.retryDelays.length + 1,
        );

    // Log retry attempt
    await this.logWebhookEvent(
      "unknown",
      "retry_scheduled",
      "webhook_retry_scheduled",
      {
        retryCount: retryCount + 1,
        delay,
        scheduledAt: new Date(Date.now() + delay),
      },
      organizationId,
    );

    // Schedule retry (in a real implementation, you'd use a job queue like Bull or Agenda)
    setTimeout(async () => {
      const result = await this.processWebhook(
        webhookId,
        payload,
        headers,
        organizationId,
      );

      if (!result.success && result.shouldRetry) {
        await this.scheduleWebhookRetry(
          webhookId,
          payload,
          headers,
          organizationId,
          retryCount + 1,
          config,
        );
      }
    }, delay);
  }

  /**
   * Get webhook delivery history
   */
  static async getWebhookDeliveries(
    webhookId: string,
    _organizationId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      event?: string;
    } = {},
  ) {
    const { page = 1, limit = 50, status, event } = options;

    const where: any = {
      integrationId: webhookId,
    };

    if (status) {
      where.action = status;
    }

    if (event) {
      where.requestData = {
        path: ["event"],
        equals: event,
      };
    }

    const [deliveries, total] = await Promise.all([
      prisma.integrationLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.integrationLog.count({ where }),
    ]);

    return {
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        action: delivery.action,
        status: delivery.status,
        event: delivery.requestData
          ? JSON.parse(delivery.requestData as string).event
          : null,
        timestamp: delivery.timestamp,
        request: delivery.requestData
          ? JSON.parse(delivery.requestData as string)
          : null,
        response: delivery.responseData
          ? JSON.parse(delivery.responseData as string)
          : null,
        duration: delivery.duration,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhookEndpoint(
    webhookId: string,
    organizationId: string,
    testEvent?: string,
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const webhook = await prisma.integrationWebhook.findFirst({
        where: {
          id: webhookId,
          integration: {
            organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!webhook) {
        throw new Error("Webhook not found");
      }

      // Generate test payload
      const testPayload = this.generateTestPayload(
        webhook.integration.provider,
        testEvent || "test",
      );

      // Send test webhook
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Integration-Hub-Webhook-Test/1.0",
        },
        body: JSON.stringify(testPayload),
      });

      const responseData = await response.text();

      // Log test result
      await this.logWebhookEvent(
        webhook.integration.provider,
        "test_sent",
        "webhook_test_sent",
        {
          testEvent,
          payload: testPayload,
          response: {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          },
        },
        organizationId,
      );

      return {
        success: response.ok,
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      };
    } catch (error) {
      console.error("Webhook test failed:", error);

      await this.logWebhookEvent(
        "unknown",
        "test_failed",
        "webhook_test_failed",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        organizationId,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate test payload for provider
   */
  private static generateTestPayload(provider: string, event: string): any {
    const basePayload = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      test: true,
    };

    switch (provider) {
      case "slack":
        return {
          ...basePayload,
          type: event,
          team_id: "T1234567890",
          event: {
            type: event,
            user: "U1234567890",
            text: "Test webhook event",
            channel: "C1234567890",
            ts: Date.now().toString(),
          },
        };

      case "stripe":
        return {
          ...basePayload,
          type: event,
          data: {
            object: {
              id: "test_" + this.generateEventId(),
              object: "payment_intent",
              amount: 1000,
              currency: "usd",
              status: "succeeded",
            },
          },
        };

      case "github":
        return {
          ...basePayload,
          action: "opened",
          repository: {
            id: 123456789,
            name: "test-repo",
            full_name: "user/test-repo",
          },
          sender: {
            login: "testuser",
            id: 987654321,
          },
        };

      default:
        return {
          ...basePayload,
          event,
          data: {
            message: "Test webhook event",
            source: "integration-hub",
          },
        };
    }
  }

  /**
   * Log webhook event
   */
  private static async logWebhookEvent(
    _provider: string,
    _event: string,
    _action: string,
    _data: any,
    _organizationId: string,
  ): Promise<void> {
    try {
      // TODO: Implement webhook event logging
      console.log("Webhook event logged:", {
        _provider,
        _event,
        _action,
        _data,
        _organizationId,
      });
    } catch (error) {
      console.error("Failed to log webhook event:", error);
    }
  }

  /**
   * Determine if error should trigger retry
   */
  private static shouldRetryError(error: any): boolean {
    if (error instanceof Error) {
      // Don't retry authentication or validation errors
      if (
        error.message.includes("signature") ||
        error.message.includes("unauthorized") ||
        error.message.includes("forbidden")
      ) {
        return false;
      }
    }

    // Retry on network errors, timeouts, and server errors
    return true;
  }

  /**
   * Sanitize headers for logging
   */
  private static sanitizeHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sanitized = { ...headers };

    // Remove sensitive headers
    const sensitiveHeaders = [
      "authorization",
      "x-api-key",
      "x-secret",
      "cookie",
    ];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(
    webhookId: string,
    _organizationId: string,
    timeRange: { start: Date; end: Date },
  ) {
    const stats = await prisma.integrationLog.groupBy({
      by: ["status", "action"],
      where: {
        integrationId: webhookId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      _count: {
        id: true,
      },
    });

    const totalDeliveries = stats.reduce(
      (sum, stat) => sum + stat._count.id,
      0,
    );
    const successfulDeliveries = stats
      .filter((stat) => stat.status === "success")
      .reduce((sum, stat) => sum + stat._count.id, 0);

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries: totalDeliveries - successfulDeliveries,
      successRate:
        totalDeliveries > 0
          ? (successfulDeliveries / totalDeliveries) * 100
          : 0,
      breakdown: stats.map((stat) => ({
        action: stat.action,
        status: stat.status,
        count: stat._count.id,
      })),
    };
  }
}
