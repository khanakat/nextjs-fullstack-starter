import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/export-jobs/[id]/download - Download exported file
export async function GET(
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

    // Check if job is completed and has a file
    if (exportJob.status !== 'completed' || !exportJob.downloadUrl) {
      return NextResponse.json(
        { error: 'File not available for download' },
        { status: 400 }
      );
    }

    // Check if file has expired (if completedAt is more than 24 hours ago)
    if (exportJob.completedAt && new Date().getTime() - exportJob.completedAt.getTime() > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      );
    }

    // TODO: In a real implementation, you would:
    // 1. Fetch the file from your storage service (S3, etc.)
    // 2. Stream the file content to the response
    // 3. Set appropriate headers for file download
    
    // For now, we'll return a redirect to the file URL
    // In production, you might want to generate signed URLs or stream the file directly
    
    const fileExtension = exportJob.format === 'excel' ? 'xlsx' : exportJob.format;
    const fileName = `${exportJob.report.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Type', getContentType(exportJob.format));
    
    // In a real implementation, you would stream the file content here
    // For now, we'll return a success response with download information
    return NextResponse.json({
      downloadUrl: exportJob.downloadUrl,
      fileName,
      contentType: getContentType(exportJob.format)
    });

  } catch (error) {
    console.error('Error downloading export file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}