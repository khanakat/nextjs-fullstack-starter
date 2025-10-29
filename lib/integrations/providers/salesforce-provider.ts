import {
  BaseProvider,
  ProviderConfig,
  OAuthTokens,
  ProviderAction,
  ProviderTrigger,
  ApiResponse,
} from "./base-provider";
import { IntegrationConnection } from "@/lib/types/integrations";

export interface SalesforceConfig extends ProviderConfig {
  clientId: string;
  clientSecret: string;
  instanceUrl?: string;
  sandbox?: boolean;
}

export interface SalesforceRecord {
  Id?: string;
  [key: string]: any;
}

export class SalesforceProvider extends BaseProvider {
  private static readonly PRODUCTION_URL = "https://login.salesforce.com";
  private static readonly SANDBOX_URL = "https://test.salesforce.com";

  constructor(config: SalesforceConfig, connection?: IntegrationConnection) {
    super(config, connection);
  }

  getProviderName(): string {
    return "Salesforce";
  }

  getProviderType(): string {
    return "crm";
  }

  private getBaseUrl(): string {
    return (this.config as SalesforceConfig).sandbox
      ? SalesforceProvider.SANDBOX_URL
      : SalesforceProvider.PRODUCTION_URL;
  }

  private getInstanceUrl(): string {
    return (this.config as SalesforceConfig).instanceUrl || this.getBaseUrl();
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/salesforce`,
      state,
      scope: "api refresh_token",
    });

    return `${this.getBaseUrl()}/services/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    _state: string,
  ): Promise<OAuthTokens> {
    const response = await fetch(`${this.getBaseUrl()}/services/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/salesforce`,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Salesforce OAuth error: ${data.error_description || data.error}`,
      );
    }

    // Store instance URL for future API calls
    (this.config as SalesforceConfig).instanceUrl = data.instance_url;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${this.getBaseUrl()}/services/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Salesforce token refresh error: ${data.error_description || data.error}`,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Salesforce doesn't return a new refresh token
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(
        `${this.getInstanceUrl()}/services/data/v58.0/sobjects/`,
      );
      return response.success;
    } catch (error) {
      return false;
    }
  }

  getAvailableActions(): ProviderAction[] {
    return [
      {
        id: "create_record",
        name: "Create Record",
        description: "Create a new Salesforce record",
        parameters: {
          sobject: {
            type: "string",
            required: true,
            description:
              "Salesforce object type (e.g., Account, Contact, Lead)",
          },
          fields: {
            type: "object",
            required: true,
            description: "Record fields as key-value pairs",
          },
        },
      },
      {
        id: "update_record",
        name: "Update Record",
        description: "Update an existing Salesforce record",
        parameters: {
          sobject: {
            type: "string",
            required: true,
            description: "Salesforce object type",
          },
          id: {
            type: "string",
            required: true,
            description: "Record ID",
          },
          fields: {
            type: "object",
            required: true,
            description: "Fields to update as key-value pairs",
          },
        },
      },
      {
        id: "get_record",
        name: "Get Record",
        description: "Retrieve a Salesforce record by ID",
        parameters: {
          sobject: {
            type: "string",
            required: true,
            description: "Salesforce object type",
          },
          id: {
            type: "string",
            required: true,
            description: "Record ID",
          },
          fields: {
            type: "array",
            required: false,
            description: "Specific fields to retrieve",
          },
        },
      },
      {
        id: "query_records",
        name: "Query Records",
        description: "Query Salesforce records using SOQL",
        parameters: {
          soql: {
            type: "string",
            required: true,
            description: "SOQL query string",
          },
        },
      },
      {
        id: "delete_record",
        name: "Delete Record",
        description: "Delete a Salesforce record",
        parameters: {
          sobject: {
            type: "string",
            required: true,
            description: "Salesforce object type",
          },
          id: {
            type: "string",
            required: true,
            description: "Record ID",
          },
        },
      },
      {
        id: "get_sobjects",
        name: "Get SObjects",
        description: "Get list of available Salesforce objects",
        parameters: {},
      },
    ];
  }

  getAvailableTriggers(): ProviderTrigger[] {
    return [
      {
        id: "record_created",
        name: "Record Created",
        description: "Triggered when a new record is created",
        eventType: "record_created",
        webhookRequired: true,
      },
      {
        id: "record_updated",
        name: "Record Updated",
        description: "Triggered when a record is updated",
        eventType: "record_updated",
        webhookRequired: true,
      },
      {
        id: "record_deleted",
        name: "Record Deleted",
        description: "Triggered when a record is deleted",
        eventType: "record_deleted",
        webhookRequired: true,
      },
    ];
  }

  async executeAction(
    actionId: string,
    parameters: any,
    _context?: any,
  ): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      await this.ensureValidTokens();

      let result: ApiResponse;

      switch (actionId) {
        case "create_record":
          result = await this.createRecord(parameters);
          break;
        case "update_record":
          result = await this.updateRecord(parameters);
          break;
        case "get_record":
          result = await this.getRecord(parameters);
          break;
        case "query_records":
          result = await this.queryRecords(parameters);
          break;
        case "delete_record":
          result = await this.deleteRecord(parameters);
          break;
        case "get_sobjects":
          result = await this.getSObjects();
          break;
        default:
          result = {
            success: false,
            error: `Unknown action: ${actionId}`,
          };
      }

      const duration = Date.now() - startTime;
      await this.logActivity(
        actionId,
        result.success ? "success" : "error",
        {
          request: parameters,
          response: result.data,
          duration,
        },
        result.error,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await this.logActivity(
        actionId,
        "error",
        {
          request: parameters,
          duration,
        },
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async handleWebhook(
    payload: any,
    headers: Record<string, string>,
  ): Promise<any> {
    // Salesforce webhook handling would depend on the specific webhook setup
    // This is a basic implementation

    await this.logActivity("webhook_received", "success", {
      payload,
      headers,
    });

    return {
      eventType: payload.eventType || "unknown",
      data: payload,
      timestamp: new Date(),
    };
  }

  private async createRecord(params: {
    sobject: string;
    fields: Record<string, any>;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${this.getInstanceUrl()}/services/data/v58.0/sobjects/${params.sobject}/`,
      {
        method: "POST",
        body: JSON.stringify(params.fields),
      },
    );
  }

  private async updateRecord(params: {
    sobject: string;
    id: string;
    fields: Record<string, any>;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${this.getInstanceUrl()}/services/data/v58.0/sobjects/${params.sobject}/${params.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(params.fields),
      },
    );
  }

  private async getRecord(params: {
    sobject: string;
    id: string;
    fields?: string[];
  }): Promise<ApiResponse> {
    let url = `${this.getInstanceUrl()}/services/data/v58.0/sobjects/${params.sobject}/${params.id}`;

    if (params.fields && params.fields.length > 0) {
      url += `?fields=${params.fields.join(",")}`;
    }

    return this.makeApiRequest(url);
  }

  private async queryRecords(params: { soql: string }): Promise<ApiResponse> {
    const url = new URL(`${this.getInstanceUrl()}/services/data/v58.0/query/`);
    url.searchParams.set("q", params.soql);

    return this.makeApiRequest(url.toString());
  }

  private async deleteRecord(params: {
    sobject: string;
    id: string;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${this.getInstanceUrl()}/services/data/v58.0/sobjects/${params.sobject}/${params.id}`,
      {
        method: "DELETE",
      },
    );
  }

  private async getSObjects(): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${this.getInstanceUrl()}/services/data/v58.0/sobjects/`,
    );
  }
}
