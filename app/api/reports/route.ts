import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ReportStatus } from '@/lib/types/reports';

// Validation schemas
const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  templateId: z.string().optional(),
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
  }),
  isPublic: z.boolean().default(false)
});

const updateReportSchema = createReportSchema.partial();

// GET /api/reports - List reports with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as ReportStatus;
    const templateId = searchParams.get('templateId') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { createdBy: userId },
        { isPublic: true },
        {
          permissions: {
            some: {
              userId: userId,
              permission: {
                in: ['VIEW', 'EDIT', 'ADMIN']
              }
            }
          }
        }
      ]
    };

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (status) {
      where.AND = where.AND || [];
      where.AND.push({ status });
    }

    if (templateId) {
      where.AND = where.AND || [];
      where.AND.push({ templateId });
    }

    // Get reports with relations
    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          template: {
            include: {
              category: true
            }
          },
          permissions: true,
          exportJobs: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      db.report.count({ where })
    ]);

    return NextResponse.json({
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Verify template exists if provided
    if (validatedData.templateId) {
      const template = await db.template.findUnique({
        where: { id: validatedData.templateId }
      });
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Check if user has access to template
      if (!template.isPublic && template.createdBy !== userId) {
        return NextResponse.json(
          { error: 'Access denied to template' },
          { status: 403 }
        );
      }
    }

    // Create report
    const report = await db.report.create({
      data: {
        name: validatedData.title,
        description: validatedData.description,
        templateId: validatedData.templateId,
        config: JSON.stringify(validatedData.config),
        isPublic: validatedData.isPublic,
        status: ReportStatus.DRAFT,
        createdBy: userId
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true
      }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}