import { injectable } from 'inversify';
import { QueryHandler, Result } from '@/shared/application/base';

/**
 * TODO: Implement GetScheduledReportRunsHandler
 * Placeholder to prevent TypeScript compilation errors
 */
@injectable()
export class GetScheduledReportRunsHandler extends QueryHandler<any, Result<any>> {
  async handle(query: any): Promise<Result<any>> {
    return Result.success({ runs: [], total: 0 });
  }
}
