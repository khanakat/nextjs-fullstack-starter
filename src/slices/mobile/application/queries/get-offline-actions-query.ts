/**
 * Get Offline Actions Query
 */

export interface GetOfflineActionsInput {
  userId: string;
  deviceId?: string;
  priority?: 'low' | 'medium' | 'high';
  synced?: boolean;
  limit?: number;
}

export class GetOfflineActionsQuery {
  constructor(public readonly data: GetOfflineActionsInput) {}
}
