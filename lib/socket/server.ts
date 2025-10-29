import { Server as NetServer } from "http";
import { NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";

import { db as prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export interface SocketUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  organizationId: string;
}

export interface CollaborationRoom {
  id: string;
  type: "workflow" | "analytics" | "report" | "integration" | "document";
  resourceId: string;
  participants: Map<string, SocketUser>;
  metadata: Record<string, any>;
}

class SocketManager {
  private io: ServerIO | null = null;
  private rooms: Map<string, CollaborationRoom> = new Map();

  initialize(server: NetServer) {
    if (this.io) return this.io;

    this.io = new ServerIO(server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? process.env.NEXTAUTH_URL
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    return this.io;
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      logger.info("Socket connected", "SocketManager", { socketId: socket.id });

      // Authentication middleware
      socket.use(async (packet, next) => {
        try {
          const token = packet[1]?.auth?.token;
          if (!token) {
            return next(new Error("Authentication required"));
          }

          // Verify token and get user info
          const user = await this.verifyUser(token);
          if (!user) {
            return next(new Error("Invalid authentication"));
          }

          socket.data.user = user;
          next();
        } catch (error) {
          next(new Error("Authentication failed"));
        }
      });

      // Join collaboration room
      socket.on(
        "join-room",
        async (data: { roomId: string; type: string; resourceId: string }) => {
          try {
            const user = socket.data.user as SocketUser;
            if (!user) return;

            const roomId = `${data.type}:${data.resourceId}`;
            await socket.join(roomId);

            // Update room participants
            let room = this.rooms.get(roomId);
            if (!room) {
              room = {
                id: roomId,
                type: data.type as any,
                resourceId: data.resourceId,
                participants: new Map(),
                metadata: {},
              };
              this.rooms.set(roomId, room);
            }

            room.participants.set(socket.id, user);

            // Update user presence
            await this.updateUserPresence(user.id, {
              status: "online",
              location: `${data.type}:${data.resourceId}`,
              socketId: socket.id,
            });

            // Notify room participants
            socket.to(roomId).emit("user-joined", {
              user,
              participants: Array.from(room.participants.values()),
            });

            // Send current participants to new user
            socket.emit("room-joined", {
              roomId,
              participants: Array.from(room.participants.values()),
            });

            logger.info("User joined room", "SocketManager", {
              userName: user.name,
              roomId,
              userId: user.id,
            });
          } catch (error) {
            logger.error("Error joining room", "SocketManager", error);
            socket.emit("error", { message: "Failed to join room" });
          }
        },
      );

      // Leave collaboration room
      socket.on("leave-room", async (data: { roomId: string }) => {
        try {
          const user = socket.data.user as SocketUser;
          if (!user) return;

          await socket.leave(data.roomId);

          const room = this.rooms.get(data.roomId);
          if (room) {
            room.participants.delete(socket.id);

            // Notify remaining participants
            socket.to(data.roomId).emit("user-left", {
              user,
              participants: Array.from(room.participants.values()),
            });

            // Clean up empty rooms
            if (room.participants.size === 0) {
              this.rooms.delete(data.roomId);
            }
          }

          logger.info("User left room", "SocketManager", {
            userName: user.name,
            roomId: data.roomId,
            userId: user.id,
          });
        } catch (error) {
          logger.error("Error leaving room", "SocketManager", error);
        }
      });

      // Real-time document editing
      socket.on(
        "document-change",
        async (data: {
          roomId: string;
          documentId: string;
          operation: any;
          version: number;
        }) => {
          try {
            const user = socket.data.user as SocketUser;
            if (!user) return;

            // Broadcast change to room participants (except sender)
            socket.to(data.roomId).emit("document-changed", {
              ...data,
              userId: user.id,
              timestamp: new Date().toISOString(),
            });

            // Log collaboration event
            await this.logCollaborationEvent({
              sessionId: data.roomId,
              type: "document_change",
              userId: user.id,
              data: {
                documentId: data.documentId,
                operation: data.operation,
                version: data.version,
              },
            });
          } catch (error) {
            logger.error(
              "Error handling document change",
              "SocketManager",
              error,
            );
          }
        },
      );

      // Cursor position updates
      socket.on(
        "cursor-update",
        (data: {
          roomId: string;
          position: { x: number; y: number };
          selection?: { start: number; end: number };
        }) => {
          const user = socket.data.user as SocketUser;
          if (!user) return;

          socket.to(data.roomId).emit("cursor-updated", {
            userId: user.id,
            user: {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            },
            position: data.position,
            selection: data.selection,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Typing indicators
      socket.on("typing-start", (data: { roomId: string; field?: string }) => {
        const user = socket.data.user as SocketUser;
        if (!user) return;

        socket.to(data.roomId).emit("user-typing", {
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          field: data.field,
          isTyping: true,
        });
      });

      socket.on("typing-stop", (data: { roomId: string; field?: string }) => {
        const user = socket.data.user as SocketUser;
        if (!user) return;

        socket.to(data.roomId).emit("user-typing", {
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          field: data.field,
          isTyping: false,
        });
      });

      // Comments system
      socket.on(
        "comment-added",
        async (data: {
          roomId: string;
          documentId: string;
          comment: {
            content: string;
            position?: { x: number; y: number };
            threadId?: string;
          };
        }) => {
          try {
            const user = socket.data.user as SocketUser;
            if (!user) return;

            const comment = {
              id: `comment_${Date.now()}`,
              content: data.comment.content,
              userId: user.id,
              user: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
              },
              position: data.comment.position,
              threadId: data.comment.threadId,
              timestamp: new Date().toISOString(),
            };

            // Broadcast to room participants
            this.io!.to(data.roomId).emit("comment-added", {
              documentId: data.documentId,
              comment,
            });

            // Log collaboration event
            await this.logCollaborationEvent({
              sessionId: data.roomId,
              type: "comment_added",
              userId: user.id,
              data: {
                documentId: data.documentId,
                comment,
              },
            });
          } catch (error) {
            logger.error("Error adding comment", "SocketManager", error);
          }
        },
      );

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          const user = socket.data.user as SocketUser;
          if (!user) return;

          // Update user presence to offline
          await this.updateUserPresence(user.id, {
            status: "offline",
            location: null,
            socketId: null,
          });

          // Remove from all rooms
          for (const [roomId, room] of this.rooms.entries()) {
            if (room.participants.has(socket.id)) {
              room.participants.delete(socket.id);

              // Notify remaining participants
              socket.to(roomId).emit("user-left", {
                user,
                participants: Array.from(room.participants.values()),
              });

              // Clean up empty rooms
              if (room.participants.size === 0) {
                this.rooms.delete(roomId);
              }
            }
          }

          logger.info("User disconnected", "SocketManager", {
            userName: user.name,
            userId: user.id,
          });
        } catch (error) {
          logger.error("Error handling disconnect", "SocketManager", error);
        }
      });
    });
  }

  private async verifyUser(_token: string): Promise<SocketUser | null> {
    try {
      // This would typically verify the JWT token
      // For now, we'll use a simplified approach
      // In production, you'd verify the Clerk session token

      // Mock user verification - replace with actual Clerk token verification
      return {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        organizationId: "org_123",
      };
    } catch (error) {
      logger.error("Error verifying user", "SocketManager", error);
      return null;
    }
  }

  private async updateUserPresence(
    userId: string,
    presence: {
      status: "online" | "offline" | "away";
      location: string | null;
      socketId: string | null;
    },
  ) {
    try {
      await prisma.userPresence.upsert({
        where: { userId },
        update: {
          status: presence.status,
          location: presence.location,
          lastSeen: new Date(),
        },
        create: {
          userId,
          status: presence.status,
          location: presence.location,
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      logger.error("Error updating user presence", "SocketManager", error);
    }
  }

  private async logCollaborationEvent(event: {
    sessionId: string;
    type: string;
    userId: string;
    data: any;
  }) {
    try {
      await prisma.collaborationEvent.create({
        data: {
          sessionId: event.sessionId,
          type: event.type,
          userId: event.userId,
          data: event.data,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error("Error logging collaboration event", "SocketManager", error);
    }
  }

  getIO() {
    return this.io;
  }

  getRooms() {
    return this.rooms;
  }
}

export const socketManager = new SocketManager();
