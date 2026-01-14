/**
 * Webhook Event DTO
 */
export class WebhookEventDto {
  constructor(public readonly value: {
    id: string;
    integrationId: string;
    webhookId?: string | null;
    action: string;
    status: string;
    requestData?: any;
    responseData?: any;
    errorDetails?: any;
    timestamp: Date;
    duration?: number;
    retryCount?: number;
    statusCode?: number;
  }) {}

  toObject(): Record<string, any> {
    return {
      id: this.value.id,
      integrationId: this.value.integrationId,
      webhookId: this.value.webhookId,
      action: this.value.action,
      status: this.value.status,
      requestData: this.value.requestData,
      responseData: this.value.responseData,
      errorDetails: this.value.errorDetails,
      timestamp: this.value.timestamp,
      duration: this.value.duration,
      retryCount: this.value.retryCount,
      statusCode: this.value.statusCode,
    };
  }
}
