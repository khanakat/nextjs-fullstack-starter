import { Query } from '../../../../shared/application/base/query';

/**
 * Get MFA Devices Query
 * Query to get user MFA devices
 */
export class GetMfaDevicesQuery extends Query {
  constructor(public readonly userId: string) {
    super();
  }
}
