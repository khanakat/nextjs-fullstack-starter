import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  jobIds: z.array(z.string()).min(1, 'At least one job ID is required')
});

// POST /api/export-jobs/bulk-delete - Delete multiple export jobs
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobIds } = bulkDeleteSchema.parse(body);

    // Find all jobs that belong to the user
    const jobs = await db.exportJob.findMany({
      where: {
        id: { in: jobIds },
        userId
      }
    });

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'No jobs found or access denied' },
        { status: 404 }
      );
    }

    // Delete the jobs
    const deleteResult = await db.exportJob.deleteMany({
      where: {
        id: { in: jobs.map(job => job.id) },
        userId
      }
    });

    // TODO: In a real implementation, you would also:
    // 1. Delete the associated files from storage
    // 2. Cancel any running export processes
    // 3. Clean up any temporary resources

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      requestedCount: jobIds.length
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error bulk deleting export jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}