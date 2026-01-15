import { Command } from '@/shared/application/base';

/**
 * TODO: Implement API key commands
 * Placeholder to prevent TypeScript compilation errors
 */
export class CreateApiKeyCommand extends Command {
  constructor(public props: any) {
    super();
  }

  get name(): string {
    return this.props.name;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get permissions(): string[] {
    return this.props.permissions || [];
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get rateLimit(): number | undefined {
    return this.props.rateLimit;
  }
}

export class DeleteApiKeyCommand extends Command {
  constructor(public props: any) {
    super();
  }
}

export class UpdateApiKeyCommand extends Command {
  constructor(public props: any) {
    super();
  }
}
