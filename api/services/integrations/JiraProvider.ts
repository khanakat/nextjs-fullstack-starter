import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";
import crypto from "crypto";

export class JiraProvider extends BaseIntegrationProvider {
  readonly name = "Jira";
  readonly type = "project_management";
  readonly category = "productivity";
  readonly supportedFeatures = [
    "projects",
    "issues",
    "users",
    "comments",
    "attachments",
    "workflows",
    "sprints",
    "boards",
  ];

  private readonly authUrl = "https://auth.atlassian.com/authorize";
  private readonly tokenUrl = "https://auth.atlassian.com/oauth/token";
  private readonly apiUrl = "https://api.atlassian.com/ex/jira";

  async testConnection(
    credentials: Record<string, any>,
    config: Record<string, any>,
  ): Promise<ConnectionTestResult> {
    try {
      const cloudId = credentials.cloud_id || config.cloudId;

      if (!cloudId) {
        return {
          success: false,
          message: "Cloud ID is required for Jira connection",
          details: { error: "Missing cloud_id" },
        };
      }

      // Test connection by getting server info
      const response = await this.makeRequest(
        `${this.apiUrl}/${cloudId}/rest/api/3/serverInfo`,
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

      const serverInfo = await response.json();

      // Get current user info
      const userResponse = await this.makeRequest(
        `${this.apiUrl}/${cloudId}/rest/api/3/myself`,
        { method: "GET" },
        credentials,
      );

      const userInfo = await userResponse.json();

      return {
        success: true,
        message: `Connected to ${serverInfo.serverTitle || "Jira"} as ${userInfo.displayName}`,
        details: {
          serverInfo,
          userInfo,
          cloudId,
          baseUrl: serverInfo.baseUrl,
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
    const scopes = config.scopes || [
      "read:jira-work",
      "write:jira-work",
      "read:jira-user",
    ];

    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: config.clientId,
      scope: scopes.join(" "),
      redirect_uri: config.redirectUri,
      state,
      response_type: "code",
      prompt: "consent",
    });

    const authUrl = `${this.authUrl}?${params.toString()}`;

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
    const tokenResponse = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    // Get accessible resources (cloud instances)
    const resourcesResponse = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      },
    );

    const resources = await resourcesResponse.json();
    const primaryResource = resources[0]; // Use first available resource

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      cloud_id: primaryResource?.id,
      site_url: primaryResource?.url,
      site_name: primaryResource?.name,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      scope: tokens.scope,
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
      const cloudId = credentials.cloud_id;

      // Sync projects if enabled
      if (features.projects) {
        try {
          const projectsResult = await this.syncProjects(
            credentials,
            cloudId,
            syncType,
          );
          recordsProcessed += projectsResult.processed;
          recordsCreated += projectsResult.created;
          recordsUpdated += projectsResult.updated;
          errors.push(...projectsResult.errors);
        } catch (error) {
          errors.push({
            record: "projects",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync issues if enabled
      if (features.issues) {
        try {
          const issuesResult = await this.syncIssues(
            credentials,
            cloudId,
            syncType,
            options?.since,
            config.projectKeys,
          );
          recordsProcessed += issuesResult.processed;
          recordsCreated += issuesResult.created;
          recordsUpdated += issuesResult.updated;
          errors.push(...issuesResult.errors);
        } catch (error) {
          errors.push({
            record: "issues",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync users if enabled
      if (features.users) {
        try {
          const usersResult = await this.syncUsers(
            credentials,
            cloudId,
            syncType,
          );
          recordsProcessed += usersResult.processed;
          recordsCreated += usersResult.created;
          recordsUpdated += usersResult.updated;
          errors.push(...usersResult.errors);
        } catch (error) {
          errors.push({
            record: "users",
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
        nextSyncAt: new Date(Date.now() + 20 * 60 * 1000), // Next sync in 20 minutes
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
    const cloudId = credentials.cloud_id;

    switch (action) {
      case "create_issue":
        return await this.createIssue(credentials, cloudId, parameters);
      case "update_issue":
        return await this.updateIssue(credentials, cloudId, parameters);
      case "transition_issue":
        return await this.transitionIssue(credentials, cloudId, parameters);
      case "add_comment":
        return await this.addComment(credentials, cloudId, parameters);
      case "search_issues":
        return await this.searchIssues(credentials, cloudId, parameters);
      case "get_issue":
        return await this.getIssue(credentials, cloudId, parameters);
      default:
        throw new Error(`Action ${action} not supported by Jira provider`);
    }
  }

  getAvailableScopes(): string[] {
    return [
      "read:jira-work",
      "write:jira-work",
      "read:jira-user",
      "manage:jira-project",
      "manage:jira-configuration",
      "read:audit-log:jira",
      "read:avatar:jira",
      "read:group:jira",
      "read:project-role:jira",
      "read:user:jira",
      "write:comment:jira",
      "write:issue:jira",
    ];
  }

  getDefaultConfig(): Record<string, any> {
    return {
      features: {
        projects: true,
        issues: true,
        users: true,
        comments: true,
        attachments: false,
        workflows: false,
        sprints: false,
        boards: false,
      },
      scopes: ["read:jira-work", "write:jira-work", "read:jira-user"],
    };
  }

  getSupportedWebhookEvents(): string[] {
    return [
      "jira:issue_created",
      "jira:issue_updated",
      "jira:issue_deleted",
      "comment_created",
      "comment_updated",
      "comment_deleted",
      "project_created",
      "project_updated",
      "project_deleted",
      "user_created",
      "user_updated",
      "user_deleted",
    ];
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    // Jira uses HMAC-SHA256 for webhook verification
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

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
        case "jira:issue_created":
        case "jira:issue_updated":
        case "jira:issue_deleted":
          return {
            processed: true,
            data: {
              type: event,
              issue: payload.issue,
              user: payload.user,
              changelog: payload.changelog,
              timestamp: payload.timestamp,
            },
          };
        case "comment_created":
        case "comment_updated":
        case "comment_deleted":
          return {
            processed: true,
            data: {
              type: event,
              comment: payload.comment,
              issue: payload.issue,
              user: payload.user,
              timestamp: payload.timestamp,
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
      displayName: "Jira",
      description:
        "Connect with Jira to manage projects, issues, and track development progress",
      iconUrl:
        "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png",
      websiteUrl: "https://www.atlassian.com/software/jira",
      documentationUrl:
        "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
      setupInstructions: `
        1. Go to https://developer.atlassian.com/console/myapps/
        2. Create a new app and select "OAuth 2.0 (3LO)"
        3. Add the Jira API scopes you need
        4. Set the callback URL to your application's redirect URI
        5. Copy the Client ID and Client Secret
        6. Enable the app for your Jira site
      `,
    };
  }

  // Private helper methods

  private async syncProjects(
    credentials: Record<string, any>,
    cloudId: string,
    _syncType: "full" | "incremental",
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/project/search?maxResults=100`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync projects: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.values?.length || 0,
      created: data.values?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncIssues(
    credentials: Record<string, any>,
    cloudId: string,
    syncType: "full" | "incremental",
    since?: string,
    projectKeys?: string[],
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let jql = "ORDER BY updated DESC";

    if (projectKeys && projectKeys.length > 0) {
      jql = `project IN (${projectKeys.join(",")}) ${jql}`;
    }

    if (syncType === "incremental" && since) {
      const sinceClause = `updated >= "${since}"`;
      jql = projectKeys
        ? `${jql.replace("ORDER BY", `AND ${sinceClause} ORDER BY`)}`
        : `${sinceClause} ${jql}`;
    }

    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync issues: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.issues?.length || 0,
      created: data.issues?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncUsers(
    credentials: Record<string, any>,
    cloudId: string,
    _syncType: "full" | "incremental",
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/users/search?maxResults=100`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync users: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.length || 0,
      created: data.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async createIssue(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/issue`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: parameters.fields,
        }),
      },
      credentials,
    );

    return await response.json();
  }

  private async updateIssue(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { issueIdOrKey, fields } = parameters;

    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/issue/${issueIdOrKey}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      },
      credentials,
    );

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  private async transitionIssue(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { issueIdOrKey, transitionId, fields } = parameters;

    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/issue/${issueIdOrKey}/transitions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transition: { id: transitionId },
          fields: fields || {},
        }),
      },
      credentials,
    );

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  private async addComment(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { issueIdOrKey, body } = parameters;

    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/issue/${issueIdOrKey}/comment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      },
      credentials,
    );

    return await response.json();
  }

  private async searchIssues(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { jql, maxResults = 50, startAt = 0 } = parameters;

    const response = await this.makeRequest(
      `${this.apiUrl}/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}`,
      { method: "GET" },
      credentials,
    );

    return await response.json();
  }

  private async getIssue(
    credentials: Record<string, any>,
    cloudId: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { issueIdOrKey, fields, expand } = parameters;
    let url = `${this.apiUrl}/${cloudId}/rest/api/3/issue/${issueIdOrKey}`;

    const params = new URLSearchParams();
    if (fields) params.append("fields", fields.join(","));
    if (expand) params.append("expand", expand.join(","));

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );
    return await response.json();
  }

  async getRateLimitInfo(
    _credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    // Jira Cloud has rate limits but doesn't expose them in headers consistently
    // Return conservative estimates based on Atlassian's documented limits
    return {
      remaining: 1000,
      reset: new Date(Date.now() + 60 * 1000), // Reset in 1 minute
      limit: 1000,
    };
  }
}
