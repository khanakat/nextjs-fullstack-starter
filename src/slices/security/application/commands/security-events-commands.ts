/**
 * Command to update security event
 */
export class UpdateSecurityEventCommand {
  public readonly eventId: string;
  public readonly resolved: boolean;
  public readonly userId: string;

  constructor(params: {
    eventId: string;
    resolved: boolean;
    userId: string;
  }) {
    this.eventId = params.eventId;
    this.resolved = params.resolved;
    this.userId = params.userId;
  }
}
