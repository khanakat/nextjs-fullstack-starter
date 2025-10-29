import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";

export abstract class BaseIntegrationProvider {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly category: string;
  abstract readonly supportedFeatures: string[];

  /**
   * Test connection with the external service
   */
  abstract testConnection(
    credentials: Record<string, any>,
    config: Record<string, any>,
  ): Promise<ConnectionTestResult>;

  /**
   * Get OAuth authorization URL for the provider
   */
  abstract getOAuthAuthorizationUrl(
    config: Record<string, any>,
    state: string,
  ): Promise<OAuthAuthorizationUrl>;

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  abstract handleOAuthCallback(
    code: string,
    state: string,
    config: Record<string, any>,
  ): Promise<Record<string, any>>;

  /**
   * Sync data with the external service
   */
  abstract sync(
    credentials: Record<string, any>,
    config: Record<string, any>,
    syncType: "full" | "incremental",
    options?: Record<string, any>,
  ): Promise<SyncResult>;

  /**
   * Refresh OAuth tokens if needed
   */
  async refreshTokens(
    _refreshToken: string,
    _config: Record<string, any>,
  ): Promise<Record<string, any>> {
    throw new Error("OAuth token refresh not implemented for this provider");
  }

  /**
   * Get available scopes for this provider
   */
  getAvailableScopes(): string[] {
    return [];
  }

  /**
   * Get default configuration for this provider
   */
  getDefaultConfig(): Record<string, any> {
    return {};
  }

  /**
   * Validate provider-specific configuration
   */
  validateConfig(_config: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    return { valid: true, errors: [] };
  }

  /**
   * Get webhook events supported by this provider
   */
  getSupportedWebhookEvents(): string[] {
    return [];
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    _payload: string,
    _signature: string,
    _secret: string,
  ): boolean {
    return false;
  }

  /**
   * Process webhook payload
   */
  async processWebhook(
    _event: string,
    _payload: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<{ processed: boolean; data?: any; error?: string }> {
    return { processed: false, error: "Webhook processing not implemented" };
  }

  /**
   * Get rate limit information
   */
  async getRateLimitInfo(
    _credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    return null;
  }

  /**
   * Execute a custom action on the external service
   */
  async executeAction(
    action: string,
    _credentials: Record<string, any>,
    _config: Record<string, any>,
    _parameters: Record<string, any>,
  ): Promise<any> {
    throw new Error(`Action '${action}' not implemented for this provider`);
  }

  /**
   * Get provider-specific metadata
   */
  getProviderMetadata(): {
    displayName: string;
    description: string;
    iconUrl?: string;
    websiteUrl?: string;
    documentationUrl?: string;
    setupInstructions?: string;
  } {
    return {
      displayName: this.name,
      description: `${this.name} integration provider`,
      setupInstructions: "Please configure the integration settings.",
    };
  }

  /**
   * Utility method to make HTTP requests with error handling
   */
  protected async makeRequest(
    url: string,
    options: RequestInit,
    credentials?: Record<string, any>,
  ): Promise<Response> {
    const headers = new Headers(options.headers);

    // Add authentication headers if credentials are provided
    if (credentials) {
      if (credentials.access_token) {
        headers.set("Authorization", `Bearer ${credentials.access_token}`);
      } else if (credentials.api_key) {
        headers.set("Authorization", `Bearer ${credentials.api_key}`);
      } else if (credentials.username && credentials.password) {
        const auth = btoa(`${credentials.username}:${credentials.password}`);
        headers.set("Authorization", `Basic ${auth}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response;
  }

  /**
   * Utility method to handle common OAuth flow
   */
  protected buildOAuthUrl(
    authUrl: string,
    clientId: string,
    redirectUri: string,
    scopes: string[],
    state: string,
    additionalParams?: Record<string, string>,
  ): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state,
      ...additionalParams,
    });

    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Utility method to exchange OAuth code for tokens
   */
  protected async exchangeCodeForTokens(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    additionalParams?: Record<string, string>,
  ): Promise<Record<string, any>> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      ...additionalParams,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Utility method to refresh OAuth tokens
   */
  protected async refreshOAuthTokens(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    additionalParams?: Record<string, string>,
  ): Promise<Record<string, any>> {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      ...additionalParams,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    return await response.json();
  }
}
