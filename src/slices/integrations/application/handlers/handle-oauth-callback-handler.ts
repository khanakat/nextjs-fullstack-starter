import { injectable } from 'inversify';
import { Handler, Result } from '@/shared/domain/handler';
import { HandleOAuthCallbackCommand } from '../../commands/handle-oauth-callback-command';
import { OAuthService } from '../../../../api/services/integrations/OAuthService';

/**
 * Handler for OAuth callback processing
 */
@injectable()
export class HandleOAuthCallbackHandler implements Handler<HandleOAuthCallbackCommand, Result<any>> {
  async handle(command: HandleOAuthCallbackCommand): Promise<Result<any>> {
    const { integrationId, code, state, organizationId, error, errorDescription } = command.props;

    try {
      // Handle OAuth error if present
      if (error) {
        return Result.fail({
          success: false,
          error: error,
          errorDescription: errorDescription || 'OAuth authorization failed',
        });
      }

      // Validate required parameters
      if (!code || !state || !integrationId) {
        return Result.fail({
          success: false,
          error: 'invalid_request',
          errorDescription: 'Missing required OAuth parameters',
        });
      }

      // Handle OAuth callback
      const result = await OAuthService.handleCallback(
        integrationId,
        code,
        state,
        organizationId
      );

      return Result.ok(result);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return Result.fail({
        success: false,
        error: 'callback_error',
        errorDescription: 'OAuth callback processing failed',
      });
    }
  }
}
