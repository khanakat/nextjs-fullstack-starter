/**
 * Update Offline Action Command
 */

import { OfflineActionPriority } from '../../domain/entities/offline-action.entity';

export interface UpdateOfflineActionInput {
  userId: string;
  actionId: string;
  retryCount?: number;
  priority?: OfflineActionPriority;
  synced?: boolean;
}

export class UpdateOfflineActionCommand {
  constructor(public readonly data: UpdateOfflineActionInput) {}
}
