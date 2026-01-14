import { injectable } from 'inversify';
import { Handler, Result } from '@/shared/domain/handler';
import { DisconnectIntegrationCommand } from '../../commands/disconnect-integration-command';
import { OAuthService } from '../../../../api/services/integrations/OAuthService';
import { CredentialService } from '../../../../api/services/integrations/CredentialService';

/**
 * Handler for disconnecting integration connections
 */
@injectable()
export class DisconnectIntegrationHandler implements Handler<DisconnectIntegrationCommand, Result<any>> {
  async handle(command: DisconnectIntegrationCommand): Promise<Result<any>> {
    const { integrationId, connectionId } = command.props;

    try {
      // Note: We're using OAuthService.revokeConnection which handles both OAuth and credential-based connections
      // This ensures proper cleanup and logging

      // First, we need to get the organizationId from the integration
      const { prisma } = await import('@/lib/db');
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
        select: { organizationId: true },
      });

      if (!integration) {
        return Result.fail('Integration not found');
      }

      // Revoke the connection
      const result = await OAuthService.revokeConnection(
        connectionId,
        integration.organizationId
      );

      if (!result.success) {
        return Result.fail(result.error || 'Failed to disconnect integration');
      }

      return Result.ok({
        success: true,
        message: 'Integration disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      return Result.fail('Failed to disconnect integration');
    }
  }
}
