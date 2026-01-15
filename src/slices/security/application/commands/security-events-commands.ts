import { Command } from '@/shared/application/base';

/**
 * TODO: Implement security events commands
 * Placeholder to prevent TypeScript compilation errors
 */
export class CreateSecurityEventCommand extends Command {
  constructor(public props: any) {
    super();
  }
}

export class AcknowledgeSecurityEventCommand extends Command {
  constructor(public props: any) {
    super();
  }
}

export class UpdateSecurityEventCommand extends Command {
  constructor(public props: any) {
    super();
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get resolved(): boolean {
    return this.props.resolved;
  }

  get updaterUserId(): string {
    return this.props.userId;
  }
}
