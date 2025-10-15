import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
});

// GET /api/template-categories - List all template categories
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await db.templateCategory.findMany({
      include: {
        templates: {
          select: {
            id: true,
            name: true,
            isPublic: true,
            createdBy: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Filter templates based on user access
    const filteredCategories = categories.map(category => ({
      ...category,
      templates: category.templates.filter(template => 
        template.isPublic || template.createdBy === userId
      ),
      templateCount: category.templates.filter(template => 
        template.isPublic || template.createdBy === userId
      ).length
    }));

    return NextResponse.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching template categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/template-categories - Create a new template category (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check here
    // For now, allow any authenticated user to create categories
    
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category name already exists
    const existingCategory = await db.templateCategory.findFirst({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      );
    }

    const category = await db.templateCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,

      },
      include: {
        templates: true
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating template category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}