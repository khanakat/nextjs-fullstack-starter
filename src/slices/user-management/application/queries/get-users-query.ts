import { Query } from '@/shared/application/base/query';

export interface GetUsersQueryProps {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

/**
 * Get Users Query
 * Query to retrieve users with pagination and filtering
 */
export class GetUsersQuery extends Query {
  constructor(public readonly props: GetUsersQueryProps) {
    super();
  }
}