import { NextRequest, NextResponse } from 'next/server';
import { GetDashboardQuery } from '../../application/queries/get-dashboard-query';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Get Dashboard API Route
 * GET /api/analytics/dashboards/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Dashboard ID is required' },
        { status: 400 }
      );
    }

    // Create query
    const query = new GetDashboardQuery(UniqueId.create(id));

    // TODO: Inject and execute use case
    // const useCase = container.get<GetDashboardUseCase>('GetDashboardUseCase');
    // const result = await useCase.execute(query);

    // if (!result.isSuccess) {
    //   if (result.error?.message === 'Dashboard not found') {
    //     return NextResponse.json(
    //       { error: result.error?.message },
    //       { status: 404 }
    //     );
    //   }
    //   return NextResponse.json(
    //     { error: result.error?.message || 'Failed to get dashboard' },
    //     { status: 400 }
    //   );
    // }

    // return NextResponse.json(result.value);

    // Temporary response until DI container is set up
    return NextResponse.json(
      {
        message: 'Get Dashboard API route created - DI container integration pending',
        dashboardId: query.dashboardId.value,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
