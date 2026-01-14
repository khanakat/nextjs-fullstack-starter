/**
 * Get Notification Preferences Query
 */

export interface GetNotificationPreferencesInput {
  userId: string;
}

export class GetNotificationPreferencesQuery {
  constructor(public readonly data: GetNotificationPreferencesInput) {}
}
