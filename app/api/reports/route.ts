import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from '@/lib/standardized-error-responses';
// Validation schema for create
const createReportSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  config: z.record(z.any()),
  isPublic: z.boolean().optional(),
});

// GET /api/reports - Get reports with filtering and pagination
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || undefined;

    const where: any = { createdBy: userId };
    if (status) {
      // Accept both domain and lowercase inputs from tests
      const normalized = status.toString().toUpperCase();
      where.status = normalized;
    }
    if (orgId) {
      where.organizationId = orgId;
    }

    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, skip, take: limit }),
      prisma.report.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: { reports, pagination: { total, page, limit, totalPages: Math.ceil(total / Math.max(limit, 1)) } },
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: 'validation' }), { status: 400 });
    }

    const data = parsed.data;

    const created = await prisma.report.create({
      data: {
        name: data.title,
        description: data.description,
        config: JSON.stringify(data.config),
        isPublic: data.isPublic ?? false,
        status: 'draft',
        createdBy: userId,
        organizationId: orgId || undefined,
      },
    });

    return new Response(JSON.stringify({ success: true, data: created }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
}
