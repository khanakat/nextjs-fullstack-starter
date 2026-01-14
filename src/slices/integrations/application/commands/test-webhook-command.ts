import { Command } from '../../../../shared/application/base/command';

/**
 * Test Webhook Command Props
 */
export interface TestWebhookCommandProps {
  webhookId: string;
  event?: string;
  organizationId: string;
}

/**
 * Test Webhook Command
 */
export class TestWebhookCommand extends Command {
  public readonly props: TestWebhookCommandProps;

  constructor(props: TestWebhookCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
