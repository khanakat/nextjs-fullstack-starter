import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";
import crypto from "crypto";

export class SalesforceProvider extends BaseIntegrationProvider {
  readonly name = "Salesforce";
  readonly type = "crm";
  readonly category = "sales";
  readonly supportedFeatures = [
    "accounts",
    "contacts",
    "leads",
    "opportunities",
    "cases",
    "tasks",
    "events",
    "custom_objects",
  ];

  private readonly baseUrl = "https://login.salesforce.com";
  private readonly sandboxUrl = "https://test.salesforce.com";
  private readonly authPath = "/services/oauth2/authorize";
  private readonly tokenPath = "/services/oauth2/token";

  async testConnection(
    credentials: Record<string, any>,
    config: Record<string, any>,
  ): Promise<ConnectionTestResult> {
    try {
      const instanceUrl = credentials.instance_url || config.instanceUrl;

      const response = await this.makeRequest(
        `${instanceUrl}/services/data/v58.0/`,
        { method: "GET" },
        credentials,
      );

      if (!response.ok) {
        return {
          success: false,
          message: `Authentication failed: ${response.status} ${response.statusText}`,
          details: { status: response.status },
        };
      }

      const data = await response.json();

      // Get organization info
      const orgResponse = await this.makeRequest(
        `${instanceUrl}/services/data/v58.0/query?q=SELECT Id,Name,OrganizationType FROM Organization LIMIT 1`,
        { method: "GET" },
        credentials,
      );

      const orgData = await orgResponse.json();
      const organization = orgData.records?.[0];

      return {
        success: true,
        message: `Connected to ${organization?.Name || "Salesforce"} (${organization?.OrganizationType || "Unknown"})`,
        details: {
          instanceUrl,
          organization,
          apiVersion: "58.0",
          availableResources: data,
        },
        capabilities: this.supportedFeatures,
        rateLimits: (await this.getRateLimitInfo(credentials)) || undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async getOAuthAuthorizationUrl(
    config: Record<string, any>,
    state: string,
  ): Promise<OAuthAuthorizationUrl> {
    const baseUrl = config.isSandbox ? this.sandboxUrl : this.baseUrl;
    const scopes = config.scopes || ["api", "refresh_token"];

    const authUrl = this.buildOAuthUrl(
      `${baseUrl}${this.authPath}`,
      config.clientId,
      config.redirectUri,
      scopes,
      state,
    );

    return {
      authUrl,
      state,
    };
  }

  async handleOAuthCallback(
    code: string,
    _state: string,
    config: Record<string, any>,
  ): Promise<Record<string, any>> {
    const baseUrl = config.isSandbox ? this.sandboxUrl : this.baseUrl;

    const tokens = await this.exchangeCodeForTokens(
      `${baseUrl}${this.tokenPath}`,
      config.clientId,
      config.clientSecret,
      code,
      config.redirectUri,
    );

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      instance_url: tokens.instance_url,
      id: tokens.id,
      token_type: tokens.token_type,
      issued_at: tokens.issued_at,
      signature: tokens.signature,
      expires_at: null, // Salesforce tokens don't expire by default
    };
  }

  async sync(
    credentials: Record<string, any>,
    config: Record<string, any>,
    syncType: "full" | "incremental",
    options?: Record<string, any>,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: Array<{ record: any; error: string }> = [];
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    try {
      const features = config.features || {};
      const instanceUrl = credentials.instance_url;

      // Sync accounts if enabled
      if (features.accounts) {
        try {
          const accountsResult = await this.syncSalesforceObject(
            credentials,
            instanceUrl,
            "Account",
            syncType,
            options?.since,
          );
          recordsProcessed += accountsResult.processed;
          recordsCreated += accountsResult.created;
          recordsUpdated += accountsResult.updated;
          errors.push(...accountsResult.errors);
        } catch (error) {
          errors.push({
            record: "accounts",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync contacts if enabled
      if (features.contacts) {
        try {
          const contactsResult = await this.syncSalesforceObject(
            credentials,
            instanceUrl,
            "Contact",
            syncType,
            options?.since,
          );
          recordsProcessed += contactsResult.processed;
          recordsCreated += contactsResult.created;
          recordsUpdated += contactsResult.updated;
          errors.push(...contactsResult.errors);
        } catch (error) {
          errors.push({
            record: "contacts",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync leads if enabled
      if (features.leads) {
        try {
          const leadsResult = await this.syncSalesforceObject(
            credentials,
            instanceUrl,
            "Lead",
            syncType,
            options?.since,
          );
          recordsProcessed += leadsResult.processed;
          recordsCreated += leadsResult.created;
          recordsUpdated += leadsResult.updated;
          errors.push(...leadsResult.errors);
        } catch (error) {
          errors.push({
            record: "leads",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync opportunities if enabled
      if (features.opportunities) {
        try {
          const opportunitiesResult = await this.syncSalesforceObject(
            credentials,
            instanceUrl,
            "Opportunity",
            syncType,
            options?.since,
          );
          recordsProcessed += opportunitiesResult.processed;
          recordsCreated += opportunitiesResult.created;
          recordsUpdated += opportunitiesResult.updated;
          errors.push(...opportunitiesResult.errors);
        } catch (error) {
          errors.push({
            record: "opportunities",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        success: errors.length === 0,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted: 0,
        errors,
        duration: Date.now() - startTime,
        nextSyncAt: new Date(Date.now() + 30 * 60 * 1000), // Next sync in 30 minutes
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted: 0,
        errors: [
          {
            record: "sync",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
        duration: Date.now() - startTime,
      };
    }
  }

  async executeAction(
    action: string,
    credentials: Record<string, any>,
    _config: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const instanceUrl = credentials.instance_url;

    switch (action) {
      case "create_record":
        return await this.createRecord(credentials, instanceUrl, parameters);
      case "update_record":
        return await this.updateRecord(credentials, instanceUrl, parameters);
      case "delete_record":
        return await this.deleteRecord(credentials, instanceUrl, parameters);
      case "query_records":
        return await this.queryRecords(credentials, instanceUrl, parameters);
      case "get_record":
        return await this.getRecord(credentials, instanceUrl, parameters);
      default:
        throw new Error(
          `Action ${action} not supported by Salesforce provider`,
        );
    }
  }

  getAvailableScopes(): string[] {
    return [
      "api",
      "web",
      "full",
      "chatter_api",
      "custom_permissions",
      "refresh_token",
      "openid",
      "profile",
      "email",
      "address",
      "phone",
    ];
  }

  getDefaultConfig(): Record<string, any> {
    return {
      features: {
        accounts: true,
        contacts: true,
        leads: true,
        opportunities: true,
        cases: false,
        tasks: false,
        events: false,
      },
      scopes: ["api", "refresh_token"],
      isSandbox: false,
      apiVersion: "58.0",
    };
  }

  getSupportedWebhookEvents(): string[] {
    return [
      "record_created",
      "record_updated",
      "record_deleted",
      "record_undeleted",
    ];
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    // Salesforce uses HMAC-SHA256 for webhook verification
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async processWebhook(
    event: string,
    payload: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<{ processed: boolean; data?: any; error?: string }> {
    try {
      switch (event) {
        case "record_created":
        case "record_updated":
        case "record_deleted":
        case "record_undeleted":
          return {
            processed: true,
            data: {
              type: event,
              objectType: payload.sobject?.type,
              recordId: payload.sobject?.id,
              fields: payload.sobject?.fields,
              timestamp: payload.createdDate,
            },
          };
        default:
          return {
            processed: true,
            data: { type: event, payload },
          };
      }
    } catch (error) {
      return {
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getProviderMetadata() {
    return {
      displayName: "Salesforce",
      description:
        "Connect with Salesforce to sync CRM data including accounts, contacts, leads, and opportunities",
      iconUrl:
        "https://c1.sfdcstatic.com/content/dam/web/en_us/www/images/nav/salesforce-cloud-logo-sm.png",
      websiteUrl: "https://salesforce.com",
      documentationUrl:
        "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
      setupInstructions: `
        1. Log in to your Salesforce org and go to Setup
        2. Navigate to App Manager and create a new Connected App
        3. Enable OAuth Settings and add the required scopes
        4. Set the callback URL to your application's redirect URI
        5. Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)
        6. For sandbox environments, check the "Sandbox" option during setup
      `,
    };
  }

  // Private helper methods

  private async syncSalesforceObject(
    credentials: Record<string, any>,
    instanceUrl: string,
    objectType: string,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let query = `SELECT Id,Name,CreatedDate,LastModifiedDate FROM ${objectType}`;

    if (syncType === "incremental" && since) {
      query += ` WHERE LastModifiedDate > ${since}`;
    }

    query += " ORDER BY LastModifiedDate DESC LIMIT 1000";

    const response = await this.makeRequest(
      `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync ${objectType}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.records?.length || 0,
      created: data.records?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async createRecord(
    credentials: Record<string, any>,
    instanceUrl: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { objectType, fields } = parameters;

    const response = await this.makeRequest(
      `${instanceUrl}/services/data/v58.0/sobjects/${objectType}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      },
      credentials,
    );

    return await response.json();
  }

  private async updateRecord(
    credentials: Record<string, any>,
    instanceUrl: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { objectType, recordId, fields } = parameters;

    const response = await this.makeRequest(
      `${instanceUrl}/services/data/v58.0/sobjects/${objectType}/${recordId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      },
      credentials,
    );

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  private async deleteRecord(
    credentials: Record<string, any>,
    instanceUrl: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { objectType, recordId } = parameters;

    const response = await this.makeRequest(
      `${instanceUrl}/services/data/v58.0/sobjects/${objectType}/${recordId}`,
      { method: "DELETE" },
      credentials,
    );

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  private async queryRecords(
    credentials: Record<string, any>,
    instanceUrl: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { query } = parameters;

    const response = await this.makeRequest(
      `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`,
      { method: "GET" },
      credentials,
    );

    return await response.json();
  }

  private async getRecord(
    credentials: Record<string, any>,
    instanceUrl: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { objectType, recordId, fields } = parameters;
    let url = `${instanceUrl}/services/data/v58.0/sobjects/${objectType}/${recordId}`;

    if (fields) {
      url += `?fields=${fields.join(",")}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );
    return await response.json();
  }

  async getRateLimitInfo(
    credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    try {
      const instanceUrl = credentials.instance_url;
      const response = await this.makeRequest(
        `${instanceUrl}/services/data/v58.0/limits`,
        { method: "GET" },
        credentials,
      );

      if (response.ok) {
        const data = await response.json();
        const apiRequests = data.DailyApiRequests;

        return {
          remaining: apiRequests.Remaining,
          reset: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset in 24 hours
          limit: apiRequests.Max,
        };
      }
    } catch (error) {
      // Fallback to default values if limits endpoint fails
    }

    return {
      remaining: 15000,
      reset: new Date(Date.now() + 24 * 60 * 60 * 1000),
      limit: 15000,
    };
  }
}
