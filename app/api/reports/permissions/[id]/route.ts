import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updatePermissionSchema = z.object({
  permission: z.enum(['read', 'write', 'admin'])
});

// PUT /api/reports/permissions/[id] - Update a permission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionId = params.id;
    const body = await request.json();
    const { permission } = updatePermissionSchema.parse(body);

    // Find the permission
    const existingPermission = await db.reportPermission.findUnique({
      where: { id: permissionId },
      include: {
        report: true
      }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if user has admin access
    const userPermission = await db.reportPermission.findFirst({
      where: {
        userId,
        reportId: existingPermission.reportId
      }
    });

    const isOwner = existingPermission.report.createdBy === userId;
    const hasAdminAccess = userPermission?.permissionType === 'admin' || isOwner;

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update permission
    const updatedPermission = await db.reportPermission.update({
      where: { id: permissionId },
      data: { permissionType: permission },
      include: {
        report: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating report permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/permissions/[id] - Delete a permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionId = params.id;

    // Find the permission
    const existingPermission = await db.reportPermission.findUnique({
      where: { id: permissionId },
      include: {
        report: true
      }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if user has admin access
    const userPermission = await db.reportPermission.findFirst({
      where: {
        userId,
        reportId: existingPermission.reportId
      }
    });

    const isOwner = existingPermission.report.createdBy === userId;
    const hasAdminAccess = userPermission?.permissionType === 'admin' || isOwner;

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete permission
    await db.reportPermission.delete({
      where: { id: permissionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}