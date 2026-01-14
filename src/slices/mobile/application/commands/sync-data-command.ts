/**
 * Sync Data Command
 */

export interface SyncActionInput {
  id: string;
  action: string;
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
}

export interface SyncDataInput {
  userId: string;
  actions: SyncActionInput[];
  lastSyncTimestamp?: string;
  deviceId?: string;
}

export class SyncDataCommand {
  constructor(public readonly data: SyncDataInput) {}
}
