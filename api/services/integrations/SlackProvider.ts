import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";
import crypto from "crypto";

export class SlackProvider extends BaseIntegrationProvider {
  readonly name = "Slack";
  readonly type = "communication";
  readonly category = "productivity";
  readonly supportedFeatures = [
    "messages",
    "channels",
    "users",
    "files",
    "reactions",
    "webhooks",
  ];

  private readonly baseUrl = "https://slack.com/api";
  private readonly authUrl = "https://slack.com/oauth/v2/authorize";
  private readonly tokenUrl = "https://slack.com/api/oauth.v2.access";

  async testConnection(
    credentials: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<ConnectionTestResult> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/auth.test`,
        { method: "GET" },
        credentials,
      );

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          message: data.error || "Authentication failed",
          details: data,
        };
      }

      // Get additional info about the workspace
      const teamResponse = await this.makeRequest(
        `${this.baseUrl}/team.info`,
        { method: "GET" },
        credentials,
      );

      const teamData = await teamResponse.json();

      return {
        success: true,
        message: `Connected to ${teamData.team?.name || "Slack workspace"}`,
        details: {
          user: data.user,
          userId: data.user_id,
          team: teamData.team,
          url: data.url,
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
      "channels:read",
      "chat:write",
      "users:read",
      "files:read",
    ];

    const authUrl = this.buildOAuthUrl(
      this.authUrl,
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
    const tokens = await this.exchangeCodeForTokens(
      this.tokenUrl,
      config.clientId,
      config.clientSecret,
      code,
      config.redirectUri,
    );

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      team_id: tokens.team?.id,
      team_name: tokens.team?.name,
      user_id: tokens.authed_user?.id,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
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

      // Sync channels if enabled
      if (features.channels) {
        try {
          const channelsResult = await this.syncChannels(credentials, syncType);
          recordsProcessed += channelsResult.processed;
          recordsCreated += channelsResult.created;
          recordsUpdated += channelsResult.updated;
          errors.push(...channelsResult.errors);
        } catch (error) {
          errors.push({
            record: "channels",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync users if enabled
      if (features.users) {
        try {
          const usersResult = await this.syncUsers(credentials, syncType);
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

      // Sync messages if enabled and specific channel is configured
      if (features.messages && config.defaultChannel) {
        try {
          const messagesResult = await this.syncMessages(
            credentials,
            config.defaultChannel,
            syncType,
            options?.since,
          );
          recordsProcessed += messagesResult.processed;
          recordsCreated += messagesResult.created;
          recordsUpdated += messagesResult.updated;
          errors.push(...messagesResult.errors);
        } catch (error) {
          errors.push({
            record: "messages",
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
        nextSyncAt: new Date(Date.now() + 15 * 60 * 1000), // Next sync in 15 minutes
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
    switch (action) {
      case "send_message":
        return await this.sendMessage(credentials, parameters);
      case "create_channel":
        return await this.createChannel(credentials, parameters);
      case "upload_file":
        return await this.uploadFile(credentials, parameters);
      case "get_user_info":
        return await this.getUserInfo(credentials, parameters);
      default:
        throw new Error(`Action ${action} not supported by Slack provider`);
    }
  }

  getAvailableScopes(): string[] {
    return [
      "channels:read",
      "channels:write",
      "channels:manage",
      "chat:write",
      "chat:write.public",
      "users:read",
      "users:read.email",
      "files:read",
      "files:write",
      "reactions:read",
      "reactions:write",
      "groups:read",
      "groups:write",
      "im:read",
      "im:write",
      "mpim:read",
      "mpim:write",
    ];
  }

  getDefaultConfig(): Record<string, any> {
    return {
      features: {
        messages: true,
        files: true,
        channels: true,
        users: true,
        reactions: true,
      },
      scopes: ["channels:read", "chat:write", "users:read", "files:read"],
    };
  }

  getSupportedWebhookEvents(): string[] {
    return [
      "message",
      "channel_created",
      "channel_deleted",
      "channel_rename",
      "user_change",
      "team_join",
      "file_shared",
      "reaction_added",
      "reaction_removed",
    ];
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `v0:${timestamp}:${payload}`;
    const expectedSignature = `v0=${crypto
      .createHmac("sha256", secret)
      .update(baseString)
      .digest("hex")}`;

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
        case "message":
          return {
            processed: true,
            data: {
              type: "message",
              channel: payload.event?.channel,
              user: payload.event?.user,
              text: payload.event?.text,
              timestamp: payload.event?.ts,
            },
          };
        case "channel_created":
          return {
            processed: true,
            data: {
              type: "channel_created",
              channel: payload.event?.channel,
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
      displayName: "Slack",
      description:
        "Connect with Slack to send messages, manage channels, and sync team data",
      iconUrl:
        "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
      websiteUrl: "https://slack.com",
      documentationUrl: "https://api.slack.com/docs",
      setupInstructions: `
        1. Go to https://api.slack.com/apps and create a new app
        2. Add the required OAuth scopes under "OAuth & Permissions"
        3. Set the redirect URL to your application's callback URL
        4. Install the app to your workspace
        5. Copy the Client ID and Client Secret to your integration configuration
      `,
    };
  }

  // Private helper methods

  private async syncChannels(
    credentials: Record<string, any>,
    _syncType: "full" | "incremental",
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    const response = await this.makeRequest(
      `${this.baseUrl}/conversations.list?types=public_channel,private_channel`,
      { method: "GET" },
      credentials,
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch channels");
    }

    return {
      processed: data.channels?.length || 0,
      created: data.channels?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncUsers(
    credentials: Record<string, any>,
    _syncType: "full" | "incremental",
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    const response = await this.makeRequest(
      `${this.baseUrl}/users.list`,
      { method: "GET" },
      credentials,
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch users");
    }

    return {
      processed: data.members?.length || 0,
      created: data.members?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncMessages(
    credentials: Record<string, any>,
    channel: string,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let url = `${this.baseUrl}/conversations.history?channel=${channel}`;

    if (syncType === "incremental" && since) {
      url += `&oldest=${since}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch messages");
    }

    return {
      processed: data.messages?.length || 0,
      created: data.messages?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async sendMessage(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/chat.postMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: parameters.channel,
          text: parameters.text,
          blocks: parameters.blocks,
          attachments: parameters.attachments,
        }),
      },
      credentials,
    );

    return await response.json();
  }

  private async createChannel(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/conversations.create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parameters.name,
          is_private: parameters.isPrivate || false,
        }),
      },
      credentials,
    );

    return await response.json();
  }

  private async uploadFile(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const formData = new FormData();
    formData.append("channels", parameters.channels);
    formData.append("file", parameters.file);
    if (parameters.title) formData.append("title", parameters.title);
    if (parameters.initial_comment)
      formData.append("initial_comment", parameters.initial_comment);

    const response = await fetch(`${this.baseUrl}/files.upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
      },
      body: formData,
    });

    return await response.json();
  }

  private async getUserInfo(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/users.info?user=${parameters.user}`,
      { method: "GET" },
      credentials,
    );

    return await response.json();
  }

  async getRateLimitInfo(
    _credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    // Slack uses rate limiting but doesn't expose it in a standard way
    // Return default values based on Slack's documented limits
    return {
      remaining: 100,
      reset: new Date(Date.now() + 60 * 1000), // Reset in 1 minute
      limit: 100,
    };
  }
}
