import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { container } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ReportsApiController } from '@/slices/reports/presentation/controllers/reports-api.controller';

// GET /api/reports - Get reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || undefined;

    // Get controller from DI container
    const controller = container.get<ReportsApiController>(ReportTypes.ReportsApiController);

    const result = await controller.listReports({
      userId,
      organizationId: orgId,
      status,
      page,
      limit,
    });

    if (!result.success) {
      return new Response(JSON.stringify(result), { status: 400 });
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Title is required' }), { status: 400 });
    }

    if (!body.config || typeof body.config !== 'object') {
      return new Response(JSON.stringify({ success: false, error: 'Config is required' }), { status: 400 });
    }

    // Get controller from DI container
    const controller = container.get<ReportsApiController>(ReportTypes.ReportsApiController);

    const result = await controller.createReport({
      userId,
      organizationId: orgId,
      title: body.title,
      description: body.description,
      config: body.config,
      isPublic: body.isPublic,
    });

    if (!result.success) {
      return new Response(JSON.stringify(result), { status: 400 });
    }

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
}
