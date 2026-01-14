/**
 * Get Device Query
 */

export interface GetDeviceInput {
  userId: string;
  deviceId: string;
}

export class GetDeviceQuery {
  constructor(public readonly data: GetDeviceInput) {}
}
