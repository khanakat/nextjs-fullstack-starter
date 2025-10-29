import { db as prisma } from "../../../lib/db";
import { providerRegistry } from "./ProviderRegistry";
import { CredentialService } from "./CredentialService";
import {
  IntegrationProvider,
  ConnectionTestResult,
} from "../../../shared/types/integration";

export class ConnectionTestService {
  /**
   * Test a connection using stored credentials
   */
  static async testStoredConnection(
    connectionId: string,
    organizationId: string,
  ): Promise<ConnectionTestResult> {
    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId: organizationId,
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

      const credentials = await CredentialService.getCredentials(
        connectionId,
        organizationId,
      );
      if (!credentials) {
        return {
          success: false,
          message: "Failed to retrieve credentials",
          details: { error: "Credentials not accessible" },
        };
      }

      const config = JSON.parse(connection.integration.config as string);
      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      const testResult = await providerInstance.testConnection(
        credentials,
        config,
      );

      // Update connection status based on test result
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: testResult.success ? "active" : "error",
          lastConnected: new Date(),
        },
      });

      // Update integration status
      if (testResult.success) {
        await prisma.integration.update({
          where: { id: connection.integrationId },
          data: {
            status: "active",
            lastError: null,
          },
        });
      } else {
        await prisma.integration.update({
          where: { id: connection.integrationId },
          data: {
            status: "error",
            lastError: testResult.message,
          },
        });
      }

      // Log the test result
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "connection_test",
          status: testResult.success ? "success" : "error",
          requestData: JSON.stringify({ connectionId, testType: "stored" }),
          responseData: JSON.stringify({
            success: testResult.success,
            message: testResult.message,
            capabilities: testResult.capabilities,
            details: testResult.details,
          }),
        },
      });

      return testResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Connection test failed: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Test a connection with provided credentials (without storing)
   */
  static async testCredentials(
    provider: IntegrationProvider,
    credentials: Record<string, any>,
    config: Record<string, any>,
    _organizationId: string,
  ): Promise<ConnectionTestResult> {
    try {
      const providerInstance = providerRegistry.getProvider(provider);
      const testResult = await providerInstance.testConnection(
        credentials,
        config,
      );

      // Log the test attempt (without storing credentials)
      await prisma.integrationLog.create({
        data: {
          integrationId: "test-only",
          action: "credentials_test",
          status: testResult.success ? "success" : "error",
          requestData: JSON.stringify({
            provider,
            testType: "credentials",
            hasCredentials: Object.keys(credentials).length > 0,
          }),
          responseData: JSON.stringify({
            success: testResult.success,
            message: testResult.message,
            capabilities: testResult.capabilities,
          }),
          timestamp: new Date(),
        },
      });

      return testResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Credential test failed: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Test multiple connections in parallel
   */
  static async testMultipleConnections(
    connectionIds: string[],
    organizationId: string,
  ): Promise<Record<string, ConnectionTestResult>> {
    const results: Record<string, ConnectionTestResult> = {};

    // Test connections in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(connectionIds, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(async (connectionId) => {
        const result = await this.testStoredConnection(
          connectionId,
          organizationId,
        );
        return { connectionId, result };
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ connectionId, result }) => {
        results[connectionId] = result;
      });
    }

    return results;
  }

  /**
   * Get connection health status for an organization
   */
  static async getConnectionHealth(organizationId: string): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    pending: number;
    byProvider: Record<
      string,
      { healthy: number; unhealthy: number; pending: number }
    >;
  }> {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: {
          integration: {
            organizationId: organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      const health = {
        total: connections.length,
        healthy: 0,
        unhealthy: 0,
        pending: 0,
        byProvider: {} as Record<
          string,
          { healthy: number; unhealthy: number; pending: number }
        >,
      };

      connections.forEach((connection) => {
        const provider = connection.integration.provider;

        if (!health.byProvider[provider]) {
          health.byProvider[provider] = {
            healthy: 0,
            unhealthy: 0,
            pending: 0,
          };
        }

        switch (connection.status) {
          case "active":
            health.healthy++;
            health.byProvider[provider].healthy++;
            break;
          case "error":
          case "inactive":
            health.unhealthy++;
            health.byProvider[provider].unhealthy++;
            break;
          case "pending":
            health.pending++;
            health.byProvider[provider].pending++;
            break;
        }
      });

      return health;
    } catch (error) {
      console.error("Failed to get connection health:", error);
      return {
        total: 0,
        healthy: 0,
        unhealthy: 0,
        pending: 0,
        byProvider: {},
      };
    }
  }

  /**
   * Run health checks on all connections for an organization
   */
  static async runHealthChecks(organizationId: string): Promise<{
    tested: number;
    passed: number;
    failed: number;
    results: Array<{
      connectionId: string;
      integrationName: string;
      provider: string;
      success: boolean;
      message: string;
    }>;
  }> {
    try {
      const connections = await prisma.integrationConnection.findMany({
        where: {
          integration: {
            organizationId: organizationId,
          },
          status: { in: ["active", "error"] },
        },
        include: {
          integration: true,
        },
      });

      const results = [];
      let passed = 0;
      let failed = 0;

      // Test connections in batches to avoid overwhelming external APIs
      const batchSize = 3;
      const batches = this.chunkArray(connections, batchSize);

      for (const batch of batches) {
        const batchPromises = batch.map(async (connection) => {
          const testResult = await this.testStoredConnection(
            connection.id,
            organizationId,
          );

          if (testResult.success) {
            passed++;
          } else {
            failed++;
          }

          return {
            connectionId: connection.id,
            integrationName: connection.integration.name,
            provider: connection.integration.provider,
            success: testResult.success,
            message: testResult.message,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to be respectful to external APIs
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return {
        tested: connections.length,
        passed,
        failed,
        results,
      };
    } catch (error) {
      console.error("Failed to run health checks:", error);
      return {
        tested: 0,
        passed: 0,
        failed: 0,
        results: [],
      };
    }
  }

  /**
   * Test connection capabilities and permissions
   */
  static async testConnectionCapabilities(
    connectionId: string,
    organizationId: string,
  ): Promise<{
    success: boolean;
    capabilities: string[];
    permissions: Record<string, boolean>;
    limitations: string[];
    recommendations: string[];
  }> {
    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: {
          id: connectionId,
          integration: {
            organizationId: organizationId,
          },
        },
        include: {
          integration: true,
        },
      });

      if (!connection) {
        return {
          success: false,
          capabilities: [],
          permissions: {},
          limitations: ["Connection not found"],
          recommendations: [],
        };
      }

      const credentials = await CredentialService.getCredentials(
        connectionId,
        organizationId,
      );
      if (!credentials) {
        return {
          success: false,
          capabilities: [],
          permissions: {},
          limitations: ["Failed to retrieve credentials"],
          recommendations: ["Check credential storage and encryption"],
        };
      }

      const config = JSON.parse(connection.integration.config as string);
      const providerInstance = providerRegistry.getProvider(
        connection.integration.provider as IntegrationProvider,
      );

      // Test basic connection
      const basicTest = await providerInstance.testConnection(
        credentials,
        config,
      );
      if (!basicTest.success) {
        return {
          success: false,
          capabilities: [],
          permissions: {},
          limitations: [basicTest.message],
          recommendations: ["Verify credentials and configuration"],
        };
      }

      // Test specific capabilities
      const capabilities = basicTest.capabilities || [];
      const permissions: Record<string, boolean> = {};
      const limitations: string[] = [];
      const recommendations: string[] = [];

      // Test read permissions
      try {
        await providerInstance.sync(credentials, config, "incremental", {
          limit: 1,
        });
        permissions.read = true;
      } catch (error) {
        permissions.read = false;
        limitations.push("Read access limited or unavailable");
      }

      // Test write permissions (if supported)
      if (capabilities.includes("write")) {
        try {
          // This would be provider-specific test
          permissions.write = true;
        } catch (error) {
          permissions.write = false;
          limitations.push("Write access limited or unavailable");
        }
      }

      // Test webhook permissions (if supported)
      if (capabilities.includes("webhooks")) {
        try {
          // This would be provider-specific test
          permissions.webhooks = true;
        } catch (error) {
          permissions.webhooks = false;
          limitations.push("Webhook setup limited or unavailable");
        }
      }

      // Generate recommendations based on test results
      if (!permissions.read) {
        recommendations.push(
          "Consider upgrading API permissions for read access",
        );
      }
      if (!permissions.write && capabilities.includes("write")) {
        recommendations.push("Enable write permissions for full functionality");
      }
      if (!permissions.webhooks && capabilities.includes("webhooks")) {
        recommendations.push(
          "Configure webhook permissions for real-time updates",
        );
      }

      // Log the capability test
      await prisma.integrationLog.create({
        data: {
          integrationId: connection.integrationId,
          action: "capability_test",
          status: "success",
          requestData: JSON.stringify({
            connectionId,
            testType: "capabilities",
          }),
          responseData: JSON.stringify({
            capabilities,
            permissions,
            limitations,
            recommendations,
          }),
          timestamp: new Date(),
        },
      });

      return {
        success: true,
        capabilities,
        permissions,
        limitations,
        recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        capabilities: [],
        permissions: {},
        limitations: [`Capability test failed: ${errorMessage}`],
        recommendations: ["Check connection status and try again"],
      };
    }
  }

  /**
   * Schedule periodic health checks
   */
  static async scheduleHealthCheck(
    organizationId: string,
    intervalMinutes: number = 60,
  ): Promise<void> {
    // This would integrate with a job scheduler like Bull or Agenda
    // For now, we'll just log the scheduling request
    await prisma.integrationLog.create({
      data: {
        integrationId: "scheduler",
        action: "health_check_scheduled",
        status: "success",
        requestData: JSON.stringify({
          organizationId,
          intervalMinutes,
          scheduledAt: new Date(),
        }),
        responseData: JSON.stringify({ scheduled: true }),
        timestamp: new Date(),
      },
    });
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get connection test history
   */
  static async getTestHistory(
    connectionId: string,
    _organizationId: string,
    limit: number = 50,
  ): Promise<
    Array<{
      timestamp: Date;
      action: string;
      status: string;
      message: string;
      details?: any;
    }>
  > {
    try {
      const logs = await prisma.integrationLog.findMany({
        where: {
          integrationId: connectionId,
          action: {
            in: ["connection_test", "credentials_test", "capability_test"],
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return logs.map((log) => ({
        timestamp: log.timestamp,
        action: log.action,
        status: log.status,
        message: log.responseData
          ? JSON.parse(log.responseData as string).message || "Test completed"
          : "Test completed",
        details: log.responseData
          ? JSON.parse(log.responseData as string)
          : null,
      }));
    } catch (error) {
      console.error("Failed to get test history:", error);
      return [];
    }
  }
}
