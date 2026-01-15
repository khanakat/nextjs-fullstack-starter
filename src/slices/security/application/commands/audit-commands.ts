import { Command } from '@/shared/application/base';

/**
 * TODO: Implement audit commands
 * Placeholder to prevent TypeScript compilation errors
 */
export class CreateAuditLogCommand extends Command {
  constructor(public props: any) {
    super();
  }
}

export class ResolveViolationCommand extends Command {
  constructor(public props: any) {
    super();
  }

  get violationId(): string {
    return this.props.violationId;
  }

  get resolverUserId(): string {
    return this.props.userId;
  }

  get resolution(): string {
    return this.props.resolution;
  }
}

export class LogPermissionCheckCommand extends Command {
  constructor(public props: any) {
    super();
  }

  get targetUserId(): string {
    return this.props.targetUserId;
  }

  get targetUserEmail(): string {
    return this.props.targetUserEmail;
  }

  get targetUserRole(): string {
    return this.props.targetUserRole;
  }

  get resource(): string {
    return this.props.resource;
  }

  get action(): string {
    return this.props.action;
  }

  get granted(): boolean {
    return this.props.granted;
  }

  get context(): any {
    return this.props.context;
  }
}

export class CreateViolationCommand extends Command {
  constructor(public props: any) {
    super();
  }

  get violation(): any {
    return this.props.violation;
  }
}
