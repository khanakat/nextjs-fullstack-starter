/**
 * Offline Action Entity
 * Represents an action performed while offline that needs to be synced
 */

export enum OfflineActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface OfflineActionInfo {
  id: string;
  userId: string;
  action: string;
  data: Record<string, any>;
  timestamp: Date;
  retryCount: number;
  priority: OfflineActionPriority;
  synced: boolean;
  syncedAt: Date | null;
  lastError: string | null;
  deviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OfflineAction {
  constructor(private props: OfflineActionInfo) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get action(): string {
    return this.props.action;
  }

  get data(): Record<string, any> {
    return this.props.data;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get priority(): OfflineActionPriority {
    return this.props.priority;
  }

  get synced(): boolean {
    return this.props.synced;
  }

  get syncedAt(): Date | null {
    return this.props.syncedAt;
  }

  get lastError(): string | null {
    return this.props.lastError;
  }

  get deviceId(): string | null {
    return this.props.deviceId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  incrementRetryCount(): void {
    this.props.retryCount += 1;
    this.props.updatedAt = new Date();
  }

  markAsSynced(): void {
    this.props.synced = true;
    this.props.syncedAt = new Date();
    this.props.lastError = null;
    this.props.updatedAt = new Date();
  }

  markAsFailed(error: string): void {
    this.props.synced = false;
    this.props.lastError = error;
    this.props.updatedAt = new Date();
  }

  updatePriority(priority: OfflineActionPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      action: this.props.action,
      data: this.props.data,
      timestamp: this.props.timestamp,
      retryCount: this.props.retryCount,
      priority: this.props.priority,
      synced: this.props.synced,
      syncedAt: this.props.syncedAt,
      lastError: this.props.lastError,
      deviceId: this.props.deviceId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
