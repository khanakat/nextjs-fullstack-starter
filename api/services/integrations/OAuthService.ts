import crypto from "crypto";
import { db as prisma } from "../../../lib/db";
import { providerRegistry } from "./ProviderRegistry";
import {
  IntegrationProvider,
  OAuthAuthorizationUrl,
  ConnectionTestResult,
} from "../../../shared/types/integration";

export class OAuthService {
  private static readonly ENCRYPTION_ALGORITHM = "aes-256-gcm";
  private static readonly ENCRYPTION_KEY =
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    crypto.randomBytes(32).toString("hex");

  /**
   * Generate OAuth authorization URL for a provider
   */
  static async getAuthorizationUrl(
    provider: IntegrationProvider,
    config: Record<string, any>,
    organizationId: string,
    userId: string,
  ): Promise<OAuthAuthorizationUrl & { integrationId: string }> {
    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in database for verification
    const integration = await prisma.integration.create({
      data: {
        name: `${provider} Integration`,
        provider,
        type: providerRegistry.getProvider(provider).type,
        category: "productivity", // Default category
        status: "pending",
        config: this.encryptData(config),
        organizationId,
        createdBy: userId,
      },
    });

    // Store OAuth state
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: "oauth_initiated",
        status: "pending",
        requestData: this.encryptData({ state, config }),
      },
    });

    const providerInstance = providerRegistry.getProvider(provider);
    const authUrl = await providerInstance.getOAuthAuthorizationUrl(
      config,
      state,
    );

    return {
      ...authUrl,
      integrationId: integration.id,
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  static async handleCallback(
    integrationId: string,
    code: string,
    state: string,
    organizationId: string,
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      // Get integration and verify state
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          organizationId,
          status: "pending",
        },
      });

      if (!integration) {
        throw new Error("Integration not found or already processed");
      }

      // Verify state parameter
      const oauthLog = await prisma.integrationLog.findFirst({
        where: {
          integrationId,
          action: "oauth_initiated",
          status: "pending",
        },
        orderBy: { timestamp: "desc" },
      });

      if (!oauthLog) {
        throw new Error("OAuth state not found");
      }

      const storedData = this.decryptData(oauthLog.requestData as string);
      if (storedData.state !== state) {
        throw new Error("Invalid state parameter");
      }

      // Exchange code for tokens
      const config = this.decryptData(integration.config as string);
      const providerInstance = providerRegistry.getProvider(
        integration.provider as IntegrationProvider,
      );

      const credentials = await providerInstance.handleOAuthCallback(
        code,
        state,
        config,
      );

      // Test the connection
      const testResult = await providerInstance.testConnection(
        credentials,
        config,
      );

      if (!testResult.success) {
        // Update integration status to failed
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            status: "error",
            lastError: testResult.message,
          },
        });

        // Log the failure
        await prisma.integrationLog.create({
          data: {
            integrationId,
            action: "oauth_failed",
            status: "error",
            requestData: this.encryptData({ code, state }),
            responseData: this.encryptData({ error: testResult.message }),
          },
        });

        return { success: false, error: testResult.message };
      }

      // Create connection with encrypted credentials
      const connection = await prisma.integrationConnection.create({
        data: {
          integrationId,
          connectionName: `${integration.provider} Connection`,
          credentials: this.encryptData(credentials),
          settings: this.encryptData(config),
          status: "connected",
          lastConnected: new Date(),
        },
      });

      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: "active",
          lastError: null,
        },
      });

      // Log successful OAuth completion
      await prisma.integrationLog.create({
        data: {
          integrationId,
          action: "oauth_completed",
          status: "success",
          requestData: this.encryptData({ code, state }),
          responseData: this.encryptData({
            connectionId: connection.id,
            testResult: {
              success: testResult.success,
              message: testResult.message,
              capabilities: testResult.capabilities,
            },
          }),
        },
      });

      // Update OAuth state log
      await prisma.integrationLog.update({
        where: { id: oauthLog.id },
        data: { status: "completed" },
      });

      return { success: true, connectionId: connection.id };
    } catch (error) {
      // Log the error
      await prisma.integrationLog.create({
        data: {
          integrationId,
          action: "oauth_error",
          status: "error",
          requestData: this.encryptData({ code, state }),
          responseData: this.encryptData({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test an existing connection
   */
  static async testConnection(
    connectionId: string,
    organizationId: string,
  ): Promise<ConnectionTestResult> {
    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!connection) {
        return {
          success: false,
          message: "Connection not found",
          details: { error: "Connection not found" },
        };
      }

      const credentials = this.decryptData(connection.credentials as string);
      const settings = this.decryptData(connection.settings as string);

      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      const testResult = await providerInstance.testConnection(
        credentials,
        settings,
      );

      // Update connection status based on test result
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: testResult.success ? "connected" : "error",
          lastConnected: new Date(),
        },
      });

      // Log the test result
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "connection_test",
          status: testResult.success ? "success" : "error",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData(testResult),
        },
      });

      return testResult;
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Refresh OAuth tokens if supported
   */
  static async refreshTokens(
    connectionId: string,
    organizationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    let connection: any = null;
    try {
      connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!connection) {
        throw new Error("Connection not found");
      }

      const credentials = this.decryptData(connection.credentials as string);
      const settings = this.decryptData(connection.settings as string);

      if (!credentials.refresh_token) {
        throw new Error("No refresh token available");
      }

      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      // Refresh tokens
      const newCredentials = await providerInstance.refreshTokens(
        credentials.refresh_token,
        settings,
      );

      // Update stored credentials
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          credentials: this.encryptData(newCredentials),
          lastConnected: new Date(),
        },
      });

      // Log the refresh
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "tokens_refreshed",
          status: "success",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({ refreshed: true }),
        },
      });

      return { success: true };
    } catch (error) {
      // Log the error
      await prisma.integrationLog.create({
        data: {
          integrationId: connection?.integrationId || "",
          action: "token_refresh_failed",
          status: "error",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Revoke OAuth tokens and deactivate connection
   */
  static async revokeConnection(
    connectionId: string,
    organizationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!connection) {
        throw new Error("Connection not found");
      }

      const credentials = this.decryptData(connection.credentials as string);
      const settings = this.decryptData(connection.settings as string);

      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      // Attempt to revoke tokens with the provider
      try {
        if (
          "revokeTokens" in providerInstance &&
          typeof providerInstance.revokeTokens === "function"
        ) {
          await (providerInstance as any).revokeTokens(credentials, settings);
        }
      } catch (error) {
        // Log but don't fail if revocation fails
        console.warn(
          `Failed to revoke tokens for ${connection.integration.provider}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
      }

      // Deactivate connection
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: "inactive",
          credentials: this.encryptData({}), // Clear credentials
          lastConnected: new Date(),
        },
      });

      // Update integration status if no active connections remain
      const activeConnections = await prisma.integrationConnection.count({
        where: {
          integrationId: connection.integrationId,
          status: "active",
        },
      });

      if (activeConnections === 0) {
        await prisma.integration.update({
          where: { id: connection.integrationId },
          data: { status: "inactive" },
        });
      }

      // Log the revocation
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "connection_revoked",
          status: "success",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({ revoked: true }),
        },
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get decrypted credentials for a connection
   */
  static async getConnectionCredentials(
    connectionId: string,
    organizationId: string,
  ): Promise<Record<string, any> | null> {
    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId,
          },
          status: "active",
        },
      });

      if (!connection) {
        return null;
      }

      return this.decryptData(connection.credentials as string);
    } catch (error) {
      console.error("Failed to get connection credentials:", error);
      return null;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private static encryptData(data: any): string {
    try {
      const text = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(
        this.ENCRYPTION_ALGORITHM,
        this.ENCRYPTION_KEY,
      );

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Decrypt sensitive data
   */
  private static decryptData(encryptedData: string): any {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error("Invalid encrypted data format");
      }

      // const iv = Buffer.from(ivHex, 'hex'); // Not used in current implementation
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = crypto.createDecipher(
        this.ENCRYPTION_ALGORITHM,
        this.ENCRYPTION_KEY,
      );

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate secure state parameter
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Validate state parameter
   */
  static async validateState(
    integrationId: string,
    state: string,
    organizationId: string,
  ): Promise<boolean> {
    try {
      const oauthLog = await prisma.integrationLog.findFirst({
        where: {
          integrationId,
          action: "oauth_initiated",
          status: "pending",
          integration: {
            organizationId,
          },
        },
        orderBy: { timestamp: "desc" },
      });

      if (!oauthLog) {
        return false;
      }

      const storedData = this.decryptData(oauthLog.requestData as string);
      return storedData.state === state;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired OAuth states
   */
  static async cleanupExpiredStates(): Promise<void> {
    const expiredTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    await prisma.integrationLog.updateMany({
      where: {
        action: "oauth_initiated",
        status: "pending",
        timestamp: {
          lt: expiredTime,
        },
      },
      data: {
        status: "expired",
      },
    });

    // Also clean up pending integrations
    await prisma.integration.updateMany({
      where: {
        status: "pending",
        createdAt: {
          lt: expiredTime,
        },
      },
      data: {
        status: "expired",
      },
    });
  }
}
