import { BaseDto } from '@/shared/application/base/dto';

/**
 * User Data Transfer Object
 * Used for transferring user data between layers
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
  role: string;
}

/**
 * User Profile DTO for public display
 */
export interface UserProfileDto {
  id: string;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
}

/**
 * User Summary DTO for lists and references
 */
export interface UserSummaryDto {
  id: string;
  name?: string;
  username?: string;
  imageUrl?: string;
  role: string;
}