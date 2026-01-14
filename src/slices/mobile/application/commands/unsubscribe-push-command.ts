/**
 * Unsubscribe Push Command
 */

export interface UnsubscribePushInput {
  userId: string;
  endpoint?: string;
  subscriptionId?: string;
  deviceId?: string;
}

export class UnsubscribePushCommand {
  constructor(public readonly data: UnsubscribePushInput) {}
}
