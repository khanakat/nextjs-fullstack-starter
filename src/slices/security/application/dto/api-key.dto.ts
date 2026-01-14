/**
 * DTO for API Key operations
 */

export interface ApiKeyDto {
  id: string;
  name: string;
  organizationId: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  usageCount: number;
  keyPreview?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  organizationId: string;
  permissions: string[];
  expiresAt?: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface CreateApiKeyResponse {
  apiKey: ApiKeyDto;
  secretKey: string;
  message: string;
}

export interface ListApiKeysRequest {
  organizationId: string;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKeyDto[];
}
