import { z } from "zod";

// Authentication-related schemas
export const ConnectionTypeSchema = z.enum([
  "oauth",
  "api_key",
  "basic_auth",
  "bearer_token",
  "custom",
]);

export const ConnectionStatusSchema = z.enum([
  "connected",
  "disconnected",
  "expired",
  "error",
  "refreshing",
]);

export const OAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).min(1),
  authUrl: z.string().url(),
  tokenUrl: z.string().url(),
  refreshUrl: z.string().url().optional(),
});

export const ApiKeyConfigSchema = z.object({
  keyName: z.string().min(1),
  keyLocation: z.enum(["header", "query", "body"]),
  prefix: z.string().optional(),
});

export const BasicAuthConfigSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// IntegrationConnectionSchema is defined in core.ts to avoid duplication

export const CreateConnectionRequestSchema = z.object({
  connectionName: z.string().min(1).max(100),
  connectionType: ConnectionTypeSchema,
  credentials: z.record(z.any()),
  settings: z.record(z.any()).default({}),
  scopes: z.array(z.string()).default([]),
});

export const OAuthCallbackRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const TestConnectionRequestSchema = z
  .object({
    connectionId: z.string().optional(),
    credentials: z.record(z.any()).optional(),
  })
  .refine((data) => data.connectionId || data.credentials, {
    message: "Either connectionId or credentials must be provided",
  });

export const OAuthAuthorizationUrlSchema = z.object({
  authUrl: z.string().url(),
  state: z.string(),
  codeVerifier: z.string().optional(),
});

export const ConnectionTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  capabilities: z.array(z.string()).optional(),
  rateLimits: z
    .object({
      remaining: z.number().int().min(0),
      reset: z.date(),
      limit: z.number().int().min(0),
    })
    .optional(),
});

// Types - IntegrationConnection is exported from core.ts
export type CreateConnectionRequest = z.infer<
  typeof CreateConnectionRequestSchema
>;
export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequestSchema>;
export type TestConnectionRequest = z.infer<typeof TestConnectionRequestSchema>;
export type OAuthAuthorizationUrl = z.infer<typeof OAuthAuthorizationUrlSchema>;
export type ConnectionTestResult = z.infer<typeof ConnectionTestResultSchema>;
