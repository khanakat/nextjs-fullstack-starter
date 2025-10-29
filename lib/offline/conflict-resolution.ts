import { OfflineAction } from "./indexeddb";

export interface ConflictResolutionStrategy {
  name: string;
  description: string;
  resolve: (localData: any, serverData: any, metadata?: any) => Promise<any>;
}

export interface ConflictData {
  localData: any;
  serverData: any;
  lastModified: {
    local: Date;
    server: Date;
  };
  conflictType: "update" | "delete" | "create";
  entityType: string;
  entityId: string;
}

export interface ConflictResolution {
  strategy: string;
  resolvedData: any;
  timestamp: Date;
  metadata?: any;
}

// Built-in conflict resolution strategies
export const conflictStrategies: Record<string, ConflictResolutionStrategy> = {
  // Server wins - always use server data
  serverWins: {
    name: "Server Wins",
    description: "Always use the server version of the data",
    resolve: async (_localData: any, serverData: any) => {
      return serverData;
    },
  },

  // Client wins - always use local data
  clientWins: {
    name: "Client Wins",
    description: "Always use the local version of the data",
    resolve: async (localData: any, _serverData: any) => {
      return localData;
    },
  },

  // Last modified wins - use the most recently modified version
  lastModifiedWins: {
    name: "Last Modified Wins",
    description: "Use the version that was modified most recently",
    resolve: async (localData: any, serverData: any, _metadata?: any) => {
      const localTime = new Date(
        localData.updatedAt || localData.modifiedAt || 0,
      );
      const serverTime = new Date(
        serverData.updatedAt || serverData.modifiedAt || 0,
      );

      return localTime > serverTime ? localData : serverData;
    },
  },

  // Merge fields - combine non-conflicting fields
  mergeFields: {
    name: "Merge Fields",
    description: "Merge non-conflicting fields from both versions",
    resolve: async (localData: any, serverData: any) => {
      // Simple field-level merge
      const merged = { ...serverData };

      // Merge arrays by combining unique items
      Object.keys(localData).forEach((key) => {
        if (Array.isArray(localData[key]) && Array.isArray(serverData[key])) {
          const combined = [...serverData[key], ...localData[key]];
          merged[key] = Array.from(
            new Set(
              combined.map((item) =>
                typeof item === "object" ? JSON.stringify(item) : item,
              ),
            ),
          ).map((item) =>
            typeof item === "string" && item.startsWith("{")
              ? JSON.parse(item)
              : item,
          );
        } else if (
          localData[key] !== undefined &&
          localData[key] !== serverData[key]
        ) {
          // For conflicting scalar values, prefer local changes
          merged[key] = localData[key];
        }
      });

      return merged;
    },
  },

  // User choice - require manual resolution
  userChoice: {
    name: "User Choice",
    description: "Let the user manually choose which version to keep",
    resolve: async (_localData: any, _serverData: any, _metadata?: any) => {
      // This would typically show a UI for user selection
      // For now, we'll return both options for the UI to handle
      throw new Error("USER_CHOICE_REQUIRED");
    },
  },

  // Custom merge for specific entity types
  customMerge: {
    name: "Custom Merge",
    description: "Use entity-specific merge logic",
    resolve: async (localData: any, serverData: any, metadata?: any) => {
      const entityType = metadata?.entityType;

      switch (entityType) {
        case "workflow":
          return mergeWorkflow(localData, serverData);
        case "task":
          return mergeTask(localData, serverData);
        case "user_profile":
          return mergeUserProfile(localData, serverData);
        default:
          // Fall back to field merge
          return conflictStrategies.mergeFields.resolve(
            localData,
            serverData,
            metadata,
          );
      }
    },
  },
};

// Entity-specific merge functions
async function mergeWorkflow(local: any, server: any): Promise<any> {
  return {
    ...server,
    // Preserve local changes to workflow steps if they're newer
    steps:
      local.stepsModifiedAt > server.stepsModifiedAt
        ? local.steps
        : server.steps,
    // Merge tags
    tags: Array.from(new Set([...(server.tags || []), ...(local.tags || [])])),
    // Preserve local draft status
    isDraft: local.isDraft !== undefined ? local.isDraft : server.isDraft,
    // Use latest modification time
    updatedAt: new Date(
      Math.max(
        new Date(local.updatedAt || 0).getTime(),
        new Date(server.updatedAt || 0).getTime(),
      ),
    ).toISOString(),
  };
}

async function mergeTask(local: any, server: any): Promise<any> {
  return {
    ...server,
    // Preserve local status changes if they're newer
    status:
      local.statusModifiedAt > server.statusModifiedAt
        ? local.status
        : server.status,
    // Merge comments
    comments: [...(server.comments || []), ...(local.comments || [])],
    // Preserve local priority changes
    priority: local.priority !== undefined ? local.priority : server.priority,
    // Use latest modification time
    updatedAt: new Date(
      Math.max(
        new Date(local.updatedAt || 0).getTime(),
        new Date(server.updatedAt || 0).getTime(),
      ),
    ).toISOString(),
  };
}

async function mergeUserProfile(local: any, server: any): Promise<any> {
  return {
    ...server,
    // Preserve local preference changes
    preferences: { ...server.preferences, ...local.preferences },
    // Preserve local settings
    settings: { ...server.settings, ...local.settings },
    // Use server data for critical fields
    email: server.email,
    role: server.role,
    organizationId: server.organizationId,
    // Use latest modification time
    updatedAt: new Date(
      Math.max(
        new Date(local.updatedAt || 0).getTime(),
        new Date(server.updatedAt || 0).getTime(),
      ),
    ).toISOString(),
  };
}

export class ConflictResolver {
  private defaultStrategy: string = "lastModifiedWins";
  private entityStrategies: Record<string, string> = {};

  constructor(
    defaultStrategy?: string,
    entityStrategies?: Record<string, string>,
  ) {
    if (defaultStrategy) {
      this.defaultStrategy = defaultStrategy;
    }
    if (entityStrategies) {
      this.entityStrategies = entityStrategies;
    }
  }

  // Set default strategy for all conflicts
  setDefaultStrategy(strategy: string): void {
    if (!conflictStrategies[strategy]) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
    this.defaultStrategy = strategy;
  }

  // Set strategy for specific entity types
  setEntityStrategy(entityType: string, strategy: string): void {
    if (!conflictStrategies[strategy]) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
    this.entityStrategies[entityType] = strategy;
  }

  // Detect conflicts between local and server data
  detectConflict(localData: any, serverData: any): ConflictData | null {
    if (!localData || !serverData) {
      return null;
    }

    // Check if data has been modified on both sides
    const localModified = new Date(
      localData.updatedAt || localData.modifiedAt || 0,
    );
    const serverModified = new Date(
      serverData.updatedAt || serverData.modifiedAt || 0,
    );
    const lastSync = new Date(localData.lastSyncAt || 0);

    // No conflict if one side hasn't been modified since last sync
    if (localModified <= lastSync || serverModified <= lastSync) {
      return null;
    }

    // Check for actual data differences
    const hasDataConflict = this.hasDataConflict(localData, serverData);
    if (!hasDataConflict) {
      return null;
    }

    return {
      localData,
      serverData,
      lastModified: {
        local: localModified,
        server: serverModified,
      },
      conflictType: this.getConflictType(localData, serverData),
      entityType: localData.entityType || "unknown",
      entityId: localData.id || localData._id || "unknown",
    };
  }

  // Check if there are actual data differences
  private hasDataConflict(localData: any, serverData: any): boolean {
    // Exclude metadata fields from comparison
    const excludeFields = [
      "updatedAt",
      "modifiedAt",
      "lastSyncAt",
      "version",
      "_rev",
    ];

    const localFiltered = this.filterObject(localData, excludeFields);
    const serverFiltered = this.filterObject(serverData, excludeFields);

    return JSON.stringify(localFiltered) !== JSON.stringify(serverFiltered);
  }

  // Filter out specified fields from object
  private filterObject(obj: any, excludeFields: string[]): any {
    const filtered: any = {};
    Object.keys(obj).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  }

  // Determine the type of conflict
  private getConflictType(
    localData: any,
    serverData: any,
  ): "update" | "delete" | "create" {
    if (localData.deleted || serverData.deleted) {
      return "delete";
    }
    if (!localData.id && serverData.id) {
      return "create";
    }
    return "update";
  }

  // Resolve a conflict using the appropriate strategy
  async resolveConflict(conflict: ConflictData): Promise<ConflictResolution> {
    const entityType = conflict.entityType;
    const strategyName =
      this.entityStrategies[entityType] || this.defaultStrategy;
    const strategy = conflictStrategies[strategyName];

    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${strategyName}`);
    }

    try {
      const resolvedData = await strategy.resolve(
        conflict.localData,
        conflict.serverData,
        {
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          conflictType: conflict.conflictType,
        },
      );

      return {
        strategy: strategyName,
        resolvedData,
        timestamp: new Date(),
        metadata: {
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          conflictType: conflict.conflictType,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === "USER_CHOICE_REQUIRED") {
        throw error;
      }

      // Fall back to server wins if resolution fails
      console.warn(
        `Conflict resolution failed for ${strategyName}, falling back to server wins:`,
        error,
      );

      return {
        strategy: "serverWins",
        resolvedData: conflict.serverData,
        timestamp: new Date(),
        metadata: {
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          conflictType: conflict.conflictType,
          fallback: true,
          originalStrategy: strategyName,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // Batch resolve multiple conflicts
  async resolveConflicts(
    conflicts: ConflictData[],
  ): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveConflict(conflict);
        resolutions.push(resolution);
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
        // Continue with other conflicts
      }
    }

    return resolutions;
  }

  // Get available strategies
  getAvailableStrategies(): ConflictResolutionStrategy[] {
    return Object.values(conflictStrategies);
  }

  // Register a custom strategy
  registerStrategy(name: string, strategy: ConflictResolutionStrategy): void {
    conflictStrategies[name] = strategy;
  }
}

// Default conflict resolver instance
export const defaultConflictResolver = new ConflictResolver(
  "lastModifiedWins",
  {
    workflow: "customMerge",
    task: "customMerge",
    user_profile: "customMerge",
    organization: "serverWins", // Organization changes should come from server
    integration: "serverWins", // Integration configs should come from server
  },
);

// Utility function to resolve conflicts for offline actions
export async function resolveOfflineConflicts(
  actions: OfflineAction[],
  serverData: Record<string, any>,
  resolver: ConflictResolver = defaultConflictResolver,
): Promise<{ resolved: OfflineAction[]; conflicts: ConflictData[] }> {
  const resolved: OfflineAction[] = [];
  const conflicts: ConflictData[] = [];

  for (const action of actions) {
    const entityId = action.data?.id || action.data?._id;
    const serverEntity = entityId ? serverData[entityId] : null;

    if (serverEntity) {
      const conflict = resolver.detectConflict(action.data, serverEntity);

      if (conflict) {
        conflicts.push(conflict);

        try {
          const resolution = await resolver.resolveConflict(conflict);

          // Update the action with resolved data
          resolved.push({
            ...action,
            data: resolution.resolvedData,
          } as OfflineAction);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "USER_CHOICE_REQUIRED"
          ) {
            // Keep the original action for manual resolution
            conflicts.push(conflict);
          } else {
            console.error(
              "Failed to resolve conflict for action:",
              action.id,
              error,
            );
            resolved.push(action); // Keep original action
          }
        }
      } else {
        resolved.push(action);
      }
    } else {
      resolved.push(action);
    }
  }

  return { resolved, conflicts };
}
