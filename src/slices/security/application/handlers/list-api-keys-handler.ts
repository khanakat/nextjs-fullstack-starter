import { injectable } from 'inversify';
import { Result } from '@/shared/application/base/result';
import { ListApiKeysQuery } from '../../queries/api-keys-queries';
import { ApiKeyDto } from '../../dto';

/**
 * List API Keys Handler
 */
@injectable()
export class ListApiKeysHandler {
  async handle(query: ListApiKeysQuery): Promise<Result<ApiKeyDto[]>> {
    try {
      const { apiKeyManager } = await import('@/lib/security/api-key-manager');

      const apiKeys = await apiKeyManager.getApiKeys(query.organizationId);

      // Convert to DTOs
      const apiKeyDtos: ApiKeyDto[] = apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        organizationId: key.organizationId,
        permissions: key.permissions,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        rateLimit: key.rateLimit,
        usageCount: key.usageCount,
        keyPreview: key.keyHash.substring(0, 8) + '...',
      }));

      return Result.success(apiKeyDtos);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to list API keys'),
      );
    }
  }
}
