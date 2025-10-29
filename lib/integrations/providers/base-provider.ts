import {
  IntegrationConnection,
  IntegrationLog,
} from "@/lib/types/integrations";

export interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  baseUrl?: string;
  scopes?: string[];
  webhookUrl?: string;
  [key: string]: any;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
}

export interface ProviderAction {
  id: string;
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: "string" | "number" | "boolean" | "object" | "array";
      required: boolean;
      description: string;
      default?: any;
    };
  };
}

export interface ProviderTrigger {
  id: string;
  name: string;
  description: string;
  eventType: string;
  webhookRequired: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitInfo?: RateLimitInfo;
  headers?: Record<string, string>;
}

export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected connection?: IntegrationConnection;

  constructor(config: ProviderConfig, connection?: IntegrationConnection) {
    this.config = config;
    this.connection = connection;
  }

  // Abstract methods that must be implemented by each provider
  abstract getProviderName(): string;
  abstract getProviderType(): string;
  abstract getAuthUrl(state: string): string;
  abstract exchangeCodeForTokens(
    code: string,
    state: string,
  ): Promise<OAuthTokens>;
  abstract refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  abstract testConnection(): Promise<boolean>;
  abstract getAvailableActions(): ProviderAction[];
  abstract getAvailableTriggers(): ProviderTrigger[];
  abstract executeAction(
    actionId: string,
    parameters: any,
    context?: any,
  ): Promise<ApiResponse>;
  abstract handleWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<any>;

  // Common utility methods
  protected async makeApiRequest<T = any>(
    url: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      // Add authorization header if tokens are available
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.connection?.config?.accessToken) {
        headers["Authorization"] =
          `Bearer ${this.connection.config.accessToken}`;
      } else if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Extract rate limit information
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("Retry-After") || "60",
        );
        return {
          success: false,
          error: "Rate limit exceeded",
          rateLimitInfo: rateLimitInfo
            ? {
                ...rateLimitInfo,
                retryAfter,
              }
            : {
                limit: 0,
                remaining: 0,
                resetTime: new Date(),
                retryAfter,
              },
        };
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          rateLimitInfo,
          headers: responseHeaders,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        rateLimitInfo,
        headers: responseHeaders,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  protected extractRateLimitInfo(headers: Headers): RateLimitInfo | undefined {
    const limit =
      headers.get("X-RateLimit-Limit") || headers.get("X-Rate-Limit-Limit");
    const remaining =
      headers.get("X-RateLimit-Remaining") ||
      headers.get("X-Rate-Limit-Remaining");
    const reset =
      headers.get("X-RateLimit-Reset") || headers.get("X-Rate-Limit-Reset");

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: new Date(parseInt(reset) * 1000),
      };
    }

    return undefined;
  }

  protected async logActivity(
    action: string,
    status: "success" | "error" | "warning",
    details: any,
    error?: string,
  ): Promise<void> {
    if (!this.connection) return;

    const log: Partial<IntegrationLog> = {
      integrationId: this.connection.integrationId,
      action,
      status,
      requestData: details.request || null,
      responseData: details.response || null,
      error: error || undefined,
      duration: details.duration || 0,
      timestamp: new Date(),
    };

    try {
      await fetch("/api/integrations/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
    } catch (err) {
      console.error("Failed to log integration activity:", err);
    }
  }

  protected isTokenExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    return new Date() >= expiresAt;
  }

  protected async ensureValidTokens(): Promise<boolean> {
    if (!this.connection?.config?.refreshToken) return false;

    if (this.isTokenExpired(this.connection.lastSyncAt)) {
      if (this.connection.config.refreshToken) {
        try {
          const newTokens = await this.refreshTokens(
            this.connection.config.refreshToken,
          );

          // Update connection with new tokens
          await fetch(`/api/integrations/connections/${this.connection.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              config: {
                ...this.connection.config,
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
              },
            }),
          });

          this.connection.config = {
            ...this.connection.config,
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          };
          return true;
        } catch (error) {
          await this.logActivity(
            "token_refresh",
            "error",
            {},
            error instanceof Error ? error.message : "Token refresh failed",
          );
          return false;
        }
      }
      return false;
    }

    return true;
  }

  // Utility method for handling webhook verification
  protected verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: string = "sha256",
  ): boolean {
    try {
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      return false;
    }
  }

  // Common data transformation utilities
  protected transformData(data: any, mapping: Record<string, string>): any {
    const result: any = {};

    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      const value = this.getNestedValue(data, sourcePath);
      if (value !== undefined) {
        this.setNestedValue(result, targetKey, value);
      }
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);

    target[lastKey] = value;
  }
}
