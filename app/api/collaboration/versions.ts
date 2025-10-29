import { NextApiRequest, NextApiResponse } from "next";
import { db as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get organization ID from headers or query params
    const organizationId =
      (req.headers["x-organization-id"] as string) ||
      (req.query.organizationId as string);

    switch (req.method) {
      case "GET":
        return handleGetVersions(req, res, userId, organizationId);
      case "POST":
        return handleCreateVersion(req, res, userId, organizationId);
      case "PUT":
        return handleRestoreVersion(req, res, userId, organizationId);
      case "DELETE":
        return handleDeleteVersion(req, res, userId, organizationId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Versions API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetVersions(
  req: NextApiRequest,
  res: NextApiResponse,
  _userId: string,
  organizationId: string,
) {
  const {
    documentId,
    limit = "20",
    offset = "0",
    includeContent = "false",
    authorId,
    since,
    until,
  } = req.query;

  if (!documentId) {
    return res.status(400).json({ error: "documentId is required" });
  }

  // Verify user has access to the document
  const document = await prisma.collaborativeDocument.findFirst({
    where: {
      id: documentId as string,
      organizationId,
    },
  });

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  let where: any = {
    documentId: documentId as string,
  };

  if (authorId) {
    where.authorId = authorId;
  }

  if (since) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(since as string),
    };
  }

  if (until) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(until as string),
    };
  }

  const versions = await prisma.documentVersion.findMany({
    where,
    select: {
      id: true,
      version: true,
      title: true,
      changesSummary: true,
      content: includeContent === "true",
      changeType: true,
      linesAdded: true,
      linesRemoved: true,
      authorId: true,
      authorName: true,
      sessionId: true,
      mergeConflicts: true,
      createdAt: true,
      documentId: true,
    },
    orderBy: {
      version: "desc",
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.documentVersion.count({ where });

  // Calculate diff information between consecutive versions
  const versionsWithDiff = await Promise.all(
    versions.map(async (version, index) => {
      let diffStats = null;

      if (index < versions.length - 1) {
        // Use linesAdded and linesRemoved from the model instead of calculating from changes
        diffStats = {
          additions: version.linesAdded,
          deletions: version.linesRemoved,
          modifications: 0, // Not tracked in current model
          totalChanges: version.linesAdded + version.linesRemoved,
        };
      }

      return {
        ...version,
        diffStats,
        isLatest: index === 0,
        isPrevious: index === 1,
      };
    }),
  );

  return res.status(200).json({
    versions: versionsWithDiff,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: total > parseInt(offset as string) + parseInt(limit as string),
    },
    document: {
      id: document.id,
      title: document.title,
      currentVersion: document.version,
      lastModified: document.updatedAt,
    },
  });
}

async function handleCreateVersion(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const {
    documentId,
    title,
    description,
    changes = [],
    content,
    metadata: _metadata = {},
    isAutoSave = false,
  } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "documentId is required" });
  }

  // Verify user has access to the document
  const document = await prisma.collaborativeDocument.findFirst({
    where: {
      id: documentId,
      organizationId,
    },
  });

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  // Get the next version number
  const latestVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version || 0) + 1;

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      title: title || `Version ${nextVersion}`,
      changesSummary: description,
      content,
      changeType: "edit",
      linesAdded: changes.filter((c: any) => c.type === "insert").length,
      linesRemoved: changes.filter((c: any) => c.type === "delete").length,
      authorId: userId,
      authorName: null, // Will be populated from user data if needed
      sessionId: null,
      mergeConflicts: null,
    },
  });

  // Update document's current version
  await prisma.collaborativeDocument.update({
    where: { id: documentId },
    data: {
      version: nextVersion,
      content,
      updatedAt: new Date(),
    },
  });

  // Log version creation event
  const activeSessions = await prisma.collaborationSession.findMany({
    where: {
      resourceId: documentId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ id: sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: "version_create",
          data: JSON.stringify({
            documentId,
            version: nextVersion,
            title: version.title,
            changeCount: changes.length,
            isAutoSave,
          }),
          userId,
        },
      }),
    ),
  );

  // Clean up old auto-save versions if this is a manual save
  if (!isAutoSave) {
    await cleanupAutoSaveVersions(documentId);
  }

  return res.status(201).json({ version });
}

async function handleRestoreVersion(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { versionId } = req.query;
  const { createBackup = true } = req.body;

  if (!versionId) {
    return res.status(400).json({ error: "versionId is required" });
  }

  // Get the version to restore
  const version = await prisma.documentVersion.findFirst({
    where: {
      id: versionId as string,
      document: {
        organizationId,
      },
    },
    include: {
      document: true,
    },
  });

  if (!version) {
    return res.status(404).json({ error: "Version not found" });
  }

  // Create backup of current version if requested
  if (createBackup) {
    const currentDocument = version.document;
    await prisma.documentVersion.create({
      data: {
        documentId: currentDocument.id,
        version: currentDocument.version + 1,
        title: `Backup before restore to v${version.version}`,
        changesSummary: `Automatic backup created before restoring to version ${version.version}`,
        content: currentDocument.content,
        changeType: "backup",
        linesAdded: 0,
        linesRemoved: 0,
        authorId: userId,
        authorName: null,
        sessionId: null,
        mergeConflicts: null,
      },
    });
  }

  // Restore the document to the selected version
  const restoredDocument = await prisma.collaborativeDocument.update({
    where: { id: version.documentId },
    data: {
      content: version.content,
      version: version.document.version + (createBackup ? 2 : 1),
      updatedAt: new Date(),
    },
  });

  // Create a new version entry for the restore
  const restoreVersion = await prisma.documentVersion.create({
    data: {
      documentId: version.documentId,
      version: restoredDocument.version,
      title: `Restored to v${version.version}`,
      changesSummary: `Document restored to version ${version.version}`,
      content: version.content,
      changeType: "restore",
      linesAdded: 0,
      linesRemoved: 0,
      authorId: userId,
      authorName: null,
      sessionId: null,
      mergeConflicts: null,
    },
  });

  // Log restore event
  const activeSessions = await prisma.collaborationSession.findMany({
    where: {
      resourceId: version.documentId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ id: sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: "version_restore",
          data: JSON.stringify({
            documentId: version.documentId,
            restoredToVersion: version.version,
            newVersion: restoreVersion.version,
            createBackup,
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(200).json({
    version: restoreVersion,
    document: restoredDocument,
    message: `Document restored to version ${version.version}`,
  });
}

async function handleDeleteVersion(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { versionId } = req.query;

  if (!versionId) {
    return res.status(400).json({ error: "versionId is required" });
  }

  // Get the version to delete
  const version = await prisma.documentVersion.findFirst({
    where: {
      id: versionId as string,
      document: {
        organizationId,
      },
    },
    include: {
      document: true,
    },
  });

  if (!version) {
    return res.status(404).json({ error: "Version not found" });
  }

  // Prevent deletion of the current version
  if (version.version === version.document.version) {
    return res.status(400).json({
      error: "Cannot delete the current version",
    });
  }

  // Check if user has permission (document owner or admin)
  const hasPermission = await prisma.collaborationSession.findFirst({
    where: {
      resourceId: version.documentId,
      participants: {
        some: {
          userId,
          role: {
            in: ["owner", "admin"],
          },
        },
      },
    },
  });

  if (!hasPermission) {
    return res.status(403).json({
      error: "Insufficient permissions to delete version",
    });
  }

  await prisma.documentVersion.delete({
    where: { id: versionId as string },
  });

  return res.status(200).json({
    message: `Version ${version.version} deleted successfully`,
  });
}

// Utility functions

async function cleanupAutoSaveVersions(
  documentId: string,
  keepCount: number = 5,
) {
  // Keep only the most recent auto-save versions
  // Since we don't have metadata field anymore, we'll skip this cleanup for now
  // In a real implementation, you might add an isAutoSave boolean field to the model
  const autoSaveVersions = await prisma.documentVersion.findMany({
    where: {
      documentId,
      changeType: "edit", // Assuming auto-saves are marked as 'edit'
    },
    orderBy: {
      version: "desc",
    },
    skip: keepCount,
    select: {
      id: true,
    },
  });

  if (autoSaveVersions.length > 0) {
    await prisma.documentVersion.deleteMany({
      where: {
        id: {
          in: autoSaveVersions.map((v) => v.id),
        },
      },
    });
  }
}

export async function getVersionDiff(versionId1: string, versionId2: string) {
  const [version1, version2] = await Promise.all([
    prisma.documentVersion.findUnique({
      where: { id: versionId1 },
      select: { content: true, version: true },
    }),
    prisma.documentVersion.findUnique({
      where: { id: versionId2 },
      select: { content: true, version: true },
    }),
  ]);

  if (!version1 || !version2) {
    throw new Error("One or both versions not found");
  }

  // In a real implementation, you'd use a proper diff library like 'diff' or 'fast-diff'
  return {
    version1: version1.version,
    version2: version2.version,
    content1: version1.content,
    content2: version2.content,
    // diff: calculateDetailedDiff(version1.content, version2.content),
  };
}

export async function getDocumentHistory(
  documentId: string,
  options: {
    limit?: number;
    includeContent?: boolean;
    authorId?: string;
  } = {},
) {
  const { limit = 50, includeContent = false, authorId } = options;

  const where: any = { documentId };
  if (authorId) {
    where.authorId = authorId;
  }

  return await prisma.documentVersion.findMany({
    where,
    select: {
      id: true,
      version: true,
      title: true,
      changesSummary: true,
      content: includeContent,
      changeType: true,
      linesAdded: true,
      linesRemoved: true,
      authorId: true,
      authorName: true,
      sessionId: true,
      mergeConflicts: true,
      createdAt: true,
      documentId: true,
    },
    orderBy: {
      version: "desc",
    },
    take: limit,
  });
}
