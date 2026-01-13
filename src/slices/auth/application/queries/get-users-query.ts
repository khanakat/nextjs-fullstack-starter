import { Query } from '../../../../shared/application/base/query';

/**
 * Get Users Query Props
 */
export interface GetUsersQueryProps {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  status?: string;
  search?: string;
}

/**
 * Get Users Query
 * Query to get paginated users
 */
export class GetUsersQuery extends Query {
  constructor(public readonly props: GetUsersQueryProps = {}) {
    super();
  }
}
