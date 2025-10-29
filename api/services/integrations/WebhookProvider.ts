import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";

export class WebhookProvider extends BaseIntegrationProvider {
  name = "Webhook";
  type = "webhook" as const;
  category = "custom" as const;
  supportedFeatures = ["webhook"];

  constructor() {
    super();
  }

  async handleOAuthCallback(
    _code: string,
    _state: string,
    _config: any,
  ): Promise<any> {
    throw new Error("OAuth not supported for webhook provider");
  }

  async testConnection(
    _credentials: any,
    config: any,
  ): Promise<ConnectionTestResult> {
    try {
      // For webhook provider, we can test by making a test request to the webhook URL
      if (!config.webhookUrl) {
        return {
          success: false,
          message: "Webhook URL is required",
          details: { message: "Please provide a valid webhook URL" },
        };
      }

      // Basic URL validation
      try {
        new URL(config.webhookUrl);
      } catch {
        return {
          success: false,
          message: "Invalid webhook URL format",
          details: { message: "Please provide a valid webhook URL" },
        };
      }

      return {
        success: true,
        message: "Webhook configuration is valid",
        details: {
          url: config.webhookUrl,
          method: config.method || "POST",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        details: { error: error.toString() },
      };
    }
  }

  async sync(
    _credentials: any,
    _config: any,
    _syncType: string,
    _options?: any,
  ): Promise<SyncResult> {
    try {
      // Webhook provider doesn't have traditional sync
      // This could be used to trigger webhook events or validate configuration
      return {
        success: true,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [],
        duration: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [
          {
            record: null,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
        duration: 0,
      };
    }
  }

  async getOAuthAuthorizationUrl(
    _config: any,
    _state: string,
  ): Promise<OAuthAuthorizationUrl> {
    // Webhook provider doesn't use OAuth
    throw new Error("OAuth not supported for webhook provider");
  }

  async exchangeCodeForTokens(
    _config: any,
    _code: string,
    _state: string,
    _codeVerifier?: string,
  ): Promise<any> {
    // Webhook provider doesn't use OAuth
    throw new Error("OAuth not supported for webhook provider");
  }

  async refreshTokens(
    _refreshToken: string,
    _config: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Webhook provider doesn't use OAuth
    throw new Error("Token refresh not supported for webhook provider");
  }

  async revokeTokens(_config: any, _accessToken: string): Promise<void> {
    // Webhook provider doesn't use OAuth
    throw new Error("Token revocation not supported for webhook provider");
  }

  getRequiredScopes(): string[] {
    // Webhook provider doesn't require scopes
    return [];
  }

  getRequiredCredentials(): string[] {
    return ["webhookUrl"];
  }

  getOptionalCredentials(): string[] {
    return ["method", "headers", "secret"];
  }

  validateCredentials(credentials: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials.webhookUrl) {
      errors.push("Webhook URL is required");
    } else {
      try {
        new URL(credentials.webhookUrl);
      } catch {
        errors.push("Invalid webhook URL format");
      }
    }

    if (
      credentials.method &&
      !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(credentials.method)
    ) {
      errors.push("Invalid HTTP method");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
