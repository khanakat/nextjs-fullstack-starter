import { CreateApiKeyRequest } from '../dto';

/**
 * Command to create a new API key
 */
export class CreateApiKeyCommand {
  public readonly name: string;
  public readonly organizationId: string;
  public readonly permissions: string[];
  public readonly expiresAt?: Date;
  public readonly rateLimit: {
    requests: number;
    windowMs: number;
  };
  public readonly userId: string;

  constructor(params: CreateApiKeyRequest & { userId: string }) {
    this.name = params.name;
    this.organizationId = params.organizationId;
    this.permissions = params.permissions;
    this.expiresAt = params.expiresAt ? new Date(params.expiresAt) : undefined;
    this.rateLimit = params.rateLimit || {
      requests: 1000,
      windowMs: 60 * 60 * 1000,
    };
    this.userId = params.userId;
  }
}
