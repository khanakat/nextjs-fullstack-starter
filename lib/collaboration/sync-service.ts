import { db as prisma } from "@/lib/db";

export interface Operation {
  type: "insert" | "delete" | "retain" | "format";
  position?: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
}

export interface DocumentState {
  content: string;
  version: number;
  checksum: string;
}

export interface SyncResult {
  success: boolean;
  newVersion: number;
  transformedOperations?: Operation[];
  conflicts?: ConflictResolution[];
  error?: string;
}

export interface ConflictResolution {
  type: "auto_resolved" | "manual_required";
  description: string;
  originalOperation: Operation;
  resolvedOperation?: Operation;
}

class CollaborationSyncService {
  /**
   * Apply operational transformation to resolve conflicts between concurrent operations
   */
  private transformOperations(
    clientOp: Operation,
    serverOp: Operation,
    _clientVersion: number,
    _serverVersion: number,
  ): { clientOp: Operation; serverOp: Operation } {
    // Simple operational transformation for text operations
    if (clientOp.type === "insert" && serverOp.type === "insert") {
      if (clientOp.position! <= serverOp.position!) {
        // Client operation comes before server operation
        return {
          clientOp,
          serverOp: {
            ...serverOp,
            position: serverOp.position! + (clientOp.content?.length || 0),
          },
        };
      } else {
        // Server operation comes before client operation
        return {
          clientOp: {
            ...clientOp,
            position: clientOp.position! + (serverOp.content?.length || 0),
          },
          serverOp,
        };
      }
    }

    if (clientOp.type === "delete" && serverOp.type === "delete") {
      const clientEnd = clientOp.position! + clientOp.length!;
      const serverEnd = serverOp.position! + serverOp.length!;

      // Handle overlapping deletions
      if (clientOp.position! < serverEnd && clientEnd > serverOp.position!) {
        // Operations overlap - merge them
        const startPos = Math.min(clientOp.position!, serverOp.position!);
        const endPos = Math.max(clientEnd, serverEnd);

        return {
          clientOp: {
            type: "delete",
            position: startPos,
            length: endPos - startPos,
          },
          serverOp: {
            type: "retain",
            length: 0,
          },
        };
      }
    }

    if (clientOp.type === "insert" && serverOp.type === "delete") {
      if (clientOp.position! <= serverOp.position!) {
        // Insert before delete
        return {
          clientOp,
          serverOp: {
            ...serverOp,
            position: serverOp.position! + (clientOp.content?.length || 0),
          },
        };
      } else if (clientOp.position! >= serverOp.position! + serverOp.length!) {
        // Insert after delete
        return {
          clientOp: {
            ...clientOp,
            position: clientOp.position! - serverOp.length!,
          },
          serverOp,
        };
      } else {
        // Insert within delete range - keep insert at delete position
        return {
          clientOp: {
            ...clientOp,
            position: serverOp.position!,
          },
          serverOp,
        };
      }
    }

    if (clientOp.type === "delete" && serverOp.type === "insert") {
      if (serverOp.position! <= clientOp.position!) {
        // Server insert before client delete
        return {
          clientOp: {
            ...clientOp,
            position: clientOp.position! + (serverOp.content?.length || 0),
          },
          serverOp,
        };
      } else if (serverOp.position! >= clientOp.position! + clientOp.length!) {
        // Server insert after client delete
        return {
          clientOp,
          serverOp: {
            ...serverOp,
            position: serverOp.position! - clientOp.length!,
          },
        };
      } else {
        // Server insert within client delete range
        return {
          clientOp: {
            ...clientOp,
            length: clientOp.length! + (serverOp.content?.length || 0),
          },
          serverOp: {
            ...serverOp,
            position: clientOp.position!,
          },
        };
      }
    }

    // Default: no transformation needed
    return { clientOp, serverOp };
  }

  /**
   * Apply a single operation to document content
   */
  applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case "insert":
        const insertPos = operation.position || 0;
        return (
          content.slice(0, insertPos) +
          (operation.content || "") +
          content.slice(insertPos)
        );

      case "delete":
        const deletePos = operation.position || 0;
        const deleteLength = operation.length || 0;
        return (
          content.slice(0, deletePos) + content.slice(deletePos + deleteLength)
        );

      case "retain":
        // No change to content
        return content;

      case "format":
        // For now, formatting doesn't change text content
        return content;

      default:
        return content;
    }
  }

  /**
   * Apply multiple operations to document content
   */
  applyOperations(content: string, operations: Operation[]): string {
    let result = content;
    for (const operation of operations) {
      result = this.applyOperation(result, operation);
    }
    return result;
  }

  /**
   * Generate checksum for content integrity verification
   */
  generateChecksum(content: string): string {
    // Simple hash function - in production, use a proper hash like SHA-256
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Synchronize document changes with operational transformation
   */
  async syncDocument(
    documentId: string,
    operations: Operation[],
    clientVersion: number,
    userId: string,
    _organizationId: string,
  ): Promise<SyncResult> {
    try {
      // Get current document state
      const document = await prisma.collaborativeDocument.findUnique({
        where: { documentId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!document) {
        return {
          success: false,
          newVersion: 0,
          error: "Document not found",
        };
      }

      const currentVersion = document.version;
      const currentContent = JSON.parse(document.content);

      // If client is up to date, apply operations directly
      if (clientVersion === currentVersion) {
        const newContent = this.applyOperations(
          typeof currentContent === "string"
            ? currentContent
            : JSON.stringify(currentContent),
          operations,
        );

        const newVersion = currentVersion + 1;
        const checksum = this.generateChecksum(newContent);

        // Update document
        await prisma.collaborativeDocument.update({
          where: { documentId },
          data: {
            content: JSON.stringify(newContent),
            version: newVersion,
            checksum,
            lastEditedAt: new Date(),
            lastEditedBy: userId,
          },
        });

        // Create version history
        await prisma.documentVersion.create({
          data: {
            documentId,
            version: newVersion,
            content: JSON.stringify(newContent),
            changes: JSON.stringify({
              operations,
              previousVersion: currentVersion,
            }),
            changesSummary: `Applied ${operations.length} operation(s)`,
            changeType: "edit",
            authorId: userId,
          },
        });

        return {
          success: true,
          newVersion,
          transformedOperations: operations,
        };
      }

      // Client is behind - need to transform operations
      const conflicts: ConflictResolution[] = [];

      // Get all operations since client version
      const serverVersions = await prisma.documentVersion.findMany({
        where: {
          documentId,
          version: {
            gt: clientVersion,
            lte: currentVersion,
          },
        },
        orderBy: { version: "asc" },
      });

      // Transform client operations against server operations
      let clientOps = [...operations];

      for (const serverVersion of serverVersions) {
        const serverChanges = JSON.parse(serverVersion.changes);
        const serverOps = serverChanges.operations || [];

        // Transform each client operation against each server operation
        for (let i = 0; i < clientOps.length; i++) {
          for (const serverOp of serverOps) {
            const transformed = this.transformOperations(
              clientOps[i],
              serverOp,
              clientVersion,
              serverVersion.version,
            );

            clientOps[i] = transformed.clientOp;

            // Check for conflicts
            if (this.hasConflict(operations[i], clientOps[i])) {
              conflicts.push({
                type: "auto_resolved",
                description: `Operation transformed due to concurrent ${serverOp.type}`,
                originalOperation: operations[i],
                resolvedOperation: clientOps[i],
              });
            }
          }
        }
      }

      // Apply transformed operations
      const newContent = this.applyOperations(
        typeof currentContent === "string"
          ? currentContent
          : JSON.stringify(currentContent),
        clientOps,
      );

      const newVersion = currentVersion + 1;
      const checksum = this.generateChecksum(newContent);

      // Update document
      await prisma.collaborativeDocument.update({
        where: { documentId },
        data: {
          content: JSON.stringify(newContent),
          version: newVersion,
          checksum,
          lastEditedAt: new Date(),
          lastEditedBy: userId,
        },
      });

      // Create version history
      await prisma.documentVersion.create({
        data: {
          documentId,
          version: newVersion,
          content: JSON.stringify(newContent),
          changes: JSON.stringify({
            operations: clientOps,
            originalOperations: operations,
            previousVersion: currentVersion,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
          }),
          changesSummary: `Applied ${clientOps.length} transformed operation(s)${
            conflicts.length > 0
              ? ` with ${conflicts.length} conflict(s) resolved`
              : ""
          }`,
          changeType: conflicts.length > 0 ? "merge" : "edit",
          authorId: userId,
          mergeConflicts:
            conflicts.length > 0 ? JSON.stringify(conflicts) : undefined,
        },
      });

      return {
        success: true,
        newVersion,
        transformedOperations: clientOps,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      console.error("Error syncing document:", error);
      return {
        success: false,
        newVersion: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if an operation was significantly transformed (indicating a conflict)
   */
  private hasConflict(original: Operation, transformed: Operation): boolean {
    if (original.type !== transformed.type) return true;
    if (original.position !== transformed.position) return true;
    if (original.length !== transformed.length) return true;
    if (original.content !== transformed.content) return true;
    return false;
  }

  /**
   * Get document history with diff information
   */
  async getDocumentHistory(
    documentId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const versions = await prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { version: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          version: true,
          title: true,
          changesSummary: true,
          changeType: true,
          authorId: true,
          authorName: true,
          createdAt: true,
          linesAdded: true,
          linesRemoved: true,
          mergeConflicts: true,
        },
      });

      const totalVersions = await prisma.documentVersion.count({
        where: { documentId },
      });

      return {
        versions,
        totalVersions,
        hasMore: offset + limit < totalVersions,
      };
    } catch (error) {
      console.error("Error getting document history:", error);
      throw error;
    }
  }

  /**
   * Create a new collaborative document
   */
  async createDocument(
    documentId: string,
    type: string,
    initialContent: any,
    organizationId: string,
    createdBy: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const contentString =
        typeof initialContent === "string"
          ? initialContent
          : JSON.stringify(initialContent);

      const checksum = this.generateChecksum(contentString);

      const document = await prisma.collaborativeDocument.create({
        data: {
          documentId,
          type,
          content: JSON.stringify(initialContent),
          checksum,
          organizationId,
          createdBy,
          lastEditedBy: createdBy,
          metadata: metadata ? JSON.stringify(metadata) : "{}",
        },
      });

      // Create initial version
      await prisma.documentVersion.create({
        data: {
          documentId,
          version: 1,
          content: JSON.stringify(initialContent),
          changes: JSON.stringify({
            operations: [],
            previousVersion: 0,
          }),
          changesSummary: "Document created",
          changeType: "create",
          authorId: createdBy,
        },
      });

      return document;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  /**
   * Lock document for exclusive editing
   */
  async lockDocument(
    documentId: string,
    userId: string,
    duration: number = 300000,
  ) {
    try {
      const document = await prisma.collaborativeDocument.findUnique({
        where: { documentId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.isLocked && document.lockedBy !== userId) {
        const lockExpiry = document.lockedAt
          ? new Date(document.lockedAt.getTime() + duration)
          : new Date();

        if (new Date() < lockExpiry) {
          throw new Error("Document is locked by another user");
        }
      }

      await prisma.collaborativeDocument.update({
        where: { documentId },
        data: {
          isLocked: true,
          lockedBy: userId,
          lockedAt: new Date(),
        },
      });

      // Auto-unlock after duration
      setTimeout(async () => {
        try {
          await this.unlockDocument(documentId, userId);
        } catch (error) {
          console.error("Error auto-unlocking document:", error);
        }
      }, duration);

      return true;
    } catch (error) {
      console.error("Error locking document:", error);
      throw error;
    }
  }

  /**
   * Unlock document
   */
  async unlockDocument(documentId: string, userId: string) {
    try {
      const document = await prisma.collaborativeDocument.findUnique({
        where: { documentId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.isLocked && document.lockedBy !== userId) {
        throw new Error("Document is locked by another user");
      }

      await prisma.collaborativeDocument.update({
        where: { documentId },
        data: {
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
        },
      });

      return true;
    } catch (error) {
      console.error("Error unlocking document:", error);
      throw error;
    }
  }
}

export const collaborationSyncService = new CollaborationSyncService();
