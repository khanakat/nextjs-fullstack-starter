/**
 * Register Device Command
 */

import { DeviceType, DeviceCapabilities } from '../../domain/entities/device.entity';

export interface RegisterDeviceInput {
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  platform: string;
  browserName: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  capabilities: DeviceCapabilities;
  timezone: string;
  language: string;
}

export class RegisterDeviceCommand {
  constructor(public readonly data: RegisterDeviceInput) {}
}
