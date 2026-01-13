import { Command } from '@/shared/application/base/command';

export interface UpdateUserCommandProps {
  userId: string;
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  imageUrl?: string;
}

/**
 * Update User Command
 * Command to update user profile information
 */
export class UpdateUserCommand extends Command {
  constructor(public readonly props: UpdateUserCommandProps) {
    super();
  }
}