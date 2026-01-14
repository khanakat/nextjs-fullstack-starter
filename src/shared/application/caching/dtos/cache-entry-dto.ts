import { Dto } from '../../base/dto';

/**
 * Cache Entry DTO
 */
export class CacheEntryDto extends Dto {
  constructor(
    id: string,
    createdAt: Date,
    public readonly key: string,
    public readonly value: string,
    public readonly ttl: number,
    public readonly tags: string[],
    public readonly hitCount: number,
    public readonly expiresAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
      ttl: this.ttl,
      tags: this.tags,
      expiresAt: this.expiresAt,
      hitCount: this.hitCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
