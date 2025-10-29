import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import { SlackProvider } from "./SlackProvider";
import { SalesforceProvider } from "./SalesforceProvider";
import { JiraProvider } from "./JiraProvider";
import { GoogleDriveProvider } from "./GoogleDriveProvider";
import { StripeProvider } from "./StripeProvider";
import {
  IntegrationType,
  IntegrationProvider,
} from "../../../shared/types/integration";

export class ProviderRegistry {
  private static providers: Map<IntegrationProvider, BaseIntegrationProvider> =
    new Map();

  static {
    // Initialize all providers
    this.providers.set("slack", new SlackProvider());
    this.providers.set("salesforce", new SalesforceProvider());
    this.providers.set("jira", new JiraProvider());
    this.providers.set("google_drive", new GoogleDriveProvider());
    this.providers.set("stripe", new StripeProvider());
  }

  static getProvider(provider: IntegrationProvider): BaseIntegrationProvider {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not found`);
    }
    return providerInstance;
  }

  static getAllProviders(): Map<IntegrationProvider, BaseIntegrationProvider> {
    return new Map(this.providers);
  }

  static getProvidersByType(type: IntegrationType): BaseIntegrationProvider[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.type === type,
    );
  }

  static getProviderMetadata(provider: IntegrationProvider) {
    const providerInstance = this.getProvider(provider);
    return {
      ...providerInstance.getProviderMetadata(),
      provider,
      type: providerInstance.type,
      category: providerInstance.category,
      supportedFeatures: providerInstance.supportedFeatures,
      availableScopes: providerInstance.getAvailableScopes(),
      defaultConfig: providerInstance.getDefaultConfig(),
      supportedWebhookEvents: providerInstance.getSupportedWebhookEvents(),
    };
  }

  static getAllProviderMetadata() {
    const metadata: Record<string, any> = {};

    for (const [providerKey] of this.providers) {
      metadata[providerKey] = this.getProviderMetadata(providerKey);
    }

    return metadata;
  }

  static getProvidersByCategory() {
    const categories: Record<
      string,
      Array<{ provider: IntegrationProvider; metadata: any }>
    > = {};

    for (const [providerKey, providerInstance] of this.providers) {
      const category = providerInstance.category;
      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push({
        provider: providerKey,
        metadata: this.getProviderMetadata(providerKey),
      });
    }

    return categories;
  }

  static isProviderSupported(
    provider: string,
  ): provider is IntegrationProvider {
    return this.providers.has(provider as IntegrationProvider);
  }

  static validateProviderConfig(
    provider: IntegrationProvider,
    config: Record<string, any>,
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const providerInstance = this.getProvider(provider);
      // const _defaultConfig = providerInstance.getDefaultConfig(); // Not used in current implementation
      const availableScopes = providerInstance.getAvailableScopes();

      // Check required OAuth fields
      if (!config.clientId) {
        errors.push("Client ID is required");
      }

      if (!config.clientSecret) {
        errors.push("Client Secret is required");
      }

      if (!config.redirectUri) {
        errors.push("Redirect URI is required");
      }

      // Validate scopes
      if (config.scopes && Array.isArray(config.scopes)) {
        const invalidScopes = config.scopes.filter(
          (scope: string) => !availableScopes.includes(scope),
        );

        if (invalidScopes.length > 0) {
          warnings.push(`Invalid scopes: ${invalidScopes.join(", ")}`);
        }
      }

      // Provider-specific validations
      switch (provider) {
        case "salesforce":
          if (config.isSandbox === undefined) {
            warnings.push(
              "Sandbox mode not specified, defaulting to production",
            );
          }
          break;

        case "jira":
          if (!config.cloudId && !config.serverUrl) {
            warnings.push(
              "Cloud ID or Server URL should be specified for better performance",
            );
          }
          break;

        case "google_drive":
          if (
            config.scopes &&
            !config.scopes.includes("https://www.googleapis.com/auth/drive")
          ) {
            warnings.push(
              "Consider including full drive access scope for better functionality",
            );
          }
          break;

        case "stripe":
          if (!config.webhookSecret) {
            warnings.push(
              "Webhook secret is recommended for secure webhook processing",
            );
          }
          break;
      }
    } catch (error) {
      errors.push(
        `Provider validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static getProviderCapabilities(provider: IntegrationProvider) {
    const providerInstance = this.getProvider(provider);

    return {
      features: providerInstance.supportedFeatures,
      webhookEvents: providerInstance.getSupportedWebhookEvents(),
      scopes: providerInstance.getAvailableScopes(),
      authType: "oauth2", // All current providers use OAuth2
      rateLimited: true,
      supportsSync: true,
      supportsWebhooks: providerInstance.getSupportedWebhookEvents().length > 0,
      supportsActions: true,
    };
  }

  static async testAllProviderConnections(
    integrations: Array<{
      provider: IntegrationProvider;
      credentials: Record<string, any>;
      config: Record<string, any>;
    }>,
  ) {
    const results = await Promise.allSettled(
      integrations.map(async ({ provider, credentials, config }) => {
        const providerInstance = this.getProvider(provider);
        const result = await providerInstance.testConnection(
          credentials,
          config,
        );

        return {
          provider,
          ...result,
        };
      }),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          provider: integrations[index].provider,
          success: false,
          message: `Test failed: ${result.reason.message}`,
          details: { error: result.reason.message },
        };
      }
    });
  }

  static getProviderStats() {
    const stats = {
      totalProviders: this.providers.size,
      byType: {} as Record<IntegrationType, number>,
      byCategory: {} as Record<string, number>,
      totalFeatures: 0,
      totalWebhookEvents: 0,
    };

    for (const [, providerInstance] of this.providers) {
      // Count by type
      stats.byType[providerInstance.type as keyof typeof stats.byType] =
        (stats.byType[providerInstance.type as keyof typeof stats.byType] ||
          0) + 1;

      // Count by category
      stats.byCategory[providerInstance.category] =
        (stats.byCategory[providerInstance.category] || 0) + 1;

      // Count features and webhook events
      stats.totalFeatures += providerInstance.supportedFeatures.length;
      stats.totalWebhookEvents +=
        providerInstance.getSupportedWebhookEvents().length;
    }

    return stats;
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry;
