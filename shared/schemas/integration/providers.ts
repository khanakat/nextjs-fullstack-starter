import { z } from "zod";

// Provider-specific configuration schemas
export const SlackConfigSchema = z.object({
  workspaceId: z.string().optional(),
  botToken: z.string().optional(),
  userToken: z.string().optional(),
  signingSecret: z.string().optional(),
  defaultChannel: z.string().optional(),
  features: z
    .object({
      messages: z.boolean().default(true),
      files: z.boolean().default(true),
      channels: z.boolean().default(true),
      users: z.boolean().default(true),
      reactions: z.boolean().default(true),
    })
    .default({}),
});

export const SalesforceConfigSchema = z.object({
  instanceUrl: z.string().url().optional(),
  apiVersion: z.string().default("v58.0"),
  sandbox: z.boolean().default(false),
  features: z
    .object({
      leads: z.boolean().default(true),
      contacts: z.boolean().default(true),
      accounts: z.boolean().default(true),
      opportunities: z.boolean().default(true),
      cases: z.boolean().default(true),
      customObjects: z.array(z.string()).default([]),
    })
    .default({}),
});

export const JiraConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  projectKey: z.string().optional(),
  features: z
    .object({
      issues: z.boolean().default(true),
      projects: z.boolean().default(true),
      users: z.boolean().default(true),
      comments: z.boolean().default(true),
      attachments: z.boolean().default(true),
    })
    .default({}),
});

export const GoogleDriveConfigSchema = z.object({
  folderId: z.string().optional(),
  features: z
    .object({
      files: z.boolean().default(true),
      folders: z.boolean().default(true),
      sharing: z.boolean().default(true),
      comments: z.boolean().default(true),
    })
    .default({}),
});

export const StripeConfigSchema = z.object({
  webhookEndpointSecret: z.string().optional(),
  features: z
    .object({
      customers: z.boolean().default(true),
      subscriptions: z.boolean().default(true),
      invoices: z.boolean().default(true),
      payments: z.boolean().default(true),
      products: z.boolean().default(true),
    })
    .default({}),
});

// Types
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type SalesforceConfig = z.infer<typeof SalesforceConfigSchema>;
export type JiraConfig = z.infer<typeof JiraConfigSchema>;
export type GoogleDriveConfig = z.infer<typeof GoogleDriveConfigSchema>;
export type StripeConfig = z.infer<typeof StripeConfigSchema>;
