import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { z } from "zod";

// Theme validation schemas
const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    foreground: z.string(),
    muted: z.string(),
    "muted-foreground": z.string(),
    card: z.string(),
    "card-foreground": z.string(),
    border: z.string(),
    input: z.string(),
    ring: z.string(),
    destructive: z.string(),
    "destructive-foreground": z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.record(z.string()),
    fontWeight: z.record(z.number()),
    lineHeight: z.record(z.string()),
  }),
  spacing: z.record(z.string()),
  borderRadius: z.record(z.string()),
  shadows: z.record(z.string()),
});

const CreateThemeSchema = ThemeSchema.omit({ id: true });
const UpdateThemeSchema = ThemeSchema.partial().omit({ id: true });

// Mock data for themes
let themes = [
  {
    id: "light",
    name: "light",
    displayName: "Light Theme",
    colors: {
      primary: "hsl(222.2 84% 4.9%)",
      secondary: "hsl(210 40% 96%)",
      accent: "hsl(210 40% 96%)",
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      muted: "hsl(210 40% 96%)",
      "muted-foreground": "hsl(215.4 16.3% 46.9%)",
      card: "hsl(0 0% 100%)",
      "card-foreground": "hsl(222.2 84% 4.9%)",
      border: "hsl(214.3 31.8% 91.4%)",
      input: "hsl(214.3 31.8% 91.4%)",
      ring: "hsl(222.2 84% 4.9%)",
      destructive: "hsl(0 84.2% 60.2%)",
      "destructive-foreground": "hsl(210 40% 98%)",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: "1.25",
        normal: "1.5",
        relaxed: "1.75",
      },
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
    },
    borderRadius: {
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
  {
    id: "dark",
    name: "dark",
    displayName: "Dark Theme",
    colors: {
      primary: "hsl(210 40% 98%)",
      secondary: "hsl(217.2 32.6% 17.5%)",
      accent: "hsl(217.2 32.6% 17.5%)",
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      muted: "hsl(217.2 32.6% 17.5%)",
      "muted-foreground": "hsl(215 20.2% 65.1%)",
      card: "hsl(222.2 84% 4.9%)",
      "card-foreground": "hsl(210 40% 98%)",
      border: "hsl(217.2 32.6% 17.5%)",
      input: "hsl(217.2 32.6% 17.5%)",
      ring: "hsl(212.7 26.8% 83.9%)",
      destructive: "hsl(0 62.8% 30.6%)",
      "destructive-foreground": "hsl(210 40% 98%)",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: "1.25",
        normal: "1.5",
        relaxed: "1.75",
      },
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
    },
    borderRadius: {
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
  },
];

// GET /api/ui/themes - Get themes
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI themes retrieval request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const themeId = searchParams.get("themeId");

    // Get specific theme
    if (themeId) {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) {
        logger.warn("Theme not found", "ui", { requestId, themeId });
        return StandardErrorResponse.notFound("Theme not found", requestId);
      }

      logger.info("UI theme retrieved successfully", "ui", {
        requestId,
        themeId,
        themeName: theme.name,
      });

      return StandardSuccessResponse.ok(
        {
          theme,
        },
        requestId,
      );
    }

    // Get all themes
    logger.info("UI themes retrieved successfully", "ui", {
      requestId,
      count: themes.length,
    });

    return StandardSuccessResponse.ok(
      {
        themes,
        total: themes.length,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving UI themes", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/themes",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve UI themes",
      requestId,
    );
  }
}

// POST /api/ui/themes - Create new theme
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI theme creation request", "ui", { requestId });

    const body = await _request.json();
    const validatedData = CreateThemeSchema.parse(body);

    // Check if theme with same name already exists
    const existingTheme = themes.find((t) => t.name === validatedData.name);
    if (existingTheme) {
      logger.warn("Theme with same name already exists", "ui", {
        requestId,
        themeName: validatedData.name,
      });
      return StandardErrorResponse.conflict(
        "Theme with this name already exists",
        requestId,
      );
    }

    const newTheme = {
      id: `theme-${Date.now()}`,
      ...validatedData,
    };

    themes.push(newTheme as any);

    logger.info("UI theme created successfully", "ui", {
      requestId,
      themeId: newTheme.id,
      themeName: newTheme.name,
    });

    return StandardSuccessResponse.created(
      {
        theme: newTheme,
        message: "Theme created successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in create theme request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error creating UI theme", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/themes",
    });

    return StandardErrorResponse.internal(
      "Failed to create UI theme",
      requestId,
    );
  }
}

// PUT /api/ui/themes - Update theme
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI theme update request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const themeId = searchParams.get("themeId");

    if (!themeId) {
      logger.warn("Theme ID missing in update request", "ui", { requestId });
      return StandardErrorResponse.badRequest(
        "Theme ID is required",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = UpdateThemeSchema.parse(body);

    const themeIndex = themes.findIndex((t) => t.id === themeId);
    if (themeIndex === -1) {
      logger.warn("Theme not found for update", "ui", {
        requestId,
        themeId,
      });
      return StandardErrorResponse.notFound("Theme not found", requestId);
    }

    // Check for name conflicts (excluding current theme)
    if (validatedData.name) {
      const nameConflict = themes.find(
        (t) => t.name === validatedData.name && t.id !== themeId,
      );
      if (nameConflict) {
        logger.warn("Theme name conflict during update", "ui", {
          requestId,
          themeId,
          conflictingName: validatedData.name,
        });
        return StandardErrorResponse.conflict(
          "Theme with this name already exists",
          requestId,
        );
      }
    }

    themes[themeIndex] = {
      ...themes[themeIndex],
      ...validatedData,
    } as any;

    logger.info("UI theme updated successfully", "ui", {
      requestId,
      themeId,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(
      {
        theme: themes[themeIndex],
        message: "Theme updated successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in update theme request", "ui", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error updating UI theme", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/themes",
    });

    return StandardErrorResponse.internal(
      "Failed to update UI theme",
      requestId,
    );
  }
}

// DELETE /api/ui/themes - Delete theme
export async function DELETE(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing UI theme deletion request", "ui", { requestId });

    const { searchParams } = new URL(_request.url);
    const themeId = searchParams.get("themeId");

    if (!themeId) {
      logger.warn("Theme ID missing in deletion request", "ui", { requestId });
      return StandardErrorResponse.badRequest(
        "Theme ID is required",
        requestId,
      );
    }

    const themeIndex = themes.findIndex((t) => t.id === themeId);
    if (themeIndex === -1) {
      logger.warn("Theme not found for deletion", "ui", {
        requestId,
        themeId,
      });
      return StandardErrorResponse.notFound("Theme not found", requestId);
    }

    const deletedTheme = themes.splice(themeIndex, 1)[0];

    logger.info("UI theme deleted successfully", "ui", {
      requestId,
      themeId,
      themeName: deletedTheme.name,
    });

    return StandardSuccessResponse.ok(
      {
        theme: deletedTheme,
        message: "Theme deleted successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error deleting UI theme", "ui", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/ui/themes",
    });

    return StandardErrorResponse.internal(
      "Failed to delete UI theme",
      requestId,
    );
  }
}
