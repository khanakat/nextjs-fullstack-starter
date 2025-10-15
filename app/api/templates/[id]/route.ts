import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  config: z.object({
    title: z.string(),
    description: z.string().optional(),
    templateId: z.string().optional(),
    filters: z.record(z.any()),
    parameters: z.record(z.any()),
    layout: z.object({
      components: z.array(z.any()),
      grid: z.object({
        columns: z.number(),
        rows: z.number(),
        gap: z.number()
      })
    }),
    styling: z.object({
      theme: z.enum(['light', 'dark']),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      fontFamily: z.string(),
      fontSize: z.number()
    })
  }).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Helper function to check template permissions
async function checkTemplatePermission(templateId: string, userId: string, requiredPermission: 'VIEW' | 'EDIT') {
  const template = await db.template.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    return { hasPermission: false, template: null };
  }

  // Owner has all permissions
  if (template.createdBy === userId) {
    return { hasPermission: true, template };
  }

  // Public templates can be viewed
  if (template.isPublic && requiredPermission === 'VIEW') {
    return { hasPermission: true, template };
  }

  return { hasPermission: false, template };
}

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, template } = await checkTemplatePermission(params.id, userId, 'VIEW');

    if (!hasPermission || !template) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // Get full template with relations
    const fullTemplate = await db.template.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            createdBy: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });



    return NextResponse.json(fullTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, template } = await checkTemplatePermission(params.id, userId, 'EDIT');

    if (!hasPermission || !template) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner can edit
    if (template.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the template owner can edit it' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await db.templateCategory.findUnique({
        where: { id: validatedData.categoryId }
      });
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    // Update template
    const updatedTemplate = await db.template.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        config: validatedData.config ? JSON.stringify(validatedData.config) : undefined,
        isPublic: validatedData.isPublic
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            createdBy: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, template } = await checkTemplatePermission(params.id, userId, 'EDIT');

    if (!hasPermission || !template) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner can delete
    if (template.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the template owner can delete it' },
        { status: 403 }
      );
    }

    // Check if template is being used by reports
    const reportsUsingTemplate = await db.report.count({
      where: { templateId: params.id }
    });

    if (reportsUsingTemplate > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used by reports' },
        { status: 400 }
      );
    }

    // Delete template
    await db.template.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/templates/[id]/use - Use a template to create a new report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, template } = await checkTemplatePermission(params.id, userId, 'VIEW');

    if (!hasPermission || !template) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create report from template
    const report = await db.report.create({
      data: {
        name: title,
        description,
        templateId: params.id,
        config: template.config,
        isPublic: false,
        status: 'draft',
        createdBy: userId
      },
      include: {
        template: {
          include: {
            category: true
          }
        }
      }
    });



    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report from template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}