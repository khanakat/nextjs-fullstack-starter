import { Dto } from '../../base/dto';

/**
 * Cache Statistics DTO
 */
export class CacheStatisticsDto extends Dto {
  constructor(
    id: string,
    createdAt: Date,
    public readonly totalEntries: number,
    public readonly activeEntries: number,
    public readonly expiredEntries: number,
    public readonly totalHits: number,
    public readonly totalMisses: number,
    public readonly hitRate: number,
    public readonly memoryUsage: number,
    public readonly entriesByTag: Record<string, number>,
    public readonly oldestEntry?: Date,
    public readonly newestEntry?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      totalEntries: this.totalEntries,
      activeEntries: this.activeEntries,
      expiredEntries: this.expiredEntries,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: this.hitRate,
      memoryUsage: this.memoryUsage,
      oldestEntry: this.oldestEntry,
      newestEntry: this.newestEntry,
      entriesByTag: this.entriesByTag,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
