import { Command } from '../../../../shared/application/base/command';

/**
 * Process Webhook Command Props
 */
export interface ProcessWebhookCommandProps {
  webhookId: string;
  payload: any;
  headers: Record<string, string>;
  organizationId: string;
}

/**
 * Process Webhook Command
 */
export class ProcessWebhookCommand extends Command {
  public readonly props: ProcessWebhookCommandProps;

  constructor(props: ProcessWebhookCommandProps) {
    super();
    this.props = props;
  }
}
