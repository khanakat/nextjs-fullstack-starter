import {
  BaseProvider,
  ProviderConfig,
  OAuthTokens,
  ProviderAction,
  ProviderTrigger,
  ApiResponse,
} from "./base-provider";
import { IntegrationConnection } from "@/lib/types/integrations";

export interface GoogleConfig extends ProviderConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface GoogleSheet {
  spreadsheetId: string;
  properties: {
    title: string;
    locale: string;
    timeZone: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}

export class GoogleProvider extends BaseProvider {
  private static readonly AUTH_URL =
    "https://accounts.google.com/o/oauth2/v2/auth";
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static readonly SHEETS_BASE_URL =
    "https://sheets.googleapis.com/v4/spreadsheets";
  private static readonly DRIVE_BASE_URL =
    "https://www.googleapis.com/drive/v3";

  constructor(config: GoogleConfig, connection?: IntegrationConnection) {
    super(config, connection);
  }

  getProviderName(): string {
    return "Google";
  }

  getProviderType(): string {
    return "productivity";
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/google`,
      scope:
        this.config.scopes?.join(" ") ||
        "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly",
      state,
      access_type: "offline",
      prompt: "consent",
    });

    return `${GoogleProvider.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    _state: string,
  ): Promise<OAuthTokens> {
    const response = await fetch(GoogleProvider.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Google OAuth error: ${data.error_description || data.error}`,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope,
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(GoogleProvider.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Google token refresh error: ${data.error_description || data.error}`,
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Google may not return a new refresh token
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scope: data.scope,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(
        `${GoogleProvider.DRIVE_BASE_URL}/about?fields=user`,
      );
      return response.success;
    } catch (error) {
      return false;
    }
  }

  getAvailableActions(): ProviderAction[] {
    return [
      {
        id: "create_spreadsheet",
        name: "Create Spreadsheet",
        description: "Create a new Google Sheets spreadsheet",
        parameters: {
          title: {
            type: "string",
            required: true,
            description: "Spreadsheet title",
          },
          sheets: {
            type: "array",
            required: false,
            description: "Initial sheets configuration",
          },
        },
      },
      {
        id: "get_spreadsheet",
        name: "Get Spreadsheet",
        description: "Get spreadsheet metadata and structure",
        parameters: {
          spreadsheetId: {
            type: "string",
            required: true,
            description: "Spreadsheet ID",
          },
        },
      },
      {
        id: "read_range",
        name: "Read Range",
        description: "Read data from a spreadsheet range",
        parameters: {
          spreadsheetId: {
            type: "string",
            required: true,
            description: "Spreadsheet ID",
          },
          range: {
            type: "string",
            required: true,
            description: "Range in A1 notation (e.g., Sheet1!A1:D10)",
          },
          valueRenderOption: {
            type: "string",
            required: false,
            description:
              "How values should be rendered (FORMATTED_VALUE, UNFORMATTED_VALUE, FORMULA)",
            default: "FORMATTED_VALUE",
          },
        },
      },
      {
        id: "write_range",
        name: "Write Range",
        description: "Write data to a spreadsheet range",
        parameters: {
          spreadsheetId: {
            type: "string",
            required: true,
            description: "Spreadsheet ID",
          },
          range: {
            type: "string",
            required: true,
            description: "Range in A1 notation",
          },
          values: {
            type: "array",
            required: true,
            description: "2D array of values to write",
          },
          valueInputOption: {
            type: "string",
            required: false,
            description:
              "How input data should be interpreted (RAW, USER_ENTERED)",
            default: "USER_ENTERED",
          },
        },
      },
      {
        id: "append_rows",
        name: "Append Rows",
        description: "Append rows to a spreadsheet",
        parameters: {
          spreadsheetId: {
            type: "string",
            required: true,
            description: "Spreadsheet ID",
          },
          range: {
            type: "string",
            required: true,
            description: "Range to append to (e.g., Sheet1!A:D)",
          },
          values: {
            type: "array",
            required: true,
            description: "2D array of values to append",
          },
          valueInputOption: {
            type: "string",
            required: false,
            description: "How input data should be interpreted",
            default: "USER_ENTERED",
          },
        },
      },
      {
        id: "clear_range",
        name: "Clear Range",
        description: "Clear data from a spreadsheet range",
        parameters: {
          spreadsheetId: {
            type: "string",
            required: true,
            description: "Spreadsheet ID",
          },
          range: {
            type: "string",
            required: true,
            description: "Range to clear",
          },
        },
      },
      {
        id: "list_files",
        name: "List Files",
        description: "List files from Google Drive",
        parameters: {
          query: {
            type: "string",
            required: false,
            description:
              "Search query (e.g., \"mimeType='application/vnd.google-apps.spreadsheet'\")",
          },
          pageSize: {
            type: "number",
            required: false,
            description: "Maximum number of files to return",
            default: 10,
          },
        },
      },
    ];
  }

  getAvailableTriggers(): ProviderTrigger[] {
    return [
      {
        id: "spreadsheet_updated",
        name: "Spreadsheet Updated",
        description: "Triggered when a spreadsheet is updated",
        eventType: "spreadsheet_updated",
        webhookRequired: true,
      },
      {
        id: "file_created",
        name: "File Created",
        description: "Triggered when a new file is created in Drive",
        eventType: "file_created",
        webhookRequired: true,
      },
      {
        id: "file_updated",
        name: "File Updated",
        description: "Triggered when a file is updated in Drive",
        eventType: "file_updated",
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
        case "create_spreadsheet":
          result = await this.createSpreadsheet(parameters);
          break;
        case "get_spreadsheet":
          result = await this.getSpreadsheet(parameters);
          break;
        case "read_range":
          result = await this.readRange(parameters);
          break;
        case "write_range":
          result = await this.writeRange(parameters);
          break;
        case "append_rows":
          result = await this.appendRows(parameters);
          break;
        case "clear_range":
          result = await this.clearRange(parameters);
          break;
        case "list_files":
          result = await this.listFiles(parameters);
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
    // Google webhook handling for Drive API push notifications
    const channelId = headers["x-goog-channel-id"];
    const resourceId = headers["x-goog-resource-id"];
    const resourceState = headers["x-goog-resource-state"];

    await this.logActivity("webhook_received", "success", {
      channelId,
      resourceId,
      resourceState,
      payload,
    });

    return {
      eventType: resourceState || "unknown",
      data: {
        channelId,
        resourceId,
        resourceState,
        payload,
      },
      timestamp: new Date(),
    };
  }

  private async createSpreadsheet(params: {
    title: string;
    sheets?: any[];
  }): Promise<ApiResponse> {
    const body: any = {
      properties: {
        title: params.title,
      },
    };

    if (params.sheets) {
      body.sheets = params.sheets;
    }

    return this.makeApiRequest(GoogleProvider.SHEETS_BASE_URL, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async getSpreadsheet(params: {
    spreadsheetId: string;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${GoogleProvider.SHEETS_BASE_URL}/${params.spreadsheetId}`,
    );
  }

  private async readRange(params: {
    spreadsheetId: string;
    range: string;
    valueRenderOption?: string;
  }): Promise<ApiResponse> {
    const url = new URL(
      `${GoogleProvider.SHEETS_BASE_URL}/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}`,
    );

    if (params.valueRenderOption) {
      url.searchParams.set("valueRenderOption", params.valueRenderOption);
    }

    return this.makeApiRequest(url.toString());
  }

  private async writeRange(params: {
    spreadsheetId: string;
    range: string;
    values: any[][];
    valueInputOption?: string;
  }): Promise<ApiResponse> {
    const url = new URL(
      `${GoogleProvider.SHEETS_BASE_URL}/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}`,
    );

    if (params.valueInputOption) {
      url.searchParams.set("valueInputOption", params.valueInputOption);
    }

    return this.makeApiRequest(url.toString(), {
      method: "PUT",
      body: JSON.stringify({
        values: params.values,
      }),
    });
  }

  private async appendRows(params: {
    spreadsheetId: string;
    range: string;
    values: any[][];
    valueInputOption?: string;
  }): Promise<ApiResponse> {
    const url = new URL(
      `${GoogleProvider.SHEETS_BASE_URL}/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:append`,
    );

    url.searchParams.set(
      "valueInputOption",
      params.valueInputOption || "USER_ENTERED",
    );

    return this.makeApiRequest(url.toString(), {
      method: "POST",
      body: JSON.stringify({
        values: params.values,
      }),
    });
  }

  private async clearRange(params: {
    spreadsheetId: string;
    range: string;
  }): Promise<ApiResponse> {
    return this.makeApiRequest(
      `${GoogleProvider.SHEETS_BASE_URL}/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:clear`,
      {
        method: "POST",
      },
    );
  }

  private async listFiles(
    params: {
      query?: string;
      pageSize?: number;
    } = {},
  ): Promise<ApiResponse> {
    const url = new URL(`${GoogleProvider.DRIVE_BASE_URL}/files`);

    if (params.query) {
      url.searchParams.set("q", params.query);
    }

    if (params.pageSize) {
      url.searchParams.set("pageSize", params.pageSize.toString());
    }

    url.searchParams.set(
      "fields",
      "files(id,name,mimeType,createdTime,modifiedTime)",
    );

    return this.makeApiRequest(url.toString());
  }
}
