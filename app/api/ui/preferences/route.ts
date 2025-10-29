import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { z } from "zod";

// User UI preferences validation schemas
const UIPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  theme: z.object({
    mode: z.enum(["light", "dark", "system"]).default("system"),
    primaryColor: z.string().default("#3b82f6"),
    accentColor: z.string().default("#10b981"),
    customTheme: z.string().optional(), // Custom theme ID
  }),
  layout: z.object({
    sidebarCollapsed: z.boolean().default(false),
    sidebarWidth: z.number().min(200).max(400).default(280),
    headerHeight: z.number().min(48).max(80).default(64),
    contentPadding: z.number().min(8).max(48).default(24),
    gridGap: z.number().min(4).max(32).default(16),
    borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
  }),
  components: z.object({
    dataTable: z
      .object({
        pageSize: z.number().min(5).max(100).default(10),
        showBorders: z.boolean().default(true),
        compactMode: z.boolean().default(false),
        stickyHeader: z.boolean().default(true),
      })
      .optional(),
    forms: z
      .object({
        showValidationIcons: z.boolean().default(true),
        inlineValidation: z.boolean().default(true),
        autoSave: z.boolean().default(false),
        autoSaveInterval: z.number().min(1000).max(60000).default(5000),
      })
      .optional(),
    notifications: z
      .object({
        position: z
          .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
          .default("top-right"),
        duration: z.number().min(1000).max(10000).default(5000),
        showProgress: z.boolean().default(true),
        soundEnabled: z.boolean().default(false),
      })
      .optional(),
    dashboard: z
      .object({
        defaultView: z.enum(["grid", "list", "cards"]).default("grid"),
        showWelcomeMessage: z.boolean().default(true),
        autoRefresh: z.boolean().default(false),
        refreshInterval: z.number().min(5000).max(300000).default(30000),
      })
      .optional(),
  }),
  accessibility: z.object({
    reducedMotion: z.boolean().default(false),
    highContrast: z.boolean().default(false),
    fontSize: z.enum(["sm", "base", "lg", "xl"]).default("base"),
    focusVisible: z.boolean().default(true),
    screenReaderOptimized: z.boolean().default(false),
  }),
  shortcuts: z.object({
    enabled: z.boolean().default(true),
    customShortcuts: z.record(z.string()).optional(),
    showHints: z.boolean().default(true),
  }),
  advanced: z.object({
    animations: z.boolean().default(true),
    transitions: z.boolean().default(true),
    debugMode: z.boolean().default(false),
    performanceMode: z.boolean().default(false),
    experimentalFeatures: z.boolean().default(false),
  }),
  metadata: z.object({
    lastUpdated: z.string(),
    version: z.string().default("1.0.0"),
    syncEnabled: z.boolean().default(true),
    backupEnabled: z.boolean().default(true),
  }),
});

const CreatePreferencesSchema = UIPreferencesSchema.omit({
  id: true,
  metadata: true,
});
const UpdatePreferencesSchema = UIPreferencesSchema.partial().omit({
  id: true,
  userId: true,
});

// Mock database - In production, replace with actual database
let userPreferences = [
  {
    id: "pref-user-1",
    userId: "user-1",
    theme: {
      mode: "dark" as const,
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
    },
    layout: {
      sidebarCollapsed: false,
      sidebarWidth: 280,
      headerHeight: 64,
      contentPadding: 24,
      gridGap: 16,
      borderRadius: "md" as const,
    },
    components: {
      dataTable: {
        pageSize: 25,
        showBorders: true,
        compactMode: false,
        stickyHeader: true,
      },
      forms: {
        showValidationIcons: true,
        inlineValidation: true,
        autoSave: true,
        autoSaveInterval: 3000,
      },
      notifications: {
        position: "top-right" as const,
        duration: 4000,
        showProgress: true,
        soundEnabled: false,
      },
      dashboard: {
        defaultView: "grid" as const,
        showWelcomeMessage: false,
        autoRefresh: true,
        refreshInterval: 60000,
      },
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      fontSize: "base" as const,
      focusVisible: true,
      screenReaderOptimized: false,
    },
    shortcuts: {
      enabled: true,
      customShortcuts: {
        "cmd+k": "openCommandPalette",
        "cmd+/": "showShortcuts",
        "cmd+b": "toggleSidebar",
      },
      showHints: true,
    },
    advanced: {
      animations: true,
      transitions: true,
      debugMode: false,
      performanceMode: false,
      experimentalFeatures: true,
    },
    metadata: {
      lastUpdated: "2024-01-15T10:30:00Z",
      version: "1.0.0",
      syncEnabled: true,
      backupEnabled: true,
    },
  },
  {
    id: "pref-user-2",
    userId: "user-2",
    theme: {
      mode: "light" as const,
      primaryColor: "#6366f1",
      accentColor: "#f59e0b",
    },
    layout: {
      sidebarCollapsed: true,
      sidebarWidth: 240,
      headerHeight: 56,
      contentPadding: 20,
      gridGap: 12,
      borderRadius: "lg" as const,
    },
    components: {
      dataTable: {
        pageSize: 50,
        showBorders: false,
        compactMode: true,
        stickyHeader: false,
      },
      forms: {
        showValidationIcons: false,
        inlineValidation: false,
        autoSave: false,
        autoSaveInterval: 5000,
      },
      notifications: {
        position: "bottom-right" as const,
        duration: 3000,
        showProgress: false,
        soundEnabled: true,
      },
      dashboard: {
        defaultView: "list" as const,
        showWelcomeMessage: true,
        autoRefresh: false,
        refreshInterval: 30000,
      },
    },
    accessibility: {
      reducedMotion: true,
      highContrast: false,
      fontSize: "lg" as const,
      focusVisible: true,
      screenReaderOptimized: false,
    },
    shortcuts: {
      enabled: true,
      customShortcuts: {
        "ctrl+shift+p": "openCommandPalette",
        "ctrl+shift+k": "showShortcuts",
      },
      showHints: false,
    },
    advanced: {
      animations: false,
      transitions: false,
      debugMode: false,
      performanceMode: true,
      experimentalFeatures: false,
    },
    metadata: {
      lastUpdated: "2024-01-10T14:20:00Z",
      version: "1.0.0",
      syncEnabled: true,
      backupEnabled: false,
    },
  },
];

// GET /api/ui/preferences - Get user preferences
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI preferences retrieval request", "ui", {
      requestId,
    });

    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get("userId");
    const section = searchParams.get("section"); // theme, layout, components, accessibility, shortcuts, advanced

    if (!userId) {
      logger.warn("User ID missing in preferences request", "ui", {
        requestId,
      });
      return StandardErrorResponse.badRequest("User ID is required", requestId);
    }

    const preferences = userPreferences.find((p) => p.userId === userId);
    if (!preferences) {
      logger.info("No preferences found, returning defaults", "ui", {
        requestId,
        userId,
      });

      // Return default preferences if none exist
      const defaultPreferences = {
        id: `pref-${userId}`,
        userId,
        theme: {
          mode: "system" as const,
          primaryColor: "#3b82f6",
          accentColor: "#10b981",
        },
        layout: {
          sidebarCollapsed: false,
          sidebarWidth: 280,
          headerHeight: 64,
          contentPadding: 24,
          gridGap: 16,
          borderRadius: "md" as const,
        },
        components: {},
        accessibility: {
          reducedMotion: false,
          highContrast: false,
          fontSize: "base" as const,
          focusVisible: true,
          screenReaderOptimized: false,
        },
        shortcuts: {
          enabled: true,
          showHints: true,
        },
        advanced: {
          animations: true,
          transitions: true,
          debugMode: false,
          performanceMode: false,
          experimentalFeatures: false,
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0.0",
          syncEnabled: true,
          backupEnabled: true,
        },
      };

      return StandardSuccessResponse.ok(
        {
          preferences: section
            ? defaultPreferences[section as keyof typeof defaultPreferences]
            : defaultPreferences,
          isDefault: true,
        },
        requestId,
      );
    }

    // Filter by section if requested
    const result = section
      ? preferences[section as keyof typeof preferences]
      : preferences;

    logger.info("UI preferences retrieved successfully", "ui", {
      requestId,
      userId,
      section: section || "all",
    });

    return StandardSuccessResponse.ok(
      {
        preferences: result,
        isDefault: false,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving UI preferences", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/preferences",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve UI preferences",
      requestId,
    );
  }
}

// POST /api/ui/preferences - Create user preferences
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI preferences creation request", "ui", {
      requestId,
    });

    const body = await _request.json();
    const validatedData = CreatePreferencesSchema.parse(body);

    // Check if preferences already exist for this user
    const existingPreferences = userPreferences.find(
      (p) => p.userId === validatedData.userId,
    );
    if (existingPreferences) {
      logger.warn("Preferences already exist for user", "ui", {
        requestId,
        userId: validatedData.userId,
      });
      return StandardErrorResponse.conflict(
        "Preferences already exist for this user",
        requestId,
      );
    }

    const newPreferences = {
      id: `pref-${validatedData.userId}`,
      ...validatedData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0",
        syncEnabled: true,
        backupEnabled: true,
      },
    } as const;

    userPreferences.push(newPreferences as any);

    logger.info("UI preferences created successfully", "ui", {
      requestId,
      userId: validatedData.userId,
      preferencesId: newPreferences.id,
    });

    return StandardSuccessResponse.created(
      {
        preferences: newPreferences,
        message: "UI preferences created successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in create preferences request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error creating UI preferences", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/preferences",
    });

    return StandardErrorResponse.internal(
      "Failed to create UI preferences",
      requestId,
    );
  }
}

// PUT /api/ui/preferences - Update user preferences
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI preferences update request", "ui", {
      requestId,
    });

    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      logger.warn("User ID missing in preferences update request", "ui", {
        requestId,
      });
      return StandardErrorResponse.badRequest("User ID is required", requestId);
    }

    const body = await _request.json();
    const validatedData = UpdatePreferencesSchema.parse(body);

    const preferencesIndex = userPreferences.findIndex(
      (p) => p.userId === userId,
    );
    if (preferencesIndex === -1) {
      logger.warn("Preferences not found for update", "ui", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound(
        "Preferences not found for this user",
        requestId,
      );
    }

    userPreferences[preferencesIndex] = {
      ...userPreferences[preferencesIndex],
      ...validatedData,
      metadata: {
        ...userPreferences[preferencesIndex].metadata,
        lastUpdated: new Date().toISOString(),
      },
    } as any;

    logger.info("UI preferences updated successfully", "ui", {
      requestId,
      userId,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(
      {
        preferences: userPreferences[preferencesIndex],
        message: "UI preferences updated successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in update preferences request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error updating UI preferences", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/preferences",
    });

    return StandardErrorResponse.internal(
      "Failed to update UI preferences",
      requestId,
    );
  }
}

// DELETE /api/ui/preferences - Delete user preferences
export async function DELETE(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI preferences deletion request", "ui", {
      requestId,
    });

    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      logger.warn("User ID missing in preferences deletion request", "ui", {
        requestId,
      });
      return StandardErrorResponse.badRequest("User ID is required", requestId);
    }

    const preferencesIndex = userPreferences.findIndex(
      (p) => p.userId === userId,
    );
    if (preferencesIndex === -1) {
      logger.warn("Preferences not found for deletion", "ui", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound(
        "Preferences not found for this user",
        requestId,
      );
    }

    const deletedPreferences = userPreferences.splice(preferencesIndex, 1)[0];

    logger.info("UI preferences deleted successfully", "ui", {
      requestId,
      userId,
      preferencesId: deletedPreferences.id,
    });

    return StandardSuccessResponse.ok(
      {
        preferences: deletedPreferences,
        message: "UI preferences deleted successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error deleting UI preferences", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/preferences",
    });

    return StandardErrorResponse.internal(
      "Failed to delete UI preferences",
      requestId,
    );
  }
}

// PATCH /api/ui/preferences - Partially update user preferences
export async function PATCH(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI preferences partial update request", "ui", {
      requestId,
    });

    const { searchParams } = new URL(_request.url);
    const userId = searchParams.get("userId");
    const section = searchParams.get("section"); // theme, layout, components, accessibility, shortcuts, advanced

    if (!userId) {
      logger.warn("User ID missing in preferences patch request", "ui", {
        requestId,
      });
      return StandardErrorResponse.badRequest("User ID is required", requestId);
    }

    const body = await _request.json();

    const preferencesIndex = userPreferences.findIndex(
      (p) => p.userId === userId,
    );
    if (preferencesIndex === -1) {
      logger.warn("Preferences not found for partial update", "ui", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound(
        "Preferences not found for this user",
        requestId,
      );
    }

    if (section) {
      // Update specific section
      if (
        !userPreferences[preferencesIndex][
          section as keyof (typeof userPreferences)[0]
        ]
      ) {
        logger.warn("Invalid section specified for preferences update", "ui", {
          requestId,
          userId,
          section,
        });
        return StandardErrorResponse.badRequest(
          "Invalid section specified",
          requestId,
        );
      }

      const currentSection =
        userPreferences[preferencesIndex][
          section as keyof (typeof userPreferences)[0]
        ];
      userPreferences[preferencesIndex] = {
        ...userPreferences[preferencesIndex],
        [section]: {
          ...(typeof currentSection === "object" && currentSection !== null
            ? currentSection
            : {}),
          ...body,
        },
        metadata: {
          ...userPreferences[preferencesIndex].metadata,
          lastUpdated: new Date().toISOString(),
        },
      } as any;
    } else {
      // Update multiple fields
      userPreferences[preferencesIndex] = {
        ...userPreferences[preferencesIndex],
        ...body,
        metadata: {
          ...userPreferences[preferencesIndex].metadata,
          lastUpdated: new Date().toISOString(),
        },
      } as any;
    }

    logger.info("UI preferences partially updated successfully", "ui", {
      requestId,
      userId,
      section: section || "multiple",
      updatedFields: Object.keys(body),
    });

    return StandardSuccessResponse.ok(
      {
        preferences: userPreferences[preferencesIndex],
        message: "UI preferences updated successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error partially updating UI preferences", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/preferences",
    });

    return StandardErrorResponse.internal(
      "Failed to update UI preferences",
      requestId,
    );
  }
}
