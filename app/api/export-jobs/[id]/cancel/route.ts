import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// POST /api/export-jobs/[id]/cancel - Cancel an export job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;

    // Find the export job
    const exportJob = await db.exportJob.findUnique({
      where: { id: jobId }
    });

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      );
    }

    // Check if user owns the job
    if (exportJob.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if job can be cancelled
    if (!['pending', 'processing'].includes(exportJob.status)) {
      return NextResponse.json(
        { error: 'Job cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    const updatedJob = await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled'
      }
    });

    // TODO: Cancel any running background processes
    // This would involve cancelling the actual export process
    // For now, we just update the database status

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error cancelling export job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}