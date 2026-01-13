import { Query } from '@/shared/application/base/query';

export interface GetUserQueryProps {
  userId: string;
}

/**
 * Get User Query
 * Query to retrieve a user by ID
 */
export class GetUserQuery extends Query {
  constructor(public readonly props: GetUserQueryProps) {
    super();
  }
}