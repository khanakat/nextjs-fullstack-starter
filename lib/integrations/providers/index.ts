import { BaseProvider } from "./base-provider";
import { SlackProvider, SlackConfig } from "./slack-provider";
import { SalesforceProvider, SalesforceConfig } from "./salesforce-provider";
import { GoogleProvider, GoogleConfig } from "./google-provider";
import { IntegrationConnection } from "@/lib/types/integrations";

export type ProviderConfig = SlackConfig | SalesforceConfig | GoogleConfig;

export interface ProviderFactory {
  createProvider(
    providerType: string,
    config: ProviderConfig,
    connection?: IntegrationConnection,
  ): BaseProvider | null;
}

export class IntegrationProviderFactory implements ProviderFactory {
  createProvider(
    providerType: string,
    config: ProviderConfig,
    connection?: IntegrationConnection,
  ): BaseProvider | null {
    switch (providerType.toLowerCase()) {
      case "slack":
        return new SlackProvider(config as SlackConfig, connection);
      case "salesforce":
        return new SalesforceProvider(config as SalesforceConfig, connection);
      case "google":
      case "google-sheets":
        return new GoogleProvider(config as GoogleConfig, connection);
      default:
        return null;
    }
  }

  getSupportedProviders(): string[] {
    return ["slack", "salesforce", "google", "google-sheets"];
  }

  getProviderDisplayName(providerType: string): string {
    const displayNames: Record<string, string> = {
      slack: "Slack",
      salesforce: "Salesforce",
      google: "Google Workspace",
      "google-sheets": "Google Sheets",
    };

    return displayNames[providerType.toLowerCase()] || providerType;
  }

  getProviderCategory(providerType: string): string {
    const categories: Record<string, string> = {
      slack: "communication",
      salesforce: "crm",
      google: "productivity",
      "google-sheets": "productivity",
    };

    return categories[providerType.toLowerCase()] || "other";
  }

  getProviderIcon(providerType: string): string {
    const icons: Record<string, string> = {
      slack: "💬",
      salesforce: "☁️",
      google: "📊",
      "google-sheets": "📊",
    };

    return icons[providerType.toLowerCase()] || "🔗";
  }

  getDefaultScopes(providerType: string): string[] {
    const defaultScopes: Record<string, string[]> = {
      slack: ["channels:read", "chat:write", "users:read"],
      salesforce: ["api", "refresh_token"],
      google: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
      "google-sheets": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    };

    return defaultScopes[providerType.toLowerCase()] || [];
  }
}

// Export provider classes and types
export {
  BaseProvider,
  SlackProvider,
  SalesforceProvider,
  GoogleProvider,
  type SlackConfig,
  type SalesforceConfig,
  type GoogleConfig,
};

// Export the default factory instance
export const providerFactory = new IntegrationProviderFactory();
