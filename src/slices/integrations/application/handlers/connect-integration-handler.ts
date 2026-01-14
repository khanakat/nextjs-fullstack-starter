import { injectable } from 'inversify';
import { Handler, Result } from '@/shared/domain/handler';
import { ConnectIntegrationCommand } from '../../commands/connect-integration-command';
import { OAuthService } from '../../../../api/services/integrations/OAuthService';
import { CredentialService } from '../../../../api/services/integrations/CredentialService';
import { prisma } from '@/lib/db';

/**
 * Handler for connecting integrations (OAuth or direct credentials)
 */
@injectable()
export class ConnectIntegrationHandler implements Handler<ConnectIntegrationCommand, Result<any>> {
  async handle(command: ConnectIntegrationCommand): Promise<Result<any>> {
    const { integrationId, connectionType, credentials, config, redirectUrl } = command.props;

    try {
      // Get integration to verify access
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          organization: {
            members: {
              some: { userId: command.userId },
            },
          },
        },
      });

      if (!integration) {
        return Result.fail('Integration not found or access denied');
      }

      const provider = integration.provider as any;
      const mergedConfig = {
        ...JSON.parse(integration.config as string),
        ...config,
      };

      // Handle different connection types
      switch (connectionType) {
        case 'oauth':
          // Generate OAuth authorization URL
          const authResult = await OAuthService.getAuthorizationUrl(
            provider,
            mergedConfig,
            integration.organizationId,
            command.userId!
          );

          return Result.ok({
            type: 'oauth',
            authorizationUrl: authResult.authUrl,
            state: authResult.state,
            integrationId: authResult.integrationId,
          });

        case 'api_key':
        case 'basic_auth':
        case 'bearer_token':
        case 'custom':
          // Store credentials directly
          if (!credentials) {
            return Result.fail('Credentials required for this connection type');
          }

          const credentialResult = await CredentialService.storeCredentials(
            integration.id,
            credentials,
            connectionType,
            integration.organizationId
          );

          if (!credentialResult.success) {
            return Result.fail(credentialResult.error || 'Failed to store credentials');
          }

          return Result.ok({
            type: 'credentials',
            success: true,
            connectionId: credentialResult.connectionId,
          });

        default:
          return Result.fail('Unsupported connection type');
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      return Result.fail('Failed to connect integration');
    }
  }
}
