import { PrismaClient } from "@prisma/client";
import {
  Integration,
  IntegrationConnection,
  IntegrationWebhook,
  IntegrationLog,
  IntegrationTemplate,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateConnectionRequest,
  CreateWebhookRequest,
  TestConnectionRequest,
  SyncRequest,
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
  IntegrationAnalytics,
} from "../../shared/types/integration";
import { AuditService } from "../../lib/services/audit";
import { BaseIntegrationProvider } from "./integrations/BaseIntegrationProvider";
import { SlackProvider } from "./integrations/SlackProvider";
import { SalesforceProvider } from "./integrations/SalesforceProvider";
import { JiraProvider } from "./integrations/JiraProvider";
import { GoogleDriveProvider } from "./integrations/GoogleDriveProvider";
import { StripeProvider } from "./integrations/StripeProvider";
import { WebhookProvider } from "./integrations/WebhookProvider";
import crypto from "crypto";

export class IntegrationService {
  private prisma: PrismaClient;
  private providers: Map<string, BaseIntegrationProvider>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    // Communication providers
    this.providers.set("slack", new SlackProvider());

    // CRM providers
    this.providers.set("salesforce", new SalesforceProvider());

    // Project management providers
    this.providers.set("jira", new JiraProvider());

    // Storage providers
    this.providers.set("google_drive", new GoogleDriveProvider());

    // Payment providers
    this.providers.set("stripe", new StripeProvider());

    // Custom webhook provider
    this.providers.set("webhook", new WebhookProvider());
  }

  // ============================================================================
  // INTEGRATION MANAGEMENT
  // ============================================================================

  async createIntegration(
    request: CreateIntegrationRequest,
    organizationId: string,
    userId: string,
  ): Promise<Integration> {
    try {
      const integration = await this.prisma.integration.create({
        data: {
          name: request.name,
          description: request.description,
          provider: request.provider,
          type: request.type,
          category: request.category,
          config: JSON.stringify(request.config || {}),
          settings: JSON.stringify(request.settings || {}),
          organizationId,
          createdBy: userId,
          status: "inactive",
        },
        include: {
          connections: true,
          webhooks: true,
        },
      });

      // Log the action
      await AuditService.log({
        action: "CREATE",
        resource: "Integration",
        resourceId: integration.id,
        userId,
        organizationId,
        newValues: integration,
        metadata: { provider: request.provider, type: request.type },
      });

      return this.mapIntegrationFromDb(integration);
    } catch (error) {
      await this.logError("createIntegration", error, {
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  async getIntegration(
    integrationId: string,
    organizationId: string,
  ): Promise<Integration | null> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: {
          id: integrationId,
          organizationId,
        },
        include: {
          connections: true,
          webhooks: true,
          logs: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
      });

      return integration ? this.mapIntegrationFromDb(integration) : null;
    } catch (error) {
      await this.logError("getIntegration", error, {
        integrationId,
        organizationId,
      });
      throw error;
    }
  }

  async listIntegrations(
    organizationId: string,
    filters?: {
      provider?: string;
      type?: string;
      category?: string;
      status?: string;
      search?: string;
    },
    pagination?: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ): Promise<{ integrations: Integration[]; total: number }> {
    try {
      const where: any = { organizationId };

      if (filters) {
        if (filters.provider) where.provider = filters.provider;
        if (filters.type) where.type = filters.type;
        if (filters.category) where.category = filters.category;
        if (filters.status) where.status = filters.status;
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ];
        }
      }

      const orderBy: any = {};
      if (pagination?.sortBy) {
        orderBy[pagination.sortBy] = pagination.sortOrder || "desc";
      } else {
        orderBy.createdAt = "desc";
      }

      const [integrations, total] = await Promise.all([
        this.prisma.integration.findMany({
          where,
          include: {
            connections: true,
            webhooks: true,
          },
          orderBy,
          skip: pagination ? (pagination.page - 1) * pagination.limit : 0,
          take: pagination?.limit || 20,
        }),
        this.prisma.integration.count({ where }),
      ]);

      return {
        integrations: integrations.map(this.mapIntegrationFromDb),
        total,
      };
    } catch (error) {
      await this.logError("listIntegrations", error, {
        organizationId,
        filters,
        pagination,
      });
      throw error;
    }
  }

  async updateIntegration(
    integrationId: string,
    request: UpdateIntegrationRequest,
    organizationId: string,
    userId: string,
  ): Promise<Integration> {
    try {
      const existingIntegration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!existingIntegration) {
        throw new Error("Integration not found");
      }

      const updateData: any = {};
      if (request.name !== undefined) updateData.name = request.name;
      if (request.description !== undefined)
        updateData.description = request.description;
      if (request.config !== undefined)
        updateData.config = JSON.stringify(request.config);
      if (request.settings !== undefined)
        updateData.settings = JSON.stringify(request.settings);
      if (request.isEnabled !== undefined)
        updateData.isEnabled = request.isEnabled;

      const integration = await this.prisma.integration.update({
        where: { id: integrationId },
        data: updateData,
        include: {
          connections: true,
          webhooks: true,
        },
      });

      // Log the action
      await AuditService.log({
        action: "UPDATE",
        resource: "Integration",
        resourceId: integration.id,
        userId,
        organizationId,
        oldValues: existingIntegration,
        newValues: integration,
        metadata: { changes: Object.keys(updateData) },
      });

      return this.mapIntegrationFromDb(integration);
    } catch (error) {
      await this.logError("updateIntegration", error, {
        integrationId,
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  async deleteIntegration(
    integrationId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      await this.prisma.integration.delete({
        where: { id: integrationId },
      });

      // Log the action
      await AuditService.log({
        action: "DELETE",
        resource: "Integration",
        resourceId: integrationId,
        userId,
        organizationId,
        oldValues: integration,
        metadata: { provider: integration.provider },
      });
    } catch (error) {
      await this.logError("deleteIntegration", error, {
        integrationId,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  async createConnection(
    integrationId: string,
    request: CreateConnectionRequest,
    organizationId: string,
    userId: string,
  ): Promise<IntegrationConnection> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      // Encrypt credentials
      const encryptedCredentials = this.encryptCredentials(request.credentials);

      const connection = await this.prisma.integrationConnection.create({
        data: {
          integrationId,
          connectionName: request.connectionName,
          connectionType: request.connectionType,
          credentials: JSON.stringify(encryptedCredentials),
          settings: JSON.stringify(request.settings || {}),
          scopes: JSON.stringify(request.scopes || []),
          status: "connected",
        },
      });

      // Log the action
      await AuditService.log({
        action: "CREATE",
        resource: "IntegrationConnection",
        resourceId: connection.id,
        userId,
        organizationId,
        newValues: { ...connection, credentials: "[ENCRYPTED]" },
        metadata: { integrationId, connectionType: request.connectionType },
      });

      return this.mapConnectionFromDb(connection);
    } catch (error) {
      await this.logError("createConnection", error, {
        integrationId,
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  async testConnection(
    integrationId: string,
    request: TestConnectionRequest,
    organizationId: string,
    userId: string,
  ): Promise<ConnectionTestResult> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider ${integration.provider} not supported`);
      }

      let credentials: Record<string, any>;

      if (request.connectionId) {
        const connection = await this.prisma.integrationConnection.findFirst({
          where: { id: request.connectionId, integrationId },
        });
        if (!connection) {
          throw new Error("Connection not found");
        }
        credentials = this.decryptCredentials(
          JSON.parse(connection.credentials),
        );
      } else if (request.credentials) {
        credentials = request.credentials;
      } else {
        throw new Error("Either connectionId or credentials must be provided");
      }

      const result = await provider.testConnection(
        credentials,
        JSON.parse(integration.config),
      );

      // Log the test
      await this.logIntegrationAction(
        integrationId,
        "connection_test",
        result.success ? "success" : "error",
        { result },
        userId,
      );

      return result;
    } catch (error) {
      await this.logError("testConnection", error, {
        integrationId,
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  // ============================================================================
  // OAUTH FLOW HANDLING
  // ============================================================================

  async getOAuthAuthorizationUrl(
    integrationId: string,
    organizationId: string,
    userId: string,
  ): Promise<OAuthAuthorizationUrl> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider ${integration.provider} not supported`);
      }

      const config = JSON.parse(integration.config);
      const state = crypto.randomBytes(32).toString("hex");

      // Store state for verification
      await this.prisma.integrationLog.create({
        data: {
          integrationId,
          action: "oauth_state_generated",
          status: "success",
          requestData: JSON.stringify({ state, userId }),
          timestamp: new Date(),
        },
      });

      const authUrl = await provider.getOAuthAuthorizationUrl(config, state);

      return {
        authUrl: authUrl.authUrl,
        state,
        codeVerifier: authUrl.codeVerifier,
      };
    } catch (error) {
      await this.logError("getOAuthAuthorizationUrl", error, {
        integrationId,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  async handleOAuthCallback(
    integrationId: string,
    code: string,
    state: string,
    organizationId: string,
    userId: string,
  ): Promise<IntegrationConnection> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      // Verify state
      const stateLog = await this.prisma.integrationLog.findFirst({
        where: {
          integrationId,
          action: "oauth_state_generated",
          requestData: { contains: state },
        },
        orderBy: { timestamp: "desc" },
      });

      if (!stateLog) {
        throw new Error("Invalid OAuth state");
      }

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider ${integration.provider} not supported`);
      }

      const config = JSON.parse(integration.config);
      const tokens = await provider.handleOAuthCallback(code, state, config);

      // Create connection with tokens
      const encryptedCredentials = this.encryptCredentials(tokens);

      const connection = await this.prisma.integrationConnection.create({
        data: {
          integrationId,
          connectionName: "OAuth Connection",
          connectionType: "oauth",
          credentials: JSON.stringify(encryptedCredentials),
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_at
            ? new Date(tokens.expires_at * 1000)
            : undefined,
          scopes: JSON.stringify(tokens.scope?.split(" ") || []),
          status: "connected",
        },
      });

      // Update integration status
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: "active" },
      });

      // Log the action
      await AuditService.log({
        action: "OAUTH_CONNECTED",
        resource: "IntegrationConnection",
        resourceId: connection.id,
        userId,
        organizationId,
        newValues: { ...connection, credentials: "[ENCRYPTED]" },
        metadata: { integrationId, provider: integration.provider },
      });

      return this.mapConnectionFromDb(connection);
    } catch (error) {
      await this.logError("handleOAuthCallback", error, {
        integrationId,
        code,
        state,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  async createWebhook(
    integrationId: string,
    request: CreateWebhookRequest,
    organizationId: string,
    userId: string,
  ): Promise<IntegrationWebhook> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      const webhook = await this.prisma.integrationWebhook.create({
        data: {
          integrationId,
          name: request.name,
          url: request.url,
          method: request.method || "POST",
          events: JSON.stringify(request.events),
          filters: JSON.stringify(request.filters || {}),
          secret: request.secret,
          headers: JSON.stringify(request.headers || {}),
          retryPolicy: JSON.stringify(request.retryPolicy || {}),
          timeout: request.timeout || 30,
          status: "active",
        },
      });

      // Log the action
      await AuditService.log({
        action: "CREATE",
        resource: "IntegrationWebhook",
        resourceId: webhook.id,
        userId,
        organizationId,
        newValues: webhook,
        metadata: { integrationId, events: request.events },
      });

      return this.mapWebhookFromDb(webhook);
    } catch (error) {
      await this.logError("createWebhook", error, {
        integrationId,
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  // ============================================================================
  // SYNCHRONIZATION
  // ============================================================================

  async syncIntegration(
    integrationId: string,
    request: SyncRequest,
    organizationId: string,
    userId: string,
  ): Promise<SyncResult> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
        include: { connections: true },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      if (!integration.connections.length) {
        throw new Error("No connections available for sync");
      }

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider ${integration.provider} not supported`);
      }

      const connection = integration.connections[0];
      const credentials = this.decryptCredentials(
        JSON.parse(connection.credentials),
      );
      const config = JSON.parse(integration.config);

      const startTime = Date.now();
      const result = await provider.sync(
        credentials,
        config,
        request.syncType,
        request.options,
      );
      const duration = Date.now() - startTime;

      // Update integration last sync
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSync: new Date(),
          status: result.success ? "active" : "error",
          lastError: result.success ? null : result.errors[0]?.error,
        },
      });

      // Log the sync
      await this.logIntegrationAction(
        integrationId,
        "sync",
        result.success ? "success" : "error",
        {
          syncType: request.syncType,
          result: {
            ...result,
            duration,
          },
        },
        userId,
      );

      return {
        ...result,
        duration,
      };
    } catch (error) {
      await this.logError("syncIntegration", error, {
        integrationId,
        request,
        organizationId,
        userId,
      });
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getIntegrationAnalytics(
    integrationId: string,
    organizationId: string,
    period: { start: Date; end: Date },
  ): Promise<IntegrationAnalytics> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { id: integrationId, organizationId },
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      const logs = await this.prisma.integrationLog.findMany({
        where: {
          integrationId,
          timestamp: {
            gte: period.start,
            lte: period.end,
          },
        },
        orderBy: { timestamp: "asc" },
      });

      const totalRequests = logs.length;
      const successfulRequests = logs.filter(
        (log) => log.status === "success",
      ).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime =
        logs
          .filter((log) => log.duration)
          .reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length ||
        0;

      const webhooksTriggered = logs.filter(
        (log) => log.action === "webhook_trigger",
      ).length;
      const syncOperations = logs.filter((log) => log.action === "sync").length;

      // Group logs by hour for trends
      const requestsOverTime = this.groupLogsByTime(logs, "hour");
      const errorLogs = logs.filter((log) => log.status === "error");
      const errorRateOverTime = this.calculateErrorRateOverTime(
        logs,
        errorLogs,
        "hour",
      );

      // Top errors
      const errorCounts = new Map<string, number>();
      const errorLastOccurred = new Map<string, Date>();

      errorLogs.forEach((log) => {
        const error = log.errorMessage || "Unknown error";
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
        const current = errorLastOccurred.get(error);
        if (!current || log.timestamp > current) {
          errorLastOccurred.set(error, log.timestamp);
        }
      });

      const topErrors = Array.from(errorCounts.entries())
        .map(([error, count]) => ({
          error,
          count,
          lastOccurred: errorLastOccurred.get(error)!,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        integrationId,
        period,
        metrics: {
          totalRequests,
          successfulRequests,
          failedRequests,
          averageResponseTime,
          dataTransferred: 0, // TODO: Calculate from logs
          webhooksTriggered,
          syncOperations,
        },
        trends: {
          requestsOverTime,
          errorRateOverTime,
        },
        topErrors,
      };
    } catch (error) {
      await this.logError("getIntegrationAnalytics", error, {
        integrationId,
        organizationId,
        period,
      });
      throw error;
    }
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getIntegrationTemplates(filters?: {
    provider?: string;
    type?: string;
    category?: string;
    search?: string;
  }): Promise<IntegrationTemplate[]> {
    try {
      const where: any = { isPublic: true };

      if (filters) {
        if (filters.provider) where.provider = filters.provider;
        if (filters.type) where.type = filters.type;
        if (filters.category) where.category = filters.category;
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ];
        }
      }

      const templates = await this.prisma.integrationTemplate.findMany({
        where,
        orderBy: [
          { usageCount: "desc" },
          { rating: "desc" },
          { createdAt: "desc" },
        ],
      });

      return templates.map(this.mapTemplateFromDb);
    } catch (error) {
      await this.logError("getIntegrationTemplates", error, { filters });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private encryptCredentials(
    credentials: Record<string, any>,
  ): Record<string, any> {
    // TODO: Implement proper encryption
    // For now, just return as-is (in production, use proper encryption)
    return credentials;
  }

  private decryptCredentials(
    encryptedCredentials: Record<string, any>,
  ): Record<string, any> {
    // TODO: Implement proper decryption
    // For now, just return as-is (in production, use proper decryption)
    return encryptedCredentials;
  }

  private async logIntegrationAction(
    integrationId: string,
    action: string,
    status: string,
    data: any,
    userId?: string,
  ): Promise<void> {
    await this.prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestData: JSON.stringify(data),
        userId,
        timestamp: new Date(),
      },
    });
  }

  private async logError(
    method: string,
    error: any,
    context: any,
  ): Promise<void> {
    console.error(`IntegrationService.${method}:`, error);

    if (context.integrationId) {
      await this.logIntegrationAction(
        context.integrationId,
        method,
        "error",
        { error: error.message, context },
        context.userId,
      );
    }
  }

  private groupLogsByTime(
    logs: any[],
    interval: "hour" | "day",
  ): Array<{ timestamp: Date; count: number }> {
    const groups = new Map<string, number>();

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      let key: string;

      if (interval === "hour") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }

      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Array.from(groups.entries()).map(([key, count]) => {
      const parts = key.split("-").map(Number);
      const timestamp =
        interval === "hour"
          ? new Date(parts[0], parts[1], parts[2], parts[3])
          : new Date(parts[0], parts[1], parts[2]);

      return { timestamp, count };
    });
  }

  private calculateErrorRateOverTime(
    allLogs: any[],
    errorLogs: any[],
    interval: "hour" | "day",
  ): Array<{ timestamp: Date; rate: number }> {
    const allGroups = this.groupLogsByTime(allLogs, interval);
    const errorGroups = this.groupLogsByTime(errorLogs, interval);

    const errorMap = new Map(
      errorGroups.map((group) => [group.timestamp.getTime(), group.count]),
    );

    return allGroups.map((group) => ({
      timestamp: group.timestamp,
      rate:
        group.count > 0
          ? ((errorMap.get(group.timestamp.getTime()) || 0) / group.count) * 100
          : 0,
    }));
  }

  // Mapping methods
  private mapIntegrationFromDb(dbIntegration: any): Integration {
    return {
      id: dbIntegration.id,
      name: dbIntegration.name,
      description: dbIntegration.description,
      provider: dbIntegration.provider,
      type: dbIntegration.type,
      category: dbIntegration.category,
      config: JSON.parse(dbIntegration.config),
      settings: JSON.parse(dbIntegration.settings),
      status: dbIntegration.status,
      isEnabled: dbIntegration.isEnabled,
      lastSync: dbIntegration.lastSync,
      lastError: dbIntegration.lastError,
      organizationId: dbIntegration.organizationId,
      createdBy: dbIntegration.createdBy,
      createdAt: dbIntegration.createdAt,
      updatedAt: dbIntegration.updatedAt,
      connections: dbIntegration.connections?.map(this.mapConnectionFromDb),
      webhooks: dbIntegration.webhooks?.map(this.mapWebhookFromDb),
      logs: dbIntegration.logs?.map(this.mapLogFromDb),
    };
  }

  private mapConnectionFromDb(dbConnection: any): IntegrationConnection {
    return {
      id: dbConnection.id,
      integrationId: dbConnection.integrationId,
      connectionName: dbConnection.connectionName,
      connectionType: dbConnection.connectionType,
      credentials: JSON.parse(dbConnection.credentials),
      refreshToken: dbConnection.refreshToken,
      tokenExpiry: dbConnection.tokenExpiry,
      settings: JSON.parse(dbConnection.settings),
      scopes: JSON.parse(dbConnection.scopes),
      status: dbConnection.status,
      lastConnected: dbConnection.lastConnected,
      lastError: dbConnection.lastError,
      retryCount: dbConnection.retryCount,
      rateLimitRemaining: dbConnection.rateLimitRemaining,
      rateLimitReset: dbConnection.rateLimitReset,
      createdAt: dbConnection.createdAt,
      updatedAt: dbConnection.updatedAt,
    };
  }

  private mapWebhookFromDb(dbWebhook: any): IntegrationWebhook {
    return {
      id: dbWebhook.id,
      integrationId: dbWebhook.integrationId,
      name: dbWebhook.name,
      url: dbWebhook.url,
      method: dbWebhook.method,
      events: JSON.parse(dbWebhook.events),
      filters: JSON.parse(dbWebhook.filters),
      secret: dbWebhook.secret,
      headers: JSON.parse(dbWebhook.headers),
      retryPolicy: JSON.parse(dbWebhook.retryPolicy),
      timeout: dbWebhook.timeout,
      status: dbWebhook.status,
      isEnabled: dbWebhook.isEnabled,
      lastTriggered: dbWebhook.lastTriggered,
      lastError: dbWebhook.lastError,
      successCount: dbWebhook.successCount,
      failureCount: dbWebhook.failureCount,
      createdAt: dbWebhook.createdAt,
      updatedAt: dbWebhook.updatedAt,
    };
  }

  private mapLogFromDb(dbLog: any): IntegrationLog {
    return {
      id: dbLog.id,
      integrationId: dbLog.integrationId,
      webhookId: dbLog.webhookId,
      action: dbLog.action,
      method: dbLog.method,
      endpoint: dbLog.endpoint,
      requestData: dbLog.requestData
        ? JSON.parse(dbLog.requestData)
        : undefined,
      responseData: dbLog.responseData
        ? JSON.parse(dbLog.responseData)
        : undefined,
      requestHeaders: dbLog.requestHeaders
        ? JSON.parse(dbLog.requestHeaders)
        : undefined,
      responseHeaders: dbLog.responseHeaders
        ? JSON.parse(dbLog.responseHeaders)
        : undefined,
      status: dbLog.status,
      statusCode: dbLog.statusCode,
      duration: dbLog.duration,
      errorMessage: dbLog.errorMessage,
      errorCode: dbLog.errorCode,
      errorDetails: dbLog.errorDetails
        ? JSON.parse(dbLog.errorDetails)
        : undefined,
      userId: dbLog.userId,
      sessionId: dbLog.sessionId,
      ipAddress: dbLog.ipAddress,
      userAgent: dbLog.userAgent,
      timestamp: dbLog.timestamp,
    };
  }

  private mapTemplateFromDb(dbTemplate: any): IntegrationTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      provider: dbTemplate.provider,
      type: dbTemplate.type,
      category: dbTemplate.category,
      template: JSON.parse(dbTemplate.template),
      defaultConfig: JSON.parse(dbTemplate.defaultConfig),
      requiredScopes: JSON.parse(dbTemplate.requiredScopes),
      isBuiltIn: dbTemplate.isBuiltIn,
      isPublic: dbTemplate.isPublic,
      tags: JSON.parse(dbTemplate.tags),
      version: dbTemplate.version,
      setupGuide: dbTemplate.setupGuide,
      apiDocs: dbTemplate.apiDocs,
      supportUrl: dbTemplate.supportUrl,
      usageCount: dbTemplate.usageCount,
      rating: dbTemplate.rating,
      createdAt: dbTemplate.createdAt,
      updatedAt: dbTemplate.updatedAt,
    };
  }
}
