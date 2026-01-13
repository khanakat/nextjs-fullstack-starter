import { BaseDto } from '../../../../shared/application/base/dto';
import { MfaDeviceType } from '../../domain/entities/mfa-device';

/**
 * MFA Device DTO
 * Data Transfer Object for MFA device data
 */
export interface MfaDeviceDto extends BaseDto {
  type: MfaDeviceType;
  name?: string;
  phoneNumber?: string;
  verified: boolean;
  enabled: boolean;
  lastUsedAt?: Date;
}
