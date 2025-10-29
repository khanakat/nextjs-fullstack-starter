import { Server as SocketIOServer } from "socket.io";
import { db as prisma } from "@/lib/db";
import { Operation } from "./sync-service";

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  type: CollaborationEventType;
  data: any;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type CollaborationEventType =
  | "document_change"
  | "cursor_move"
  | "selection_change"
  | "typing_start"
  | "typing_stop"
  | "comment_add"
  | "comment_update"
  | "comment_delete"
  | "user_join"
  | "user_leave"
  | "presence_update"
  | "document_lock"
  | "document_unlock"
  | "version_create"
  | "conflict_detected"
  | "sync_request"
  | "sync_response";

export interface CursorPosition {
  documentId: string;
  userId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  timestamp: Date;
}

export interface TypingIndicator {
  documentId: string;
  userId: string;
  isTyping: boolean;
  position?: number;
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  location: string;
  documentId?: string;
  lastSeen: Date;
  metadata?: Record<string, any>;
}

class CollaborationEventService {
  private io: SocketIOServer | null = null;
  private activeUsers = new Map<string, UserPresence>();
  private typingUsers = new Map<string, TypingIndicator>();
  private cursorPositions = new Map<string, CursorPosition>();

  setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Broadcast event to all users in a collaboration session
   */
  async broadcastToSession(
    sessionId: string,
    event: Omit<CollaborationEvent, "id" | "timestamp">,
    excludeUserId?: string,
  ) {
    if (!this.io) {
      console.warn("Socket.IO server not initialized");
      return;
    }

    const eventWithId: CollaborationEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Store event in database
    try {
      await prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: event.type,
          data: JSON.stringify(event.data),
          userId: event.userId,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      });
    } catch (error) {
      console.error("Error storing collaboration event:", error);
    }

    // Broadcast to room
    const room = `session:${sessionId}`;
    if (excludeUserId) {
      this.io
        .to(room)
        .except(`user:${excludeUserId}`)
        .emit("collaboration_event", eventWithId);
    } else {
      this.io.to(room).emit("collaboration_event", eventWithId);
    }
  }

  /**
   * Broadcast document changes with operational transformation
   */
  async broadcastDocumentChange(
    sessionId: string,
    _documentId: string,
    operations: Operation[],
    userId: string,
    version: number,
    excludeUserId?: string,
  ) {
    await this.broadcastToSession(
      sessionId,
      {
        sessionId,
        type: "document_change",
        data: {
          // documentId, // Commented out as documentId field doesn't exist in UserPresence model
          operations,
          version,
          timestamp: new Date(),
        },
        userId,
        metadata: {
          operationCount: operations.length,
          documentType: "text", // Could be dynamic based on document
        },
      },
      excludeUserId,
    );
  }

  /**
   * Update and broadcast cursor position
   */
  async updateCursorPosition(
    sessionId: string,
    documentId: string,
    userId: string,
    position: number,
    selection?: { start: number; end: number },
  ) {
    const cursorData: CursorPosition = {
      documentId,
      userId,
      position,
      selection,
      timestamp: new Date(),
    };

    // Store in memory for quick access
    this.cursorPositions.set(`${documentId}:${userId}`, cursorData);

    await this.broadcastToSession(
      sessionId,
      {
        sessionId,
        type: "cursor_move",
        data: cursorData,
        userId,
      },
      userId, // Exclude the user who moved the cursor
    );
  }

  /**
   * Update and broadcast typing indicator
   */
  async updateTypingIndicator(
    sessionId: string,
    documentId: string,
    userId: string,
    isTyping: boolean,
    position?: number,
  ) {
    const typingData: TypingIndicator = {
      documentId,
      userId,
      isTyping,
      position,
      timestamp: new Date(),
    };

    const key = `${documentId}:${userId}`;

    if (isTyping) {
      this.typingUsers.set(key, typingData);

      // Auto-clear typing indicator after 3 seconds
      setTimeout(() => {
        const current = this.typingUsers.get(key);
        if (current && current.timestamp === typingData.timestamp) {
          this.typingUsers.delete(key);
          this.updateTypingIndicator(sessionId, documentId, userId, false);
        }
      }, 3000);
    } else {
      this.typingUsers.delete(key);
    }

    await this.broadcastToSession(
      sessionId,
      {
        sessionId,
        type: isTyping ? "typing_start" : "typing_stop",
        data: typingData,
        userId,
      },
      userId, // Exclude the typing user
    );
  }

  /**
   * Update user presence
   */
  async updateUserPresence(
    userId: string,
    status: UserPresence["status"],
    location: string,
    documentId?: string,
    metadata?: Record<string, any>,
  ) {
    const presence: UserPresence = {
      userId,
      status,
      location,
      documentId,
      lastSeen: new Date(),
      metadata,
    };

    this.activeUsers.set(userId, presence);

    // Update in database
    try {
      await prisma.userPresence.upsert({
        where: { userId },
        update: {
          status,
          location,
          // documentId, // Commented out as documentId field doesn't exist in UserPresence model
          lastSeen: new Date(),
          // metadata: metadata ? JSON.stringify(metadata) : undefined, // Commented out as metadata field doesn't exist in UserPresence model
        },
        create: {
          userId,
          status,
          location,
          // documentId, // Commented out as documentId field doesn't exist in UserPresence model
          lastSeen: new Date(),
          // metadata: metadata ? JSON.stringify(metadata) : undefined, // Commented out as metadata field doesn't exist in UserPresence model
        },
      });
    } catch (error) {
      console.error("Error updating user presence:", error);
    }

    // Broadcast to all active sessions where this user is present
    const userSessions = await this.getUserActiveSessions(userId);

    for (const sessionId of userSessions) {
      await this.broadcastToSession(sessionId, {
        sessionId,
        type: "presence_update",
        data: presence,
        userId,
      });
    }
  }

  /**
   * Handle user joining a collaboration session
   */
  async handleUserJoin(
    sessionId: string,
    userId: string,
    socketId: string,
    metadata?: Record<string, any>,
  ) {
    if (!this.io) return;

    // Join socket to session room
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      await socket.join(`session:${sessionId}`);
      await socket.join(`user:${userId}`);
    }

    // Update session participants
    try {
      await prisma.collaborationParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        update: {
          lastActivity: new Date(),
          // isActive: true, // Commented out as isActive field doesn't exist in CollaborationParticipant model
          // socketId, // Commented out as socketId field doesn't exist in CollaborationParticipant model
        },
        create: {
          sessionId,
          userId,
          role: "editor", // Default role
          joinedAt: new Date(),
          lastActivity: new Date(),
          // isActive: true, // Commented out as isActive field doesn't exist in CollaborationParticipant model
          // socketId, // Commented out as socketId field doesn't exist in CollaborationParticipant model
        },
      });
    } catch (error) {
      console.error("Error updating session participant:", error);
    }

    // Broadcast user join event
    await this.broadcastToSession(
      sessionId,
      {
        sessionId,
        type: "user_join",
        data: {
          userId,
          joinedAt: new Date(),
          metadata,
        },
        userId,
      },
      userId,
    );

    // Send current session state to the joining user
    await this.sendSessionState(sessionId, userId);
  }

  /**
   * Handle user leaving a collaboration session
   */
  async handleUserLeave(sessionId: string, userId: string, socketId: string) {
    if (!this.io) return;

    // Leave socket rooms
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      await socket.leave(`session:${sessionId}`);
    }

    // Update session participants
    try {
      await prisma.collaborationParticipant.updateMany({
        where: {
          sessionId,
          userId,
          // socketId, // Commented out as socketId field doesn't exist in CollaborationParticipant model
        },
        data: {
          // isActive: false, // Commented out as isActive field doesn't exist in CollaborationParticipant model
          leftAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating session participant on leave:", error);
    }

    // Clean up user data
    this.cleanupUserData(userId);

    // Broadcast user leave event
    await this.broadcastToSession(
      sessionId,
      {
        sessionId,
        type: "user_leave",
        data: {
          userId,
          leftAt: new Date(),
        },
        userId,
      },
      userId,
    );
  }

  /**
   * Send current session state to a user
   */
  private async sendSessionState(sessionId: string, userId: string) {
    if (!this.io) return;

    try {
      // Get session participants
      const participants = await prisma.collaborationParticipant.findMany({
        where: {
          sessionId,
          // isActive: true, // Commented out as isActive field doesn't exist in CollaborationParticipant model
        },
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          lastActivity: true,
        },
      });

      // Get active cursors and typing indicators for this session
      const sessionDocuments = await this.getSessionDocuments(sessionId);
      const cursors: CursorPosition[] = [];
      const typingIndicators: TypingIndicator[] = [];

      for (const docId of sessionDocuments) {
        // Get cursors for this document
        for (const [key, cursor] of this.cursorPositions.entries()) {
          if (key.startsWith(`${docId}:`)) {
            cursors.push(cursor);
          }
        }

        // Get typing indicators for this document
        for (const [key, typing] of this.typingUsers.entries()) {
          if (key.startsWith(`${docId}:`) && typing.isTyping) {
            typingIndicators.push(typing);
          }
        }
      }

      // Send session state to the specific user
      this.io.to(`user:${userId}`).emit("session_state", {
        sessionId,
        participants,
        cursors,
        typingIndicators,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error sending session state:", error);
    }
  }

  /**
   * Get active sessions for a user
   */
  private async getUserActiveSessions(userId: string): Promise<string[]> {
    try {
      const participants = await prisma.collaborationParticipant.findMany({
        where: {
          userId,
          // isActive: true, // Commented out as isActive field doesn't exist in CollaborationParticipant model
        },
        select: {
          sessionId: true,
        },
      });

      return participants.map((p) => p.sessionId);
    } catch (error) {
      console.error("Error getting user active sessions:", error);
      return [];
    }
  }

  /**
   * Get documents associated with a session
   */
  private async getSessionDocuments(sessionId: string): Promise<string[]> {
    try {
      const session = await prisma.collaborationSession.findUnique({
        where: { sessionId },
        select: { metadata: true },
      });

      if (!session?.metadata) return [];

      const metadata = JSON.parse(session.metadata);
      return metadata.documentIds || [];
    } catch (error) {
      console.error("Error getting session documents:", error);
      return [];
    }
  }

  /**
   * Clean up user data when they disconnect
   */
  private cleanupUserData(userId: string) {
    // Remove from active users
    this.activeUsers.delete(userId);

    // Remove cursor positions
    for (const [key] of this.cursorPositions.entries()) {
      if (key.endsWith(`:${userId}`)) {
        this.cursorPositions.delete(key);
      }
    }

    // Remove typing indicators
    for (const [key] of this.typingUsers.entries()) {
      if (key.endsWith(`:${userId}`)) {
        this.typingUsers.delete(key);
      }
    }
  }

  /**
   * Get collaboration events for a session
   */
  async getSessionEvents(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
    eventTypes?: CollaborationEventType[],
  ) {
    try {
      const where: any = { sessionId };
      if (eventTypes && eventTypes.length > 0) {
        where.type = { in: eventTypes };
      }

      const events = await prisma.collaborationEvent.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          data: true,
          userId: true,
          timestamp: true,
          metadata: true,
        },
      });

      const totalEvents = await prisma.collaborationEvent.count({ where });

      return {
        events: events.map((event) => ({
          ...event,
          data: JSON.parse(event.data),
          metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
        })),
        totalEvents,
        hasMore: offset + limit < totalEvents,
      };
    } catch (error) {
      console.error("Error getting session events:", error);
      throw error;
    }
  }

  /**
   * Get active users in a session
   */
  getActiveUsers(): UserPresence[] {
    return Array.from(this.activeUsers.values());
  }

  /**
   * Get typing indicators for a document
   */
  getTypingIndicators(documentId: string): TypingIndicator[] {
    const indicators: TypingIndicator[] = [];
    for (const [key, indicator] of this.typingUsers.entries()) {
      if (key.startsWith(`${documentId}:`) && indicator.isTyping) {
        indicators.push(indicator);
      }
    }
    return indicators;
  }

  /**
   * Get cursor positions for a document
   */
  getCursorPositions(documentId: string): CursorPosition[] {
    const cursors: CursorPosition[] = [];
    for (const [key, cursor] of this.cursorPositions.entries()) {
      if (key.startsWith(`${documentId}:`)) {
        cursors.push(cursor);
      }
    }
    return cursors;
  }
}

export const collaborationEventService = new CollaborationEventService();
