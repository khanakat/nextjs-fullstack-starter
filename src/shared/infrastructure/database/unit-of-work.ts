import { AggregateRoot } from '../../domain/base/aggregate-root';
import { DomainEvent } from '../../domain/base/domain-event';
import { PrismaClient } from '@prisma/client';
import { injectable, inject } from 'inversify';
import type { IEventBus } from '../events/in-memory-event-bus';
import { TYPES } from '../di/types';

/**
 * Unit of Work interface
 * Manages transactions and domain events
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  saveChanges(): Promise<void>;
  registerNew<T>(entity: AggregateRoot<T>): void;
  registerDirty<T>(entity: AggregateRoot<T>): void;
  registerDeleted<T>(entity: AggregateRoot<T>): void;
}

/**
 * Abstract Unit of Work implementation
 */
export abstract class BaseUnitOfWork implements IUnitOfWork {
  private newEntities: AggregateRoot<any>[] = [];
  private dirtyEntities: AggregateRoot<any>[] = [];
  private deletedEntities: AggregateRoot<any>[] = [];
  private domainEvents: DomainEvent[] = [];

  abstract begin(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;

  public registerNew<T>(entity: AggregateRoot<T>): void {
    if (this.isDeleted(entity)) {
      this.removeFromDeleted(entity);
    }
    if (!this.isNew(entity) && !this.isDirty(entity)) {
      this.newEntities.push(entity);
    }
  }

  public registerDirty<T>(entity: AggregateRoot<T>): void {
    if (!this.isDirty(entity) && !this.isNew(entity) && !this.isDeleted(entity)) {
      this.dirtyEntities.push(entity);
    }
  }

  public registerDeleted<T>(entity: AggregateRoot<T>): void {
    if (this.isNew(entity)) {
      this.removeFromNew(entity);
      return;
    }
    if (this.isDirty(entity)) {
      this.removeFromDirty(entity);
    }
    if (!this.isDeleted(entity)) {
      this.deletedEntities.push(entity);
    }
  }

  public async saveChanges(): Promise<void> {
    // Collect domain events before saving
    this.collectDomainEvents();

    // Save new entities
    for (const entity of this.newEntities) {
      await this.saveEntity(entity);
    }

    // Save dirty entities
    for (const entity of this.dirtyEntities) {
      await this.saveEntity(entity);
    }

    // Delete entities
    for (const entity of this.deletedEntities) {
      await this.deleteEntity(entity);
    }

    // Publish domain events
    await this.publishDomainEvents();

    // Clear tracking lists
    this.clearTracking();
  }

  protected abstract saveEntity<T>(entity: AggregateRoot<T>): Promise<void>;
  protected abstract deleteEntity<T>(entity: AggregateRoot<T>): Promise<void>;

  private collectDomainEvents(): void {
    const allEntities = [...this.newEntities, ...this.dirtyEntities];
    
    for (const entity of allEntities) {
      this.domainEvents.push(...entity.getUncommittedEvents());
    }
  }

  private async publishDomainEvents(): Promise<void> {
    for (const event of this.domainEvents) {
      await this.publishEvent(event);
    }

    // Mark events as committed
    const allEntities = [...this.newEntities, ...this.dirtyEntities];
    for (const entity of allEntities) {
      entity.markEventsAsCommitted();
    }
  }

  protected abstract publishEvent(event: DomainEvent): Promise<void>;

  private clearTracking(): void {
    this.newEntities = [];
    this.dirtyEntities = [];
    this.deletedEntities = [];
    this.domainEvents = [];
  }

  private isNew<T>(entity: AggregateRoot<T>): boolean {
    return this.newEntities.includes(entity);
  }

  private isDirty<T>(entity: AggregateRoot<T>): boolean {
    return this.dirtyEntities.includes(entity);
  }

  private isDeleted<T>(entity: AggregateRoot<T>): boolean {
    return this.deletedEntities.includes(entity);
  }

  private removeFromNew<T>(entity: AggregateRoot<T>): void {
    const index = this.newEntities.indexOf(entity);
    if (index !== -1) {
      this.newEntities.splice(index, 1);
    }
  }

  private removeFromDirty<T>(entity: AggregateRoot<T>): void {
    const index = this.dirtyEntities.indexOf(entity);
    if (index !== -1) {
      this.dirtyEntities.splice(index, 1);
    }
  }

  private removeFromDeleted<T>(entity: AggregateRoot<T>): void {
    const index = this.deletedEntities.indexOf(entity);
    if (index !== -1) {
      this.deletedEntities.splice(index, 1);
    }
  }
}

/**
 * Prisma-specific Unit of Work implementation
 */

@injectable()
export class PrismaUnitOfWork extends BaseUnitOfWork {
  private transaction?: any;

  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {
    super();
  }

  async begin(): Promise<void> {
    // Prisma handles transactions differently, we'll use the $transaction method
    // For now, we'll keep it simple and not use explicit transactions
  }

  async commit(): Promise<void> {
    // In Prisma, commits happen automatically
    await this.saveChanges();
  }

  async rollback(): Promise<void> {
    // Prisma handles rollbacks automatically on errors
  }

  protected async saveEntity<T>(entity: AggregateRoot<T>): Promise<void> {
    // Get the entity type name from the constructor
    const entityType = entity.constructor.name;
    
    // Get the repository for this entity type
    const repository = this.getRepository(entityType);
    
    if (!repository) {
      throw new Error(`No repository registered for entity type: ${entityType}`);
    }

    // Check if entity has an ID (new vs existing)
    const entityId = (entity as any).id;
    
    if (!entityId || entityId.value === undefined) {
      // New entity - create
      await repository.save(entity);
    } else {
      // Existing entity - update
      await repository.save(entity);
    }
  }

  protected async deleteEntity<T>(entity: AggregateRoot<T>): Promise<void> {
    // Get the entity type name from the constructor
    const entityType = entity.constructor.name;
    
    // Get the repository for this entity type
    const repository = this.getRepository(entityType);
    
    if (!repository) {
      throw new Error(`No repository registered for entity type: ${entityType}`);
    }

    // Get entity ID
    const entityId = (entity as any).id;
    
    if (!entityId) {
      throw new Error(`Cannot delete entity without ID: ${entityType}`);
    }

    // Delete the entity
    await repository.delete(entityId);
  }

  /**
   * Repository registry for entity types
   */
  private repositoryRegistry: Map<string, any> = new Map();

  /**
   * Register a repository for an entity type
   */
  public registerRepository(entityType: string, repository: any): void {
    this.repositoryRegistry.set(entityType, repository);
  }

  /**
   * Get repository for an entity type
   */
  private getRepository(entityType: string): any {
    return this.repositoryRegistry.get(entityType);
  }

  protected async publishEvent(event: DomainEvent): Promise<void> {
    // Publish event through the event bus
    await this.eventBus.publish(event);
  }
}