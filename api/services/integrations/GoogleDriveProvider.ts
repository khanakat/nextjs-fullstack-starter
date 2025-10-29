import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";
import crypto from "crypto";

export class GoogleDriveProvider extends BaseIntegrationProvider {
  readonly name = "Google Drive";
  readonly type = "storage";
  readonly category = "productivity";
  readonly supportedFeatures = [
    "files",
    "folders",
    "permissions",
    "comments",
    "revisions",
    "upload",
    "download",
    "search",
  ];

  private readonly baseUrl = "https://www.googleapis.com/drive/v3";
  private readonly uploadUrl = "https://www.googleapis.com/upload/drive/v3";
  private readonly authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  private readonly tokenUrl = "https://oauth2.googleapis.com/token";

  async testConnection(
    credentials: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<ConnectionTestResult> {
    try {
      // Test connection by getting user info
      const response = await this.makeRequest(
        `${this.baseUrl}/about?fields=user,storageQuota`,
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

      return {
        success: true,
        message: `Connected to Google Drive as ${data.user?.displayName || data.user?.emailAddress}`,
        details: {
          user: data.user,
          storageQuota: data.storageQuota,
          permissions: await this.getPermissions(credentials),
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
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(" "),
      response_type: "code",
      state,
      access_type: "offline",
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
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      scope: tokens.scope,
      token_type: tokens.token_type,
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

      // Sync files if enabled
      if (features.files) {
        try {
          const filesResult = await this.syncFiles(
            credentials,
            syncType,
            options?.since,
            config.folderId,
          );
          recordsProcessed += filesResult.processed;
          recordsCreated += filesResult.created;
          recordsUpdated += filesResult.updated;
          errors.push(...filesResult.errors);
        } catch (error) {
          errors.push({
            record: "files",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync folders if enabled
      if (features.folders) {
        try {
          const foldersResult = await this.syncFolders(
            credentials,
            syncType,
            options?.since,
          );
          recordsProcessed += foldersResult.processed;
          recordsCreated += foldersResult.created;
          recordsUpdated += foldersResult.updated;
          errors.push(...foldersResult.errors);
        } catch (error) {
          errors.push({
            record: "folders",
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
        nextSyncAt: new Date(Date.now() + 10 * 60 * 1000), // Next sync in 10 minutes
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
      case "upload_file":
        return await this.uploadFile(credentials, parameters);
      case "download_file":
        return await this.downloadFile(credentials, parameters);
      case "create_folder":
        return await this.createFolder(credentials, parameters);
      case "delete_file":
        return await this.deleteFile(credentials, parameters);
      case "share_file":
        return await this.shareFile(credentials, parameters);
      case "search_files":
        return await this.searchFiles(credentials, parameters);
      case "get_file_metadata":
        return await this.getFileMetadata(credentials, parameters);
      default:
        throw new Error(
          `Action ${action} not supported by Google Drive provider`,
        );
    }
  }

  getAvailableScopes(): string[] {
    return [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.photos.readonly",
      "https://www.googleapis.com/auth/drive.scripts",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];
  }

  getDefaultConfig(): Record<string, any> {
    return {
      features: {
        files: true,
        folders: true,
        permissions: false,
        comments: false,
        revisions: false,
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    };
  }

  getSupportedWebhookEvents(): string[] {
    return [
      "file_created",
      "file_updated",
      "file_deleted",
      "file_shared",
      "folder_created",
      "folder_updated",
      "folder_deleted",
    ];
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    // Google Drive uses HMAC-SHA256 for webhook verification
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
        case "file_created":
        case "file_updated":
        case "file_deleted":
        case "folder_created":
        case "folder_updated":
        case "folder_deleted":
          return {
            processed: true,
            data: {
              type: event,
              fileId: payload.fileId,
              fileName: payload.fileName,
              mimeType: payload.mimeType,
              modifiedTime: payload.modifiedTime,
              user: payload.user,
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
      displayName: "Google Drive",
      description:
        "Connect with Google Drive to manage files, folders, and collaborate on documents",
      iconUrl:
        "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
      websiteUrl: "https://drive.google.com",
      documentationUrl: "https://developers.google.com/drive/api/v3/reference",
      setupInstructions: `
        1. Go to the Google Cloud Console (https://console.cloud.google.com/)
        2. Create a new project or select an existing one
        3. Enable the Google Drive API
        4. Create OAuth 2.0 credentials
        5. Add your application's redirect URI to the authorized redirect URIs
        6. Copy the Client ID and Client Secret
      `,
    };
  }

  // Private helper methods

  private async getPermissions(
    credentials: Record<string, any>,
  ): Promise<string[]> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/about?fields=user`,
        { method: "GET" },
        credentials,
      );

      if (response.ok) {
        return ["read", "write", "share"]; // Simplified permissions
      }
    } catch (error) {
      // Ignore errors for permissions check
    }

    return [];
  }

  private async syncFiles(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
    folderId?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let query =
      "mimeType != 'application/vnd.google-apps.folder' and trashed = false";

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    if (syncType === "incremental" && since) {
      query += ` and modifiedTime > '${since}'`;
    }

    const response = await this.makeRequest(
      `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=100&fields=files(id,name,mimeType,size,createdTime,modifiedTime,owners,parents)`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync files: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.files?.length || 0,
      created: data.files?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncFolders(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let query =
      "mimeType = 'application/vnd.google-apps.folder' and trashed = false";

    if (syncType === "incremental" && since) {
      query += ` and modifiedTime > '${since}'`;
    }

    const response = await this.makeRequest(
      `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=100&fields=files(id,name,createdTime,modifiedTime,owners,parents)`,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync folders: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.files?.length || 0,
      created: data.files?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async uploadFile(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { file, fileName, parentId, mimeType: _mimeType } = parameters;

    // First, create the file metadata
    const metadata = {
      name: fileName,
      parents: parentId ? [parentId] : undefined,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    form.append("file", file);

    const response = await fetch(
      `${this.uploadUrl}/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
        body: form,
      },
    );

    return await response.json();
  }

  private async downloadFile(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { fileId } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/files/${fileId}?alt=media`,
      { method: "GET" },
      credentials,
    );

    if (response.ok) {
      return {
        success: true,
        data: await response.blob(),
        contentType: response.headers.get("content-type"),
      };
    }

    return await response.json();
  }

  private async createFolder(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { name, parentId } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/files`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: parentId ? [parentId] : undefined,
        }),
      },
      credentials,
    );

    return await response.json();
  }

  private async deleteFile(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { fileId } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/files/${fileId}`,
      { method: "DELETE" },
      credentials,
    );

    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  private async shareFile(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { fileId, email, role = "reader", type = "user" } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          type,
          emailAddress: email,
        }),
      },
      credentials,
    );

    return await response.json();
  }

  private async searchFiles(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { query, maxResults = 50 } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=${maxResults}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)`,
      { method: "GET" },
      credentials,
    );

    return await response.json();
  }

  private async getFileMetadata(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { fileId, fields } = parameters;
    let url = `${this.baseUrl}/files/${fileId}`;

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
    _credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    // Google Drive API has generous rate limits
    // Return conservative estimates
    return {
      remaining: 1000,
      reset: new Date(Date.now() + 60 * 1000), // Reset in 1 minute
      limit: 1000,
    };
  }
}
