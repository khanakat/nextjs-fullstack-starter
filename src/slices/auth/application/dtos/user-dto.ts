import { BaseDto } from '../../../../shared/application/base/dto';
import { UserRole, UserStatus } from '../../domain/entities/user';

/**
 * User DTO
 * Data Transfer Object for user data
 */
export interface UserDto extends BaseDto {
  clerkId?: string;
  email: string;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}
