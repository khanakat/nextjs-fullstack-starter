import { Dto } from '../../../../shared/application/base/dto';
import { IntegrationStatus } from '../../domain/entities/integration';

/**
 * Integration DTO
 */
export class IntegrationDto extends Dto {
  constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date | undefined,
    public name: string,
    public type: string,
    public provider: string,
    public config: string,
    public organizationId: string | null,
    public status: IntegrationStatus,
    public lastSyncAt: Date | null,
    public lastError: string | null
  ) {
    super(id, createdAt, updatedAt);
  }

  toObject() {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      name: this.name,
      type: this.type,
      provider: this.provider,
      config: this.config,
      organizationId: this.organizationId,
      status: this.status,
      lastSyncAt: this.lastSyncAt?.toISOString() ?? null,
      lastError: this.lastError,
    };
  }

  static fromDomain(integration: any): IntegrationDto {
    return new IntegrationDto(
      integration.id.value,
      new Date(),
      undefined,
      integration.name,
      integration.type,
      integration.provider,
      integration.config,
      integration.organizationId ?? null,
      integration.status,
      integration.lastSyncAt ?? null,
      integration.lastError ?? null
    );
  }
}
