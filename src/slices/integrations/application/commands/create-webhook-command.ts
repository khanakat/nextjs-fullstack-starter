import { Command } from '../../../../shared/application/base/command';

/**
 * Create Webhook Command Props
 */
export interface CreateWebhookCommandProps {
  integrationId: string;
  name: string;
  url: string;
  method: string;
  events: string[];
  filters?: Record<string, any>;
  headers?: Record<string, string>;
  retryPolicy?: Record<string, any>;
  timeout?: number;
  organizationId: string;
}

/**
 * Create Webhook Command
 */
export class CreateWebhookCommand extends Command {
  public readonly props: CreateWebhookCommandProps;

  constructor(props: CreateWebhookCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
