import { Command } from '../../../../shared/application/base/command';

/**
 * Delete Webhook Command Props
 */
export interface DeleteWebhookCommandProps {
  webhookId: string;
}

/**
 * Delete Webhook Command
 */
export class DeleteWebhookCommand extends Command {
  public readonly props: DeleteWebhookCommandProps;

  constructor(props: DeleteWebhookCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
