import { Command } from '../../../../shared/application/base/command';

/**
 * Update Webhook Command Props
 */
export interface UpdateWebhookCommandProps {
  webhookId: string;
  url?: string;
  events?: string[];
  isEnabled?: boolean;
}

/**
 * Update Webhook Command
 */
export class UpdateWebhookCommand extends Command {
  public readonly props: UpdateWebhookCommandProps;

  constructor(props: UpdateWebhookCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
