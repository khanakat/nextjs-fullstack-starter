import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ReportStatus } from '@/lib/types/reports';

// Validation schema for updates
const updateReportSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
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
  status: z.nativeEnum(ReportStatus).optional()
});

// Helper function to check report permissions
async function checkReportPermission(reportId: string, userId: string, requiredPermission: 'VIEW' | 'EDIT' | 'ADMIN') {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      permissions: {
        where: { userId }
      }
    }
  });

  if (!report) {
    return { hasPermission: false, report: null };
  }

  // Owner has all permissions
  if (report.createdBy === userId) {
    return { hasPermission: true, report };
  }

  // Public reports can be viewed
  if (report.isPublic && requiredPermission === 'VIEW') {
    return { hasPermission: true, report };
  }

  // Check explicit permissions
  const permission = report.permissions[0];
  if (!permission) {
    return { hasPermission: false, report };
  }

  const permissionLevels = {
    'VIEW': ['view', 'edit', 'admin'],
    'EDIT': ['edit', 'admin'],
    'ADMIN': ['admin']
  };

  const hasPermission = permissionLevels[requiredPermission].includes(permission.permissionType);
  return { hasPermission, report };
}

// GET /api/reports/[id] - Get a specific report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, report } = await checkReportPermission(params.id, userId, 'VIEW');

    if (!hasPermission || !report) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    // Get full report with relations
    const fullReport = await db.report.findUnique({
      where: { id: params.id },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    // Note: viewCount field doesn't exist in schema, removing this update

    return NextResponse.json(fullReport);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update a report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkReportPermission(params.id, userId, 'EDIT');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    // Update report
    const updatedReport = await db.report.update({
      where: { id: params.id },
      data: {
        name: validatedData.title,
        description: validatedData.description,
        config: validatedData.config ? JSON.stringify(validatedData.config) : undefined,
        isPublic: validatedData.isPublic,
        status: validatedData.status
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission, report } = await checkReportPermission(params.id, userId, 'ADMIN');

    if (!hasPermission || !report) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner can delete
    if (report.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the report owner can delete it' },
        { status: 403 }
      );
    }

    // Delete related records first
    await db.$transaction([
      db.exportJob.deleteMany({ where: { reportId: params.id } }),
      db.reportPermission.deleteMany({ where: { reportId: params.id } }),
      db.report.delete({ where: { id: params.id } })
    ]);

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}