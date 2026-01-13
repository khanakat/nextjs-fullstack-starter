import { BaseDto } from '../../../../shared/application/base/dto';
import { SessionType, SessionStatus } from '../../domain/entities/session';

/**
 * Session DTO
 * Data Transfer Object for session data
 */
export interface SessionDto extends BaseDto {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  type: SessionType;
  status: SessionStatus;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  lastActivityAt: Date;
}
