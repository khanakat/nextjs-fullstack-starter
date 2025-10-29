import { BaseIntegrationProvider } from "./BaseIntegrationProvider";
import {
  ConnectionTestResult,
  SyncResult,
  OAuthAuthorizationUrl,
} from "../../../shared/types/integration";
import crypto from "crypto";

export class StripeProvider extends BaseIntegrationProvider {
  readonly name = "Stripe";
  readonly type = "payment";
  readonly category = "finance";
  readonly supportedFeatures = [
    "customers",
    "payments",
    "subscriptions",
    "products",
    "invoices",
    "payment_methods",
    "disputes",
    "refunds",
  ];

  private readonly baseUrl = "https://api.stripe.com/v1";
  private readonly connectUrl = "https://connect.stripe.com/oauth";

  async testConnection(
    credentials: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<ConnectionTestResult> {
    try {
      // Test connection by getting account info
      const response = await this.makeRequest(
        `${this.baseUrl}/account`,
        { method: "GET" },
        credentials,
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: `Authentication failed: ${error.error?.message || response.statusText}`,
          details: { error: error.error, status: response.status },
        };
      }

      const account = await response.json();

      // Get balance information
      const balanceResponse = await this.makeRequest(
        `${this.baseUrl}/balance`,
        { method: "GET" },
        credentials,
      );

      const balance = balanceResponse.ok ? await balanceResponse.json() : null;

      return {
        success: true,
        message: `Connected to Stripe account: ${account.display_name || account.email}`,
        details: {
          account: {
            id: account.id,
            displayName: account.display_name,
            email: account.email,
            country: account.country,
            currency: account.default_currency,
            type: account.type,
          },
          balance,
          capabilities: account.capabilities,
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
    const scopes = config.scopes || ["read_write"];

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      scope: scopes.join(" "),
      redirect_uri: config.redirectUri,
      state,
    });

    const authUrl = `${this.connectUrl}/authorize?${params.toString()}`;

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
    const response = await fetch(`${this.connectUrl}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${config.clientSecret}`,
      },
      body: new URLSearchParams({
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OAuth callback failed: ${error.error_description || error.error}`,
      );
    }

    const tokens = await response.json();

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      stripe_user_id: tokens.stripe_user_id,
      stripe_publishable_key: tokens.stripe_publishable_key,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_at: null, // Stripe tokens don't expire
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

      // Sync customers if enabled
      if (features.customers) {
        try {
          const customersResult = await this.syncCustomers(
            credentials,
            syncType,
            options?.since,
          );
          recordsProcessed += customersResult.processed;
          recordsCreated += customersResult.created;
          recordsUpdated += customersResult.updated;
          errors.push(...customersResult.errors);
        } catch (error) {
          errors.push({
            record: "customers",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync payments if enabled
      if (features.payments) {
        try {
          const paymentsResult = await this.syncPayments(
            credentials,
            syncType,
            options?.since,
          );
          recordsProcessed += paymentsResult.processed;
          recordsCreated += paymentsResult.created;
          recordsUpdated += paymentsResult.updated;
          errors.push(...paymentsResult.errors);
        } catch (error) {
          errors.push({
            record: "payments",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync subscriptions if enabled
      if (features.subscriptions) {
        try {
          const subscriptionsResult = await this.syncSubscriptions(
            credentials,
            syncType,
            options?.since,
          );
          recordsProcessed += subscriptionsResult.processed;
          recordsCreated += subscriptionsResult.created;
          recordsUpdated += subscriptionsResult.updated;
          errors.push(...subscriptionsResult.errors);
        } catch (error) {
          errors.push({
            record: "subscriptions",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Sync products if enabled
      if (features.products) {
        try {
          const productsResult = await this.syncProducts(
            credentials,
            syncType,
            options?.since,
          );
          recordsProcessed += productsResult.processed;
          recordsCreated += productsResult.created;
          recordsUpdated += productsResult.updated;
          errors.push(...productsResult.errors);
        } catch (error) {
          errors.push({
            record: "products",
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
        nextSyncAt: new Date(Date.now() + 60 * 60 * 1000), // Next sync in 1 hour
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
      case "create_customer":
        return await this.createCustomer(credentials, parameters);
      case "create_payment_intent":
        return await this.createPaymentIntent(credentials, parameters);
      case "create_subscription":
        return await this.createSubscription(credentials, parameters);
      case "create_product":
        return await this.createProduct(credentials, parameters);
      case "create_price":
        return await this.createPrice(credentials, parameters);
      case "refund_payment":
        return await this.refundPayment(credentials, parameters);
      case "cancel_subscription":
        return await this.cancelSubscription(credentials, parameters);
      default:
        throw new Error(`Action ${action} not supported by Stripe provider`);
    }
  }

  getAvailableScopes(): string[] {
    return ["read_only", "read_write"];
  }

  getDefaultConfig(): Record<string, any> {
    return {
      features: {
        customers: true,
        payments: true,
        subscriptions: true,
        products: true,
        invoices: false,
        payment_methods: false,
        disputes: false,
        refunds: false,
      },
      scopes: ["read_write"],
    };
  }

  getSupportedWebhookEvents(): string[] {
    return [
      "customer.created",
      "customer.updated",
      "customer.deleted",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "charge.dispute.created",
      "product.created",
      "product.updated",
      "price.created",
      "price.updated",
    ];
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const elements = signature.split(",");
    const signatureElements: Record<string, string> = {};

    for (const element of elements) {
      const [key, value] = element.split("=");
      signatureElements[key] = value;
    }

    const timestamp = signatureElements.t;
    const expectedSignature = signatureElements.v1;

    if (!timestamp || !expectedSignature) {
      return false;
    }

    const payloadForSignature = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadForSignature)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature),
    );
  }

  async processWebhook(
    event: string,
    payload: Record<string, any>,
    _config: Record<string, any>,
  ): Promise<{ processed: boolean; data?: any; error?: string }> {
    try {
      const eventData = payload.data?.object;

      switch (event) {
        case "customer.created":
        case "customer.updated":
        case "customer.deleted":
          return {
            processed: true,
            data: {
              type: event,
              customer: eventData,
              timestamp: payload.created,
            },
          };
        case "payment_intent.succeeded":
        case "payment_intent.payment_failed":
          return {
            processed: true,
            data: {
              type: event,
              paymentIntent: eventData,
              amount: eventData?.amount,
              currency: eventData?.currency,
              customer: eventData?.customer,
              timestamp: payload.created,
            },
          };
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          return {
            processed: true,
            data: {
              type: event,
              subscription: eventData,
              customer: eventData?.customer,
              status: eventData?.status,
              timestamp: payload.created,
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
      displayName: "Stripe",
      description:
        "Connect with Stripe to process payments, manage customers, and handle subscriptions",
      iconUrl:
        "https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg",
      websiteUrl: "https://stripe.com",
      documentationUrl: "https://stripe.com/docs/api",
      setupInstructions: `
        1. Log in to your Stripe Dashboard
        2. Go to Developers > API keys
        3. Copy your Publishable key and Secret key
        4. For Connect applications, create a Connect application
        5. Set up your webhook endpoints in the Dashboard
        6. Copy the webhook signing secret for verification
      `,
    };
  }

  // Private helper methods

  private async syncCustomers(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let url = `${this.baseUrl}/customers?limit=100`;

    if (syncType === "incremental" && since) {
      const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000);
      url += `&created[gte]=${sinceTimestamp}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync customers: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.data?.length || 0,
      created: data.data?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncPayments(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let url = `${this.baseUrl}/payment_intents?limit=100`;

    if (syncType === "incremental" && since) {
      const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000);
      url += `&created[gte]=${sinceTimestamp}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync payments: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.data?.length || 0,
      created: data.data?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncSubscriptions(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let url = `${this.baseUrl}/subscriptions?limit=100`;

    if (syncType === "incremental" && since) {
      const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000);
      url += `&created[gte]=${sinceTimestamp}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync subscriptions: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.data?.length || 0,
      created: data.data?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async syncProducts(
    credentials: Record<string, any>,
    syncType: "full" | "incremental",
    since?: string,
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    errors: Array<{ record: any; error: string }>;
  }> {
    let url = `${this.baseUrl}/products?limit=100`;

    if (syncType === "incremental" && since) {
      const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000);
      url += `&created[gte]=${sinceTimestamp}`;
    }

    const response = await this.makeRequest(
      url,
      { method: "GET" },
      credentials,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to sync products: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      processed: data.data?.length || 0,
      created: data.data?.length || 0,
      updated: 0,
      errors: [],
    };
  }

  private async createCustomer(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/customers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async createPaymentIntent(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/payment_intents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async createSubscription(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async createProduct(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async createPrice(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/prices`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async refundPayment(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const response = await this.makeRequest(
      `${this.baseUrl}/refunds`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parameters),
      },
      credentials,
    );

    return await response.json();
  }

  private async cancelSubscription(
    credentials: Record<string, any>,
    parameters: Record<string, any>,
  ): Promise<any> {
    const { subscriptionId, ...otherParams } = parameters;

    const response = await this.makeRequest(
      `${this.baseUrl}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(otherParams),
      },
      credentials,
    );

    return await response.json();
  }

  async getRateLimitInfo(
    _credentials: Record<string, any>,
  ): Promise<{ remaining: number; reset: Date; limit: number } | null> {
    // Stripe has generous rate limits and doesn't expose them in a standard way
    // Return conservative estimates
    return {
      remaining: 100,
      reset: new Date(Date.now() + 60 * 1000), // Reset in 1 minute
      limit: 100,
    };
  }
}
