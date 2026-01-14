/**
 * Get Server Updates Query
 */

export interface GetServerUpdatesInput {
  userId: string;
  organizationId: string | null;
  lastSyncTimestamp: string;
}

export class GetServerUpdatesQuery {
  constructor(public readonly data: GetServerUpdatesInput) {}
}
