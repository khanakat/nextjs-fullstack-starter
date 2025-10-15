import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/export-jobs/[id] - Get a specific export job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportJob = await db.exportJob.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exportJob);
  } catch (error) {
    console.error('Error fetching export job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/export-jobs/[id] - Delete an export job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportJob = await db.exportJob.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    });

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      );
    }

    // TODO: Delete the actual file from storage if it exists
    if (exportJob.downloadUrl) {
      // Delete file from storage system
        console.log(`Would delete file: ${exportJob.downloadUrl}`);
    }

    await db.exportJob.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Export job deleted successfully' });
  } catch (error) {
    console.error('Error deleting export job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}