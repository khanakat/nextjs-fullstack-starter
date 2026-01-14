import { Command } from '@/shared/domain/command';

/**
 * Command to test integration connection
 */
export class TestIntegrationCommand extends Command {
  public readonly props: TestIntegrationCommandProps;

  constructor(props: TestIntegrationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}

export interface TestIntegrationCommandProps {
  integrationId: string;
  connectionId?: string;
  testCapabilities?: boolean;
}
