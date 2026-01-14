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

// Layout template validation schemas
const LayoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'dashboard',
    'landing',
    'admin',
    'blog',
    'ecommerce',
    'portfolio',
    'documentation',
  ]),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  preview: z.string().optional(), // URL to preview image
  layout: z.object({
    type: z.enum(['grid', 'flex', 'sidebar', 'split', 'masonry', 'custom']),
    structure: z.record(z.any()), // Layout configuration
    responsive: z
      .object({
        mobile: z.record(z.any()).optional(),
        tablet: z.record(z.any()).optional(),
        desktop: z.record(z.any()).optional(),
      })
      .optional(),
  }),
  components: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      props: z.record(z.any()).optional(),
      responsive: z
        .object({
          mobile: z.record(z.any()).optional(),
          tablet: z.record(z.any()).optional(),
          desktop: z.record(z.any()).optional(),
        })
        .optional(),
    }),
  ),
  styles: z
    .object({
      theme: z.string().optional(),
      customCSS: z.string().optional(),
      variables: z.record(z.string()).optional(),
    })
    .optional(),
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      created: z.string().optional(),
      updated: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      isPublic: z.boolean().default(true),
      allowCustomization: z.boolean().default(true),
      requiresAuth: z.boolean().default(false),
    })
    .optional(),
});

const CreateTemplateSchema = LayoutTemplateSchema.omit({ id: true });
const UpdateTemplateSchema = LayoutTemplateSchema.partial().omit({ id: true });

// In-memory storage (replace with actual database in production)
let layoutTemplates: any[] = [];

/**
 * UI Templates API Controller
 * Handles HTTP requests for UI layout template management
 */
@injectable()
export class TemplatesApiController {
  /**
   * GET /api/ui/templates
   * Get layout templates
   */
  async getTemplates(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI templates retrieval request', 'ui', {
        requestId,
      });

      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const templateId = searchParams.get('templateId');
      const isPublic = searchParams.get('isPublic');

      // Get specific template
      if (templateId) {
        const template = layoutTemplates.find((t) => t.id === templateId);
        if (!template) {
          logger.warn('Template not found', 'ui', { requestId, templateId });
          return StandardErrorResponse.notFound('Template not found', requestId);
        }

        logger.info('UI template retrieved successfully', 'ui', {
          requestId,
          templateId,
          category: template.category,
        });

        return StandardSuccessResponse.ok(
          {
            template,
          },
          requestId,
        );
      }

      // Filter templates
      let filteredTemplates = layoutTemplates;

      if (category) {
        filteredTemplates = filteredTemplates.filter(
          (t) => t.category === category,
        );
      }

      if (isPublic !== null) {
        const publicFilter = isPublic === 'true';
        filteredTemplates = filteredTemplates.filter(
          (t) => t.settings?.isPublic === publicFilter,
        );
      }

      logger.info('UI templates retrieved successfully', 'ui', {
        requestId,
        count: filteredTemplates.length,
        category: category || 'all',
        isPublic: isPublic || 'all',
      });

      return StandardSuccessResponse.ok(
        {
          templates: filteredTemplates,
          total: filteredTemplates.length,
          categories: [...new Set(layoutTemplates.map((t) => t.category))],
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error retrieving UI templates', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/templates',
      });

      return StandardErrorResponse.internal(
        'Failed to retrieve UI templates',
        requestId,
      );
    }
  }

  /**
   * POST /api/ui/templates
   * Create new template
   */
  async createTemplate(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI template creation request', 'ui', { requestId });

      const body = await request.json();
      const validatedData = CreateTemplateSchema.parse(body);

      // Check if template with same name already exists
      const existingTemplate = layoutTemplates.find(
        (t) => t.name === validatedData.name,
      );
      if (existingTemplate) {
        logger.warn('Template with same name already exists', 'ui', {
          requestId,
          templateName: validatedData.name,
        });
        return StandardErrorResponse.conflict(
          'Template with this name already exists',
          requestId,
        );
      }

      const newTemplate = {
        id: `template-${Date.now()}`,
        ...validatedData,
        metadata: {
          ...validatedData.metadata,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      };

      layoutTemplates.push(newTemplate);

      logger.info('UI template created successfully', 'ui', {
        requestId,
        templateId: newTemplate.id,
        templateName: newTemplate.name,
        category: newTemplate.category,
      });

      return StandardSuccessResponse.created(
        {
          template: newTemplate,
          message: 'Template created successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in create template request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error creating UI template', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/templates',
      });

      return StandardErrorResponse.internal(
        'Failed to create UI template',
        requestId,
      );
    }
  }

  /**
   * PUT /api/ui/templates
   * Update template
   */
  async updateTemplate(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI template update request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const templateId = searchParams.get('templateId');

      if (!templateId) {
        logger.warn('Template ID missing in update request', 'ui', { requestId });
        return StandardErrorResponse.badRequest(
          'Template ID is required',
          requestId,
        );
      }

      const body = await request.json();
      const validatedData = UpdateTemplateSchema.parse(body);

      const templateIndex = layoutTemplates.findIndex((t) => t.id === templateId);
      if (templateIndex === -1) {
        logger.warn('Template not found for update', 'ui', {
          requestId,
          templateId,
        });
        return StandardErrorResponse.notFound('Template not found', requestId);
      }

      // Check for name conflicts (excluding current template)
      if (validatedData.name) {
        const nameConflict = layoutTemplates.find(
          (t) => t.name === validatedData.name && t.id !== templateId,
        );
        if (nameConflict) {
          logger.warn('Template name conflict during update', 'ui', {
            requestId,
            templateId,
            conflictingName: validatedData.name,
          });
          return StandardErrorResponse.conflict(
            'Template with this name already exists',
            requestId,
          );
        }
      }

      layoutTemplates[templateIndex] = {
        ...layoutTemplates[templateIndex],
        ...validatedData,
        metadata: {
          ...layoutTemplates[templateIndex].metadata,
          ...validatedData.metadata,
          updated: new Date().toISOString(),
        },
      };

      logger.info('UI template updated successfully', 'ui', {
        requestId,
        templateId,
        updatedFields: Object.keys(validatedData),
      });

      return StandardSuccessResponse.ok(
        {
          template: layoutTemplates[templateIndex],
          message: 'Template updated successfully',
        },
        requestId,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error in update template request', 'ui', {
          requestId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }

      logger.error('Error updating UI template', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/templates',
      });

      return StandardErrorResponse.internal(
        'Failed to update UI template',
        requestId,
      );
    }
  }

  /**
   * DELETE /api/ui/templates
   * Delete template
   */
  async deleteTemplate(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI template deletion request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const templateId = searchParams.get('templateId');

      if (!templateId) {
        logger.warn('Template ID missing in deletion request', 'ui', {
          requestId,
        });
        return StandardErrorResponse.badRequest(
          'Template ID is required',
          requestId,
        );
      }

      const templateIndex = layoutTemplates.findIndex((t) => t.id === templateId);
      if (templateIndex === -1) {
        logger.warn('Template not found for deletion', 'ui', {
          requestId,
          templateId,
        });
        return StandardErrorResponse.notFound('Template not found', requestId);
      }

      const deletedTemplate = layoutTemplates.splice(templateIndex, 1)[0];

      logger.info('UI template deleted successfully', 'ui', {
        requestId,
        templateId,
        templateName: deletedTemplate.name,
      });

      return StandardSuccessResponse.ok(
        {
          template: deletedTemplate,
          message: 'Template deleted successfully',
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error deleting UI template', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/templates',
      });

      return StandardErrorResponse.internal(
        'Failed to delete UI template',
        requestId,
      );
    }
  }

  /**
   * PATCH /api/ui/templates
   * Clone or duplicate template
   */
  async cloneTemplate(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      logger.info('Processing UI template clone request', 'ui', { requestId });

      const { searchParams } = new URL(request.url);
      const templateId = searchParams.get('templateId');
      const action = searchParams.get('action');

      if (!templateId) {
        logger.warn('Template ID missing in clone request', 'ui', { requestId });
        return StandardErrorResponse.badRequest(
          'Template ID is required',
          requestId,
        );
      }

      if (action !== 'clone') {
        logger.warn('Invalid action specified for template operation', 'ui', {
          requestId,
          action,
        });
        return StandardErrorResponse.badRequest(
          'Only "clone" action is supported',
          requestId,
        );
      }

      const template = layoutTemplates.find((t) => t.id === templateId);
      if (!template) {
        logger.warn('Template not found for cloning', 'ui', {
          requestId,
          templateId,
        });
        return StandardErrorResponse.notFound('Template not found', requestId);
      }

      const body = await request.json();
      const { name } = body;

      if (!name) {
        logger.warn('Name missing for template clone', 'ui', { requestId });
        return StandardErrorResponse.badRequest(
          'Name is required for cloning',
          requestId,
        );
      }

      // Check if name already exists
      const nameExists = layoutTemplates.find((t) => t.name === name);
      if (nameExists) {
        logger.warn('Template name already exists for clone', 'ui', {
          requestId,
          name,
        });
        return StandardErrorResponse.conflict(
          'Template with this name already exists',
          requestId,
        );
      }

      const clonedTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name,
        metadata: {
          ...template.metadata,
          title: `${name} (Cloned)`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      };

      layoutTemplates.push(clonedTemplate);

      logger.info('UI template cloned successfully', 'ui', {
        requestId,
        originalTemplateId: templateId,
        clonedTemplateId: clonedTemplate.id,
        clonedName: name,
      });

      return StandardSuccessResponse.created(
        {
          template: clonedTemplate,
          message: 'Template cloned successfully',
        },
        requestId,
      );
    } catch (error) {
      logger.error('Error cloning UI template', 'ui', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/ui/templates',
      });

      return StandardErrorResponse.internal(
        'Failed to clone UI template',
        requestId,
      );
    }
  }
}
