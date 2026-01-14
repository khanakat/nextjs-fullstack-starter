import { injectable } from 'inversify';
import { QueryHandler, Result } from '@/shared/application/base';

/**
 * TODO: Implement GetScheduledReportStatsHandler
 * Placeholder to prevent TypeScript compilation errors
 */
@injectable()
export class GetScheduledReportStatsHandler extends QueryHandler<any, Result<any>> {
  async handle(query: any): Promise<Result<any>> {
    return Result.success({ totalReports: 0, activeReports: 0 });
  }
}
