import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/utils';
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from '@/lib/standardized-error-responses';
import { handleZodError } from '@/lib/error-handlers';

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
    'muted-foreground': z.string(),
    card: z.string(),
    'card-foreground': z.string(),
    border: z.string(),
    input: z.string(),
    ring: z.string(),
    destructive: z.string(),
    'destructive-foreground': z.string(),
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

// In-memory storage (replace with actual database in production)
let themes: any[] = [];

/**
 * UI Themes API Controller
 * Handles HTTP requests for UI theme management
 */
@injectable()
export class ThemesApiController {
  /**
   * GET /api/ui/themes
   * Get themes
   */
  async getThemes(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI themes retrieval request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const themeId = searchParams.get('themeId');

      // Get specific theme
      if (themeId) {
        const theme = themes.find((t) => t.id === themeId);
        if (!theme) {
          logger.warn('Theme not found', 'ui', { requestId, themeId });
          return StandardErrorResponse.notFound('Theme not found', requestId);
        }

        logger.info('UI theme retrieved successfully', 'ui', {
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
      logger.info('UI themes retrieved successfully', 'ui', {
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
      logger.error('Error retrieving UI themes', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/themes',
      });

      return StandardErrorResponse.internal(
        'Failed to retrieve UI themes',
        requestId,
      );
    }
  }

  /**
   * POST /api/ui/themes
   * Create new theme
   */
  async createTheme(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI theme creation request', 'ui', { requestId });

      const body = await request.json();
      const validatedData = CreateThemeSchema.parse(body);

      // Check if theme with same name already exists
      const existingTheme = themes.find((t) => t.name === validatedData.name);
      if (existingTheme) {
        logger.warn('Theme with same name already exists', 'ui', {
          requestId,
          themeName: validatedData.name,
        });
        return StandardErrorResponse.conflict(
          'Theme with this name already exists',
          requestId,
        );
      }

      const newTheme = {
        id: `theme-${Date.now()}`,
        ...validatedData,
      };

      themes.push(newTheme);

      logger.info('UI theme created successfully', 'ui', {
        requestId,
        themeId: newTheme.id,
        themeName: newTheme.name,
      });

      return StandardSuccessResponse.created(
        {
          theme: newTheme,
          message: 'Theme created successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in create theme request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error creating UI theme', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/themes',
      });

      return StandardErrorResponse.internal(
        'Failed to create UI theme',
        requestId,
      );
    }
  }

  /**
   * PUT /api/ui/themes
   * Update theme
   */
  async updateTheme(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI theme update request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const themeId = searchParams.get('themeId');

      if (!themeId) {
        logger.warn('Theme ID missing in update request', 'ui', { requestId });
        return StandardErrorResponse.badRequest(
          'Theme ID is required',
          requestId,
        );
      }

      const body = await request.json();
      const validatedData = UpdateThemeSchema.parse(body);

      const themeIndex = themes.findIndex((t) => t.id === themeId);
      if (themeIndex === -1) {
        logger.warn('Theme not found for update', 'ui', {
          requestId,
          themeId,
        });
        return StandardErrorResponse.notFound('Theme not found', requestId);
      }

      // Check for name conflicts (excluding current theme)
      if (validatedData.name) {
        const nameConflict = themes.find(
          (t) => t.name === validatedData.name && t.id !== themeId,
        );
        if (nameConflict) {
          logger.warn('Theme name conflict during update', 'ui', {
            requestId,
            themeId,
            conflictingName: validatedData.name,
          });
          return StandardErrorResponse.conflict(
            'Theme with this name already exists',
            requestId,
          );
        }
      }

      themes[themeIndex] = {
        ...themes[themeIndex],
        ...validatedData,
      };

      logger.info('UI theme updated successfully', 'ui', {
        requestId,
        themeId,
        updatedFields: Object.keys(validatedData),
      });

      return StandardSuccessResponse.ok(
        {
          theme: themes[themeIndex],
          message: 'Theme updated successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in update theme request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error updating UI theme', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/themes',
      });

      return StandardErrorResponse.internal(
        'Failed to update UI theme',
        requestId,
      );
    }
  }

  /**
   * DELETE /api/ui/themes
   * Delete theme
   */
  async deleteTheme(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI theme deletion request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const themeId = searchParams.get('themeId');

      if (!themeId) {
        logger.warn('Theme ID missing in deletion request', 'ui', { requestId });
        return StandardErrorResponse.badRequest(
          'Theme ID is required',
          requestId,
        );
      }

      const themeIndex = themes.findIndex((t) => t.id === themeId);
      if (themeIndex === -1) {
        logger.warn('Theme not found for deletion', 'ui', {
          requestId,
          themeId,
        });
        return StandardErrorResponse.notFound('Theme not found', requestId);
      }

      const deletedTheme = themes.splice(themeIndex, 1)[0];

      logger.info('UI theme deleted successfully', 'ui', {
        requestId,
        themeId,
        themeName: deletedTheme.name,
      });

      return StandardSuccessResponse.ok(
        {
          theme: deletedTheme,
          message: 'Theme deleted successfully',
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error deleting UI theme', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/themes',
      });

      return StandardErrorResponse.internal(
        'Failed to delete UI theme',
        requestId,
      );
    }
  }
}
