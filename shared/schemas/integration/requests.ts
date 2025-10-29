import { z } from "zod";
import {
  IntegrationProviderSchema,
  IntegrationTypeSchema,
  IntegrationCategorySchema,
  IntegrationStatusSchema,
} from "./core";

// Request schemas
export const CreateIntegrationRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: IntegrationProviderSchema,
  type: IntegrationTypeSchema,
  category: IntegrationCategorySchema,
  config: z.record(z.any()).default({}),
  settings: z.record(z.any()).default({}),
});

export const UpdateIntegrationRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
});

export const SyncRequestSchema = z.object({
  integrationId: z.string(),
  syncType: z.enum(["full", "incremental"]).default("incremental"),
  options: z.record(z.any()).default({}),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const FilterSchema = z.object({
  provider: IntegrationProviderSchema.optional(),
  type: IntegrationTypeSchema.optional(),
  category: IntegrationCategorySchema.optional(),
  status: IntegrationStatusSchema.optional(),
  search: z.string().optional(),
});

export const ListIntegrationsRequestSchema =
  PaginationSchema.merge(FilterSchema);

// Types
export type CreateIntegrationRequest = z.infer<
  typeof CreateIntegrationRequestSchema
>;
export type UpdateIntegrationRequest = z.infer<
  typeof UpdateIntegrationRequestSchema
>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type FilterParams = z.infer<typeof FilterSchema>;
export type ListIntegrationsRequest = z.infer<
  typeof ListIntegrationsRequestSchema
>;
