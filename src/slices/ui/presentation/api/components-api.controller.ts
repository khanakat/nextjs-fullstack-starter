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

// Component configuration validation schemas
const ComponentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'layout',
    'form',
    'data',
    'feedback',
    'navigation',
    'media',
    'overlay',
  ]),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  props: z.record(z.any()).optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        props: z.record(z.any()),
        description: z.string().optional(),
      }),
    )
    .optional(),
  examples: z
    .array(
      z.object({
        name: z.string(),
        code: z.string(),
        description: z.string().optional(),
        props: z.record(z.any()).optional(),
      }),
    )
    .optional(),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['stable', 'beta', 'alpha', 'deprecated']).default('stable'),
  accessibility: z
    .object({
      ariaLabels: z.array(z.string()).optional(),
      keyboardSupport: z.boolean().optional(),
      screenReaderSupport: z.boolean().optional(),
      colorContrast: z.boolean().optional(),
    })
    .optional(),
  responsive: z
    .object({
      mobile: z.boolean().optional(),
      tablet: z.boolean().optional(),
      desktop: z.boolean().optional(),
    })
    .optional(),
  customization: z
    .object({
      themeable: z.boolean().optional(),
      cssVariables: z.array(z.string()).optional(),
      classNames: z.array(z.string()).optional(),
    })
    .optional(),
});

const CreateComponentConfigSchema = ComponentConfigSchema.omit({ id: true });
const UpdateComponentConfigSchema = ComponentConfigSchema.partial().omit({
  id: true,
});

// In-memory storage (replace with actual database in production)
let componentConfigs: any[] = [];

/**
 * UI Components API Controller
 * Handles HTTP requests for UI component configuration management
 */
@injectable()
export class ComponentsApiController {
  /**
   * GET /api/ui/components
   * Get all component configurations or a specific one
   */
  async getComponents(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { searchParams } = new URL(request.url);
      const componentId = searchParams.get('id');
      const category = searchParams.get('category');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const tags = searchParams.get('tags')?.split(',');

      logger.info('Processing UI components request', 'ui', {
        requestId,
        componentId,
        category,
        status,
        search,
        tags: tags?.length || 0,
      });

      let filteredComponents = [...componentConfigs];

      if (componentId) {
        const component = filteredComponents.find((c) => c.id === componentId);
        if (!component) {
          logger.warn('Component not found', 'ui', { requestId, componentId });
          return StandardErrorResponse.notFound('Component not found', requestId);
        }

        logger.info('Component retrieved successfully', 'ui', {
          requestId,
          componentId,
          componentName: component.name,
        });

        return StandardSuccessResponse.ok({ component }, requestId);
      }

      // Apply filters
      if (category) {
        filteredComponents = filteredComponents.filter(
          (c) => c.category === category,
        );
      }

      if (status) {
        filteredComponents = filteredComponents.filter(
          (c) => c.status === status,
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredComponents = filteredComponents.filter(
          (c) =>
            c.name.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower) ||
            c.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)),
        );
      }

      if (tags && tags.length > 0) {
        filteredComponents = filteredComponents.filter((c) =>
          tags.some((tag) => c.tags?.includes(tag)),
        );
      }

      // Get categories and tags for filtering
      const categories = [...new Set(componentConfigs.map((c) => c.category))];
      const allTags = [...new Set(componentConfigs.flatMap((c) => c.tags || []))];
      const statuses = [...new Set(componentConfigs.map((c) => c.status))];

      logger.info('Components retrieved successfully', 'ui', {
        requestId,
        totalComponents: filteredComponents.length,
        filtersApplied: { category, status, search, tags: tags?.length || 0 },
      });

      return StandardSuccessResponse.ok(
        {
          components: filteredComponents,
          total: filteredComponents.length,
          filters: {
            categories,
            tags: allTags,
            statuses,
          },
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error processing UI components request', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/components',
      });

      return StandardErrorResponse.internal(
        'Failed to process UI components request',
        requestId,
      );
    }
  }

  /**
   * POST /api/ui/components
   * Create a new component configuration
   */
  async createComponent(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const body = await request.json();

      logger.info('Creating new component configuration', 'ui', {
        requestId,
        componentName: body.name,
      });

      const validatedData = CreateComponentConfigSchema.parse(body);

      // Check if component with same name already exists
      const existingComponent = componentConfigs.find(
        (c) => c.name === validatedData.name,
      );
      if (existingComponent) {
        logger.warn('Component with name already exists', 'ui', {
          requestId,
          componentName: validatedData.name,
          existingId: existingComponent.id,
        });
        return StandardErrorResponse.conflict(
          'Component with this name already exists',
          requestId,
        );
      }

      const newComponent = {
        id: `component-${Date.now()}`,
        ...validatedData,
      };

      componentConfigs.push(newComponent);

      logger.info('Component configuration created successfully', 'ui', {
        requestId,
        componentId: newComponent.id,
        componentName: newComponent.name,
        category: newComponent.category,
      });

      return StandardSuccessResponse.created(
        {
          component: newComponent,
          message: 'Component configuration created successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in create component request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error creating component configuration', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/components',
      });

      return StandardErrorResponse.internal(
        'Failed to create component configuration',
        requestId,
      );
    }
  }

  /**
   * PUT /api/ui/components
   * Update a component configuration
   */
  async updateComponent(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing component update request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const componentId = searchParams.get('id');

      if (!componentId) {
        logger.warn('Component ID missing in update request', 'ui', {
          requestId,
        });
        return StandardErrorResponse.badRequest(
          'Component ID is required',
          requestId,
        );
      }

      const body = await request.json();
      const validatedData = UpdateComponentConfigSchema.parse(body);

      const componentIndex = componentConfigs.findIndex(
        (c) => c.id === componentId,
      );
      if (componentIndex === -1) {
        logger.warn('Component not found for update', 'ui', {
          requestId,
          componentId,
        });
        return StandardErrorResponse.notFound('Component not found', requestId);
      }

      // Check if updating name would conflict with existing component
      if (validatedData.name) {
        const existingComponent = componentConfigs.find(
          (c) => c.name === validatedData.name && c.id !== componentId,
        );
        if (existingComponent) {
          logger.warn('Component name conflict during update', 'ui', {
            requestId,
            componentId,
            conflictingName: validatedData.name,
          });
          return StandardErrorResponse.conflict(
            'Component with this name already exists',
            requestId,
          );
        }
      }

      componentConfigs[componentIndex] = {
        ...componentConfigs[componentIndex],
        ...validatedData,
      };

      logger.info('Component updated successfully', 'ui', {
        requestId,
        componentId,
        updatedFields: Object.keys(validatedData),
      });

      return StandardSuccessResponse.ok(
        {
          component: componentConfigs[componentIndex],
          message: 'Component configuration updated successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in update component request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error updating component configuration', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/components',
      });

      return StandardErrorResponse.internal(
        'Failed to update component configuration',
        requestId,
      );
    }
  }

  /**
   * DELETE /api/ui/components
   * Delete a component configuration
   */
  async deleteComponent(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing component deletion request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const componentId = searchParams.get('id');

      if (!componentId) {
        logger.warn('Component ID missing in deletion request', 'ui', {
          requestId,
        });
        return StandardErrorResponse.badRequest(
          'Component ID is required',
          requestId,
        );
      }

      const componentIndex = componentConfigs.findIndex(
        (c) => c.id === componentId,
      );
      if (componentIndex === -1) {
        logger.warn('Component not found for deletion', 'ui', {
          requestId,
          componentId,
        });
        return StandardErrorResponse.notFound('Component not found', requestId);
      }

      const deletedComponent = componentConfigs.splice(componentIndex, 1)[0];

      logger.info('Component deleted successfully', 'ui', {
        requestId,
        componentId,
        componentName: deletedComponent.name,
      });

      return StandardSuccessResponse.ok(
        {
          component: deletedComponent,
          message: 'Component configuration deleted successfully',
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error deleting component configuration', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/components',
      });

      return StandardErrorResponse.internal(
        'Failed to delete component configuration',
        requestId,
      );
    }
  }
}
