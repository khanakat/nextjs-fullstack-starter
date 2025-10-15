import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// POST /api/export-jobs/[id]/retry - Retry a failed export job
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
      where: { id: jobId },
      include: {
        report: true
      }
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

    // Check if job can be retried
    if (exportJob.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      );
    }

    // Reset job status and clear error information
    const updatedJob = await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        errorMessage: null,
        downloadUrl: null
      }
    });

    // TODO: Queue the job for processing
    // This would involve adding the job back to the export queue
    // For now, we just update the database status

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error retrying export job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}