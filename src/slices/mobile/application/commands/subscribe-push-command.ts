/**
 * Subscribe Push Command
 */

export interface SubscribePushInput {
  userId: string;
  organizationId: string | null;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceId?: string;
  deviceType?: string;
  browserName?: string;
  browserVersion?: string;
  platform?: string;
  userAgent?: string;
}

export class SubscribePushCommand {
  constructor(public readonly data: SubscribePushInput) {}
}
