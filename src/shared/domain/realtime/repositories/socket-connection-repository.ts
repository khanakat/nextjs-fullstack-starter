import { SocketConnection } from '../entities/socket-connection';
import { SocketId } from '../value-objects/socket-id';
import { RoomId } from '../value-objects/room-id';
import { ConnectionStatus } from '../value-objects/connection-status';

export interface SocketConnectionSearchCriteria {
  userId?: string;
  organizationId?: string;
  status?: ConnectionStatus;
  currentRoom?: RoomId;
  connectedBefore?: Date;
  connectedAfter?: Date;
  lastActivityBefore?: Date;
  lastActivityAfter?: Date;
}

export interface ISocketConnectionRepository {
  /**
   * Save a socket connection
   */
  save(connection: SocketConnection): Promise<void>;

  /**
   * Find socket connection by socket ID
   */
  findBySocketId(socketId: SocketId): Promise<SocketConnection | null>;

  /**
   * Find socket connections by user ID
   */
  findByUserId(userId: string): Promise<SocketConnection[]>;

  /**
   * Find active socket connections by user ID
   */
  findActiveByUserId(userId: string): Promise<SocketConnection[]>;

  /**
   * Find socket connections by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<SocketConnection[]>;

  /**
   * Find socket connections by room ID
   */
  findByRoomId(roomId: RoomId): Promise<SocketConnection[]>;

  /**
   * Search socket connections with criteria
   */
  search(criteria: SocketConnectionSearchCriteria): Promise<SocketConnection[]>;

  /**
   * Delete socket connection
   */
  delete(socketId: SocketId): Promise<void>;

  /**
   * Delete socket connections by user ID
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Delete socket connections by organization ID
   */
  deleteByOrganizationId(organizationId: string): Promise<void>;

  /**
   * Check if socket connection exists
   */
  exists(socketId: SocketId): Promise<boolean>;

  /**
   * Count socket connections by criteria
   */
  count(criteria: SocketConnectionSearchCriteria): Promise<number>;

  /**
   * Get active connections count
   */
  getActiveConnectionsCount(): Promise<number>;

  /**
   * Get active connections count for organization
   */
  getActiveConnectionsCountForOrganization(organizationId: string): Promise<number>;

  /**
   * Clean up old disconnected connections
   */
  cleanupOldConnections(olderThan: Date): Promise<number>;

  /**
   * Update connection status
   */
  updateStatus(socketId: SocketId, status: ConnectionStatus): Promise<void>;

  /**
   * Update connection activity
   */
  updateActivity(socketId: SocketId): Promise<void>;
}
