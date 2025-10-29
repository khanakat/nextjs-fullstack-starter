import crypto from "crypto";
import { db as prisma } from "../../../lib/db";
import {
  IntegrationProvider,
  ConnectionType,
} from "../../../shared/types/integration";
import { providerRegistry } from "./ProviderRegistry";

export class CredentialService {
  private static readonly ENCRYPTION_ALGORITHM = "aes-256-gcm";
  private static readonly ENCRYPTION_KEY =
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    crypto.randomBytes(32).toString("hex");
  private static readonly KEY_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days

  /**
   * Store encrypted credentials for an integration
   */
  static async storeCredentials(
    integrationId: string,
    credentials: Record<string, any>,
    connectionType: ConnectionType,
    _organizationId: string,
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      // Validate credentials format based on connection type
      const validationResult = this.validateCredentials(
        credentials,
        connectionType,
      );
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Encrypt credentials
      const encryptedCredentials = this.encryptData(credentials);
      const encryptedMetadata = this.encryptData({
        connectionType,
        createdAt: new Date(),
        keyVersion: this.getCurrentKeyVersion(),
      });

      // Create connection record
      const connection = await prisma.integrationConnection.create({
        data: {
          integrationId,
          connectionName: `Connection-${Date.now()}`,
          credentials: encryptedCredentials,
          settings: encryptedMetadata,
          status: "pending",
          connectionType,
        },
      });

      // Test the connection
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      const providerInstance = providerRegistry.getProvider(
        integration.provider as IntegrationProvider,
      );

      const testResult = await providerInstance.testConnection(
        credentials,
        JSON.parse(integration.config as string),
      );

      // Update connection status based on test result
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: testResult.success ? "connected" : "error",
          lastConnected: testResult.success ? new Date() : undefined,
        },
      });

      // Log the credential storage
      await prisma.integrationLog.create({
        data: {
          integrationId,
          action: "credentials_stored",
          status: testResult.success ? "success" : "error",
          requestData: this.encryptData({ connectionType }),
          responseData: this.encryptData({
            connectionId: connection.id,
            testResult: {
              success: testResult.success,
              message: testResult.message,
            },
          }),
        },
      });

      if (!testResult.success) {
        return {
          success: false,
          error: `Connection test failed: ${testResult.message}`,
          connectionId: connection.id,
        };
      }

      return { success: true, connectionId: connection.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve and decrypt credentials for a connection
   */
  static async getCredentials(
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
          status: { in: ["connected", "error"] },
        },
        include: {
          integration: true,
        },
      });

      if (!connection) {
        return null;
      }

      // Decrypt credentials
      const credentials = this.decryptData(connection.credentials as string);

      // Check if credentials need key rotation
      const metadata = this.decryptData(connection.settings as string);
      if (this.needsKeyRotation(metadata)) {
        await this.rotateCredentials(connectionId, credentials, organizationId);
      }

      return credentials;
    } catch (error) {
      console.error("Failed to retrieve credentials:", error);
      return null;
    }
  }

  /**
   * Update existing credentials
   */
  static async updateCredentials(
    connectionId: string,
    newCredentials: Record<string, any>,
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
        return { success: false, error: "Connection not found" };
      }

      // Validate new credentials
      const validationResult = this.validateCredentials(
        newCredentials,
        connection.connectionType as ConnectionType,
      );

      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Test new credentials
      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      const testResult = await providerInstance.testConnection(
        newCredentials,
        JSON.parse(connection.integration.config as string),
      );

      if (!testResult.success) {
        return {
          success: false,
          error: `New credentials test failed: ${testResult.message}`,
        };
      }

      // Encrypt and store new credentials
      const encryptedCredentials = this.encryptData(newCredentials);
      const metadata = this.decryptData(connection.settings as string);
      metadata.updatedAt = new Date();
      metadata.keyVersion = this.getCurrentKeyVersion();

      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          credentials: encryptedCredentials,
          settings: this.encryptData(metadata),
          status: "connected",
          lastConnected: new Date(),
        },
      });

      // Log the credential update
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "credentials_updated",
          status: "success",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({ updated: true }),
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
   * Delete credentials and deactivate connection
   */
  static async deleteCredentials(
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
      });

      if (!connection) {
        return { success: false, error: "Connection not found" };
      }

      // Securely wipe credentials
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          credentials: this.encryptData({}),
          status: "inactive",
          lastConnected: new Date(),
        },
      });

      // Log the credential deletion
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "credentials_deleted",
          status: "success",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({ deleted: true }),
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
   * Rotate encryption keys for stored credentials
   */
  static async rotateCredentials(
    connectionId: string,
    credentials: Record<string, any>,
    _organizationId: string,
  ): Promise<void> {
    try {
      // Re-encrypt with new key version
      const newEncryptedCredentials = this.encryptData(credentials);
      const metadata = {
        keyVersion: this.getCurrentKeyVersion(),
        rotatedAt: new Date(),
      };

      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          credentials: newEncryptedCredentials,
          settings: this.encryptData(metadata),
        },
      });

      // Log the key rotation
      await prisma.integrationLog.create({
        data: {
          integrationId: connectionId,
          action: "credentials_rotated",
          status: "success",
          requestData: this.encryptData({ connectionId }),
          responseData: this.encryptData({ rotated: true }),
        },
      });
    } catch (error) {
      console.error("Failed to rotate credentials:", error);
    }
  }

  /**
   * Validate credentials based on connection type
   */
  private static validateCredentials(
    credentials: Record<string, any>,
    connectionType: ConnectionType,
  ): { valid: boolean; error?: string } {
    switch (connectionType) {
      case "oauth":
        if (!credentials.access_token) {
          return {
            valid: false,
            error: "OAuth credentials must include access_token",
          };
        }
        break;

      case "api_key":
        if (!credentials.api_key && !credentials.apiKey) {
          return {
            valid: false,
            error: "API Key credentials must include api_key or apiKey",
          };
        }
        break;

      case "basic_auth":
        if (!credentials.username || !credentials.password) {
          return {
            valid: false,
            error: "Basic Auth credentials must include username and password",
          };
        }
        break;

      case "bearer_token":
        if (!credentials.token && !credentials.bearer_token) {
          return {
            valid: false,
            error:
              "Bearer Token credentials must include token or bearer_token",
          };
        }
        break;

      case "custom":
        // Custom validation can be added here
        break;

      default:
        return {
          valid: false,
          error: `Unsupported connection type: ${connectionType}`,
        };
    }

    return { valid: true };
  }

  /**
   * Check if credentials need key rotation
   */
  private static needsKeyRotation(metadata: any): boolean {
    if (!metadata.keyVersion || !metadata.createdAt) {
      return true;
    }

    const createdAt = new Date(metadata.createdAt);
    const now = new Date();
    const age = now.getTime() - createdAt.getTime();

    return (
      age > this.KEY_ROTATION_INTERVAL ||
      metadata.keyVersion < this.getCurrentKeyVersion()
    );
  }

  /**
   * Get current key version
   */
  private static getCurrentKeyVersion(): number {
    // This could be stored in environment or database
    return parseInt(process.env.ENCRYPTION_KEY_VERSION || "1");
  }

  /**
   * Encrypt sensitive data with additional security measures
   */
  private static encryptData(data: any): string {
    try {
      const text = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(32);

      // Derive key with salt
      const key = crypto.pbkdf2Sync(
        this.ENCRYPTION_KEY,
        salt,
        100000,
        32,
        "sha512",
      );

      const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
      cipher.setAAD(Buffer.from("integration-credentials"));

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return `${iv.toString("hex")}:${salt.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Decrypt sensitive data with additional security measures
   */
  private static decryptData(encryptedData: string): any {
    try {
      const [ivHex, saltHex, authTagHex, encrypted] = encryptedData.split(":");

      if (!ivHex || !saltHex || !authTagHex || !encrypted) {
        throw new Error("Invalid encrypted data format");
      }

      // const _iv = Buffer.from(ivHex, 'hex'); // Not used in current implementation
      const salt = Buffer.from(saltHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      // Derive key with salt
      const key = crypto.pbkdf2Sync(
        this.ENCRYPTION_KEY,
        salt,
        100000,
        32,
        "sha512",
      );

      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
      decipher.setAAD(Buffer.from("integration-credentials"));
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
   * Audit credential access
   */
  static async auditCredentialAccess(
    connectionId: string,
    action: string,
    userId: string,
    _organizationId: string,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.integrationLog.create({
        data: {
          integrationId: connectionId,
          action: `credential_${action}`,
          status: "success",
          requestData: this.encryptData({
            userId,
            action,
            timestamp: new Date(),
            details,
          }),
        },
      });
    } catch (error) {
      console.error("Failed to audit credential access:", error);
    }
  }

  /**
   * Get credential health status
   */
  static async getCredentialHealth(organizationId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    needsRotation: number;
    errors: number;
  }> {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: {
          integration: {
            organizationId,
          },
        },
        select: {
          id: true,
          status: true,
          settings: true,
          createdAt: true,
        },
      });

      let needsRotation = 0;
      let expired = 0;
      let errors = 0;
      let active = 0;

      for (const connection of connections) {
        if (connection.status === "active") {
          active++;

          try {
            const metadata = this.decryptData(connection.settings as string);
            if (this.needsKeyRotation(metadata)) {
              needsRotation++;
            }
          } catch (error) {
            errors++;
          }
        } else if (connection.status === "expired") {
          expired++;
        } else if (connection.status === "error") {
          errors++;
        }
      }

      return {
        total: connections.length,
        active,
        expired,
        needsRotation,
        errors,
      };
    } catch (error) {
      console.error("Failed to get credential health:", error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        needsRotation: 0,
        errors: 0,
      };
    }
  }

  /**
   * Bulk rotate credentials that need rotation
   */
  static async bulkRotateCredentials(organizationId: string): Promise<{
    rotated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      rotated: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      const connections = await prisma.integrationConnection.findMany({
        where: {
          integration: {
            organizationId,
          },
          status: "connected",
        },
      });

      for (const connection of connections) {
        try {
          const metadata = this.decryptData(connection.settings as string);

          if (this.needsKeyRotation(metadata)) {
            const credentials = this.decryptData(
              connection.credentials as string,
            );
            await this.rotateCredentials(
              connection.id,
              credentials,
              organizationId,
            );
            result.rotated++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Connection ${connection.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Bulk rotation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }
}
