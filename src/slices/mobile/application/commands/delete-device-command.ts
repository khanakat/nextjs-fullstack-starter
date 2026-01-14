/**
 * Delete Device Command
 */

export interface DeleteDeviceInput {
  userId: string;
  deviceId: string;
}

export class DeleteDeviceCommand {
  constructor(public readonly data: DeleteDeviceInput) {}
}
