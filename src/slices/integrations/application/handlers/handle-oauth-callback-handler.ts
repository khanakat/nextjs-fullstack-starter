import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { HandleOAuthCallbackCommand } from '../../commands';
import { OAuthService } from '../../../../api/services/integrations/OAuthService';

/**
 * Handler for OAuth callback processing
 */
@injectable()
export class HandleOAuthCallbackHandler extends CommandHandler<HandleOAuthCallbackCommand, Result<any>> {
  async handle(command: HandleOAuthCallbackCommand): Promise<Result<any>> {
    const { integrationId, code, state, organizationId, error, errorDescription } = command.props;

    try {
      // Handle OAuth error if present
      if (error) {
        return Result.failure(new Error(`${error}: ${errorDescription || 'OAuth authorization failed'}`));
      }

      // Validate required parameters
      if (!code || !state || !integrationId) {
        return Result.failure(new Error('Missing required OAuth parameters'));
      }

      // Handle OAuth callback
      const result = await OAuthService.handleCallback(
        integrationId,
        code,
        state,
        organizationId
      );

      return Result.success(result);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return Result.failure(new Error('OAuth callback processing failed'));
    }
  }
}
