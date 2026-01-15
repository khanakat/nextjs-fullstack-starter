import { injectable } from 'inversify';
import { Result } from '@/shared/application/base/result';
import { GetSecurityMetricsQuery } from '@/slices/security/application/queries/security-metrics-queries';

/**
 * Get Security Metrics Handler
 */
@injectable()
export class GetSecurityMetricsHandler {
  async handle(query: GetSecurityMetricsQuery): Promise<Result<any>> {
    try {
      const { SecurityService } = await import('@/lib/services/security-service');

      const metrics = await SecurityService.getSecurityMetrics(
        query.organizationId,
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      );

      return Result.success({
        metrics,
        range: query.range,
        organizationId: query.organizationId,
        timeRange: {
          start: query.startDate.toISOString(),
          end: query.endDate.toISOString(),
        },
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to get security metrics'),
      );
    }
  }
}
