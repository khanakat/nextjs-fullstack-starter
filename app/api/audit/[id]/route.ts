import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { AuditApiController } from '@/slices/audit/presentation/api/audit-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Audit Log by ID API Routes
 * Handles HTTP requests for individual audit log management using clean architecture
 */

// GET /api/audit/[id] - Get audit log by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<AuditApiController>(TYPES.AuditApiController);
    return await controller.getAuditLog(params.id);
  } catch (error) {
    console.error('Error in GET /api/audit/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/audit/[id] - Update audit log
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<AuditApiController>(TYPES.AuditApiController);
    return await controller.updateAuditLog(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/audit/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/audit/[id] - Delete audit log
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<AuditApiController>(TYPES.AuditApiController);
    return await controller.deleteAuditLog(params.id);
  } catch (error) {
    console.error('Error in DELETE /api/audit/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
