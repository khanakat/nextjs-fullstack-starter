/**
 * Delete Offline Action Command
 */

export interface DeleteOfflineActionInput {
  userId: string;
  actionId?: string;
  deviceId?: string;
  synced?: boolean;
}

export class DeleteOfflineActionCommand {
  constructor(public readonly data: DeleteOfflineActionInput) {}
}
