import { Command } from '@/shared/application/base/command';

export interface CreateUserCommandProps {
  clerkId?: string;
  email: string;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
}

/**
 * Create User Command
 * Command to create a new user in the system
 */
export class CreateUserCommand extends Command {
  constructor(public readonly props: CreateUserCommandProps) {
    super();
  }
}