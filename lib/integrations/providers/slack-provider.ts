import {
  BaseProvider,
  ProviderConfig,
  OAuthTokens,
  ProviderAction,
  ProviderTrigger,
  ApiResponse,
} from "./base-provider";
import { IntegrationConnection } from "@/lib/types/integrations";

export interface SlackConfig extends ProviderConfig {
  clientId: string;
  clientSecret: string;
  signingSecret: string;
  scopes: string[];
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
}

export class SlackProvider extends BaseProvider {
  private static readonly BASE_URL = "https://slack.com/api";
  private static readonly AUTH_URL = "https://slack.com/oauth/v2/authorize";
  private static readonly TOKEN_URL = "https://slack.com/api/oauth.v2.access";

  constructor(config: SlackConfig, connection?: IntegrationConnection) {
    super(config, connection);
  }

  getProviderName(): string {
    return "Slack";
  }

  getProviderType(): string {
    return "communication";
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      scope:
        this.config.scopes?.join(",") || "channels:read,chat:write,users:read",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/slack`,
      state,
      response_type: "code",
    });

    return `${SlackProvider.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    _state: string,
  ): Promise<OAuthTokens> {
    const response = await fetch(SlackProvider.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/slack`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || "Bearer",
      scope: data.scope,
      // Slack tokens don't expire, but we set a far future date
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  async refreshTokens(_refreshToken: string): Promise<OAuthTokens> {
    // Slack tokens don't expire, so we just return the existing token
    throw new Error("Slack tokens do not require refresh");
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(
        `${SlackProvider.BASE_URL}/auth.test`,
      );
      return response.success && response.data?.ok;
    } catch (error) {
      return false;
    }
  }

  getAvailableActions(): ProviderAction[] {
    return [
      {
        id: "send_message",
        name: "Send Message",
        description: "Send a message to a Slack channel or user",
        parameters: {
          channel: {
            type: "string",
            required: true,
            description: "Channel ID or name (e.g., #general, @username)",
          },
          text: {
            type: "string",
            required: true,
            description: "Message text",
          },
          blocks: {
            type: "array",
            required: false,
            description: "Rich message blocks (JSON format)",
          },
          thread_ts: {
            type: "string",
            required: false,
            description: "Timestamp of parent message to reply in thread",
          },
        },
      },
      {
        id: "create_channel",
        name: "Create Channel",
        description: "Create a new Slack channel",
        parameters: {
          name: {
            type: "string",
            required: true,
            description: "Channel name (without #)",
          },
          is_private: {
            type: "boolean",
            required: false,
            description: "Whether the channel should be private",
            default: false,
          },
        },
      },
      {
        id: "invite_to_channel",
        name: "Invite to Channel",
        description: "Invite users to a Slack channel",
        parameters: {
          channel: {
            type: "string",
            required: true,
            description: "Channel ID",
          },
          users: {
            type: "array",
            required: true,
            description: "Array of user IDs to invite",
          },
        },
      },
      {
        id: "get_channels",
        name: "Get Channels",
        description: "Get list of channels",
        parameters: {
          types: {
            type: "string",
            required: false,
            description:
              "Channel types (public_channel,private_channel,mpim,im)",
            default: "public_channel,private_channel",
          },
        },
      },
      {
        id: "get_users",
        name: "Get Users",
        description: "Get list of workspace users",
        parameters: {},
      },
    ];
  }

  getAvailableTriggers(): ProviderTrigger[] {
    return [
      {
        id: "message_posted",
        name: "Message Posted",
        description: "Triggered when a message is posted to a channel",
        eventType: "message",
        webhookRequired: true,
      },
      {
        id: "channel_created",
        name: "Channel Created",
        description: "Triggered when a new channel is created",
        eventType: "channel_created",
        webhookRequired: true,
      },
      {
        id: "user_joined",
        name: "User Joined",
        description: "Triggered when a user joins the workspace",
        eventType: "team_join",
        webhookRequired: true,
      },
      {
        id: "reaction_added",
        name: "Reaction Added",
        description: "Triggered when a reaction is added to a message",
        eventType: "reaction_added",
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
        case "send_message":
          result = await this.sendMessage(parameters);
          break;
        case "create_channel":
          result = await this.createChannel(parameters);
          break;
        case "invite_to_channel":
          result = await this.inviteToChannel(parameters);
          break;
        case "get_channels":
          result = await this.getChannels(parameters);
          break;
        case "get_users":
          result = await this.getUsers();
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
    // Verify webhook signature
    const signature = headers["x-slack-signature"];
    const timestamp = headers["x-slack-request-timestamp"];
    const body = JSON.stringify(payload);

    if (signature && timestamp && this.config.signingSecret) {
      const isValid = this.verifySlackSignature(
        body,
        signature,
        timestamp,
        this.config.signingSecret,
      );
      if (!isValid) {
        throw new Error("Invalid webhook signature");
      }
    }

    // Handle URL verification challenge
    if (payload.type === "url_verification") {
      return { challenge: payload.challenge };
    }

    // Handle events
    if (payload.type === "event_callback") {
      const event = payload.event;

      await this.logActivity("webhook_received", "success", {
        eventType: event.type,
        event,
      });

      return {
        eventType: event.type,
        data: event,
        timestamp: new Date(),
      };
    }

    return null;
  }

  private async sendMessage(params: {
    channel: string;
    text: string;
    blocks?: any[];
    thread_ts?: string;
  }): Promise<ApiResponse> {
    const body: any = {
      channel: params.channel,
      text: params.text,
    };

    if (params.blocks) {
      body.blocks = params.blocks;
    }

    if (params.thread_ts) {
      body.thread_ts = params.thread_ts;
    }

    return this.makeApiRequest(`${SlackProvider.BASE_URL}/chat.postMessage`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async createChannel(params: {
    name: string;
    is_private?: boolean;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${SlackProvider.BASE_URL}/conversations.create`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          is_private: params.is_private || false,
        }),
      },
    );
  }

  private async inviteToChannel(params: {
    channel: string;
    users: string[];
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${SlackProvider.BASE_URL}/conversations.invite`,
      {
        method: "POST",
        body: JSON.stringify({
          channel: params.channel,
          users: params.users.join(","),
        }),
      },
    );
  }

  private async getChannels(
    params: {
      types?: string;
    } = {},
  ): Promise<ApiResponse> {
    const url = new URL(`${SlackProvider.BASE_URL}/conversations.list`);
    if (params.types) {
      url.searchParams.set("types", params.types);
    }

    return this.makeApiRequest(url.toString());
  }

  private async getUsers(): Promise<ApiResponse> {
    return this.makeApiRequest(`${SlackProvider.BASE_URL}/users.list`);
  }

  private verifySlackSignature(
    body: string,
    signature: string,
    timestamp: string,
    signingSecret: string,
  ): boolean {
    const time = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);

    // Request is older than 5 minutes
    if (Math.abs(currentTime - time) > 300) {
      return false;
    }

    const baseString = `v0:${timestamp}:${body}`;
    return this.verifyWebhookSignature(
      baseString,
      signature.replace("v0=", ""),
      signingSecret,
    );
  }
}
