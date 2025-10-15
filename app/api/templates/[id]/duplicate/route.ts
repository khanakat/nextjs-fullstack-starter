import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// POST /api/templates/[id]/duplicate - Duplicate a template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    // Find the original template
    const originalTemplate = await db.template.findUnique({
      where: { id: templateId },
      include: {
        category: true
      }
    });

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the template
    if (!originalTemplate.isPublic && originalTemplate.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create duplicate template
    const duplicatedTemplate = await db.template.create({
      data: {
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        categoryId: originalTemplate.categoryId,
        config: originalTemplate.config,
        isPublic: false, // Duplicated templates are private by default
        createdBy: userId
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(duplicatedTemplate, { status: 201 });
  } catch (error) {
    console.error('Error duplicating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}