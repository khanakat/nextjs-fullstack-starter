import { Command } from '@/shared/application/base/command';

/**
 * Command to handle OAuth callback from external provider
 */
export class HandleOAuthCallbackCommand extends Command {
  public readonly props: HandleOAuthCallbackCommandProps;

  constructor(props: HandleOAuthCallbackCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}

export interface HandleOAuthCallbackCommandProps {
  integrationId: string;
  code: string;
  state: string;
  organizationId: string;
  error?: string;
  errorDescription?: string;
}
