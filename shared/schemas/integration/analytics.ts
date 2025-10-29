import { z } from "zod";

// Analytics schemas
export const LogStatusSchema = z.enum([
  "success",
  "error",
  "timeout",
  "rate_limited",
  "pending",
  "cancelled",
]);

export const IntegrationLogSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  webhookId: z.string().optional(),
  action: z.string().min(1),
  method: z.string().optional(),
  endpoint: z.string().optional(),
  requestData: z.record(z.any()).optional(),
  responseData: z.record(z.any()).optional(),
  requestHeaders: z.record(z.string()).optional(),
  responseHeaders: z.record(z.string()).optional(),
  status: LogStatusSchema,
  statusCode: z.number().int().min(100).max(599).optional(),
  duration: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  errorDetails: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
});

export const IntegrationAnalyticsSchema = z.object({
  integrationId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  metrics: z.object({
    totalRequests: z.number().int().min(0),
    successfulRequests: z.number().int().min(0),
    failedRequests: z.number().int().min(0),
    averageResponseTime: z.number().min(0),
    dataTransferred: z.number().min(0),
    webhooksTriggered: z.number().int().min(0),
    syncOperations: z.number().int().min(0),
  }),
  trends: z.object({
    requestsOverTime: z.array(
      z.object({
        timestamp: z.date(),
        count: z.number().int().min(0),
      }),
    ),
    errorRateOverTime: z.array(
      z.object({
        timestamp: z.date(),
        rate: z.number().min(0).max(100),
      }),
    ),
  }),
  topErrors: z.array(
    z.object({
      error: z.string(),
      count: z.number().int().min(0),
      lastOccurred: z.date(),
    }),
  ),
});

// Types
export type IntegrationLog = z.infer<typeof IntegrationLogSchema>;
export type IntegrationAnalytics = z.infer<typeof IntegrationAnalyticsSchema>;
