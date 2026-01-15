import { injectable } from 'inversify';
import { Result } from '@/shared/application/base/result';
import { CreateApiKeyCommand } from '@/slices/security/application/commands/api-keys-commands';
import { CreateApiKeyResponse } from '@/slices/security/application/dto';

/**
 * Create API Key Handler
 */
@injectable()
export class CreateApiKeyHandler {
  async handle(command: CreateApiKeyCommand): Promise<Result<CreateApiKeyResponse>> {
    try {
      const { apiKeyManager } = await import('@/lib/security/api-key-manager');
      const { ApiKeyPermission } = await import('@/lib/types/security');

      // Validate permissions
      const validPermissions = Object.values(ApiKeyPermission);
      const invalidPermissions = command.permissions.filter(
        (p) => !validPermissions.includes(p as any),
      );

      if (invalidPermissions.length > 0) {
        return Result.failure(
          new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`),
        );
      }

      const { apiKey, secretKey } = await apiKeyManager.createApiKey(
        command.name,
        command.organizationId,
        command.permissions as any[],
        command.expiresAt,
        command.rateLimit as any,
      );

      const response: CreateApiKeyResponse = {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          organizationId: apiKey.organizationId,
          permissions: apiKey.permissions,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt,
          expiresAt: apiKey.expiresAt,
          rateLimit: apiKey.rateLimit,
          usageCount: apiKey.usageCount,
        },
        secretKey,
        message:
          'API key created successfully. Save the secret key securely - it will not be shown again.',
      };

      return Result.success(response);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to create API key'),
      );
    }
  }
}
