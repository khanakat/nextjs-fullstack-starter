import { Query } from '../../../../shared/application/base/query';

/**
 * Get User Query Props
 */
export interface GetUserQueryProps {
  userId: string;
}

/**
 * Get User Query
 * Query to get a user by ID
 */
export class GetUserQuery extends Query {
  constructor(public readonly props: GetUserQueryProps) {
    super();
  }
}
