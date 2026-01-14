/**
 * Update Device Command
 */

import { DeviceCapabilities } from '../../domain/entities/device.entity';

export interface UpdateDeviceInput {
  userId: string;
  deviceId: string;
  lastSeen?: string;
  capabilities?: DeviceCapabilities;
  isActive?: boolean;
}

export class UpdateDeviceCommand {
  constructor(public readonly data: UpdateDeviceInput) {}
}
