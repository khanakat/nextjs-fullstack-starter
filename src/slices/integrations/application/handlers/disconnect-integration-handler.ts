import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { DisconnectIntegrationCommand } from '../commands/disconnect-integration-command';
import { OAuthService } from '../../../../api/services/integrations/OAuthService';
import { CredentialService } from '../../../../api/services/integrations/CredentialService';
import { db } from '@/lib/db';

/**
 * Handler for disconnecting integration connections
 */
@injectable()
export class DisconnectIntegrationHandler extends CommandHandler<DisconnectIntegrationCommand, Result<any>> {
  async handle(command: DisconnectIntegrationCommand): Promise<Result<any>> {
    const { integrationId, connectionId } = command.props;

    try {
      // Note: We're using OAuthService.revokeConnection which handles both OAuth and credential-based connections
      // This ensures proper cleanup and logging

      // First, we need to get the organizationId from the integration
      const integration = await db.integration.findUnique({
        where: { id: integrationId },
        select: { organizationId: true },
      });

      if (!integration) {
        return Result.failure(new Error('Integration not found'));
      }

      // Revoke the connection
      const result = await OAuthService.revokeConnection(
        connectionId,
        integration.organizationId
      );

      if (!result.success) {
        return Result.failure(result.error || 'Failed to disconnect integration');
      }

      return Result.success({
        success: true,
        message: 'Integration disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      return Result.failure(new Error('Failed to disconnect integration'));
    }
  }
}
