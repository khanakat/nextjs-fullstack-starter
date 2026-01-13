import { NextRequest, NextResponse } from 'next/server';
import { GetDashboardsQuery } from '../../application/queries/get-dashboards-query';
import { DashboardStatus } from '../../domain/entities/dashboard';

/**
 * Get Dashboards API Route
 * GET /api/analytics/dashboards
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const organizationId = searchParams.get('organizationId') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const status = searchParams.get('status') as DashboardStatus | undefined;
    const isPublic = searchParams.get('isPublic') === 'true' ? true :
                     searchParams.get('isPublic') === 'false' ? false : undefined;
    const isTemplate = searchParams.get('isTemplate') === 'true' ? true :
                      searchParams.get('isTemplate') === 'false' ? false : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Create query
    const query = new GetDashboardsQuery({
      organizationId,
      createdBy,
      status,
      isPublic,
      isTemplate,
      page,
      limit,
    });

    // TODO: Inject and execute use case
    // const useCase = container.get<GetDashboardsUseCase>('GetDashboardsUseCase');
    // const result = await useCase.execute(query);

    // if (!result.isSuccess) {
    //   return NextResponse.json(
    //     { error: result.error?.message || 'Failed to get dashboards' },
    //     { status: 400 }
    //   );
    // }

    // return NextResponse.json(result.value);

    // Temporary response until DI container is set up
    return NextResponse.json(
      {
        message: 'Get Dashboards API route created - DI container integration pending',
        filters: {
          organizationId: query.props.organizationId,
          createdBy: query.props.createdBy,
          status: query.props.status,
          isPublic: query.props.isPublic,
          isTemplate: query.props.isTemplate,
          page: query.props.page,
          limit: query.props.limit,
        },
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
