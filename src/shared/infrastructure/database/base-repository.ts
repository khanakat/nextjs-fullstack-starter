import { AggregateRoot } from '../../domain/base/aggregate-root';

/**
 * Base Repository interface
 * All repositories should implement this interface
 */
export interface IRepository<TEntity extends AggregateRoot<TId>, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}

/**
 * Abstract base repository class
 * Provides common functionality for all repositories
 */
export abstract class BaseRepository<TEntity extends AggregateRoot<TId>, TId> 
  implements IRepository<TEntity, TId> {
  
  constructor(protected readonly db: any) {}

  abstract findById(id: TId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<void>;

  /**
   * Converts raw database data to domain entity
   */
  protected abstract toDomain(raw: any): TEntity;

  /**
   * Converts domain entity to database persistence format
   */
  protected abstract toPersistence(entity: TEntity): any;

  /**
   * Saves multiple entities in a transaction
   */
  protected async saveMany(entities: TEntity[]): Promise<void> {
    for (const entity of entities) {
      await this.save(entity);
    }
  }

  /**
   * Finds entities by a list of IDs
   */
  protected async findByIds(ids: TId[]): Promise<TEntity[]> {
    const entities: TEntity[] = [];
    for (const id of ids) {
      const entity = await this.findById(id);
      if (entity) {
        entities.push(entity);
      }
    }
    return entities;
  }
}