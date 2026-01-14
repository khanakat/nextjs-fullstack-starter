/**
 * Queue Offline Action Command
 */

import { OfflineActionPriority } from '../../domain/entities/offline-action.entity';

export interface OfflineActionInput {
  id: string;
  action: string;
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
  priority: OfflineActionPriority;
}

export interface QueueOfflineActionInput {
  userId: string;
  actions: OfflineActionInput[];
  deviceId?: string;
}

export class QueueOfflineActionCommand {
  constructor(public readonly data: QueueOfflineActionInput) {}
}
