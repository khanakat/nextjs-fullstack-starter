/**
 * Command to resolve a violation
 */
export class ResolveViolationCommand {
  public readonly violationId: string;
  public readonly userId: string;
  public readonly resolution: string;

  constructor(params: {
    violationId: string;
    userId: string;
    resolution: string;
  }) {
    this.violationId = params.violationId;
    this.userId = params.userId;
    this.resolution = params.resolution;
  }
}

/**
 * Command to log a permission check
 */
export class LogPermissionCheckCommand {
  public readonly targetUserId: string;
  public readonly targetUserEmail: string;
  public readonly targetUserRole: string;
  public readonly resource: string;
  public readonly action: string;
  public readonly granted: boolean;
  public readonly context?: Record<string, any>;

  constructor(params: {
    targetUserId: string;
    targetUserEmail: string;
    targetUserRole: string;
    resource: string;
    action: string;
    granted: boolean;
    context?: Record<string, any>;
  }) {
    this.targetUserId = params.targetUserId;
    this.targetUserEmail = params.targetUserEmail;
    this.targetUserRole = params.targetUserRole;
    this.resource = params.resource;
    this.action = params.action;
    this.granted = params.granted;
    this.context = params.context;
  }
}

/**
 * Command to create a violation
 */
export class CreateViolationCommand {
  public readonly violation: Record<string, any>;

  constructor(params: { violation: Record<string, any> }) {
    this.violation = params.violation;
  }
}
