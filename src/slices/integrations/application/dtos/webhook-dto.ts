/**
 * Webhook DTO
 */
export class WebhookDto {
  constructor(public readonly value: {
    id: string;
    integrationId: string;
    url: string;
    events: string[];
    status: string;
    httpMethod?: string;
    headers?: Record<string, string>;
    retryConfig?: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
  }) {}

  toObject(): Record<string, any> {
    return {
      id: this.value.id,
      integrationId: this.value.integrationId,
      url: this.value.url,
      events: this.value.events,
      status: this.value.status,
      httpMethod: this.value.httpMethod,
      headers: this.value.headers,
      retryConfig: this.value.retryConfig,
      isActive: this.value.isActive,
      createdAt: this.value.createdAt,
      updatedAt: this.value.updatedAt,
      createdBy: this.value.createdBy,
    };
  }
}
