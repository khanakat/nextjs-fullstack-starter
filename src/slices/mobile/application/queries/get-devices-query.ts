/**
 * Get Devices Query
 */

export interface GetDevicesInput {
  userId: string;
  activeOnly?: boolean;
}

export class GetDevicesQuery {
  constructor(public readonly data: GetDevicesInput) {}
}
