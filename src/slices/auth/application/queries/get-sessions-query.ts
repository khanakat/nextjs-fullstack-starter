import { Query } from '../../../../shared/application/base/query';

/**
 * Get Sessions Query Props
 */
export interface GetSessionsQueryProps {
  userId: string;
  activeOnly?: boolean;
}

/**
 * Get Sessions Query
 * Query to get user sessions
 */
export class GetSessionsQuery extends Query {
  constructor(public readonly props: GetSessionsQueryProps) {
    super();
  }
}
