import { z } from "zod";

// Response schemas
export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number().int().min(0),
  recordsCreated: z.number().int().min(0),
  recordsUpdated: z.number().int().min(0),
  recordsDeleted: z.number().int().min(0),
  errors: z.array(
    z.object({
      record: z.any(),
      error: z.string(),
    }),
  ),
  duration: z.number().int().min(0),
  nextSyncAt: z.date().optional(),
});

export const IntegrationSetupStepSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(["oauth", "api_key", "config", "test", "complete"]),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
  data: z.record(z.any()).optional(),
});

export const IntegrationSetupWizardSchema = z.object({
  integrationId: z.string(),
  provider: z.string(),
  steps: z.array(IntegrationSetupStepSchema),
  currentStep: z.number().int().min(0),
  progress: z.number().min(0).max(100),
  canProceed: z.boolean(),
  canGoBack: z.boolean(),
});

// Types
export type SyncResult = z.infer<typeof SyncResultSchema>;
export type IntegrationSetupStep = z.infer<typeof IntegrationSetupStepSchema>;
export type IntegrationSetupWizard = z.infer<
  typeof IntegrationSetupWizardSchema
>;
