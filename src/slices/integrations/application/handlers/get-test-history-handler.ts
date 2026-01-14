import { injectable } from 'inversify';
import { Handler, Result } from '@/shared/application/base/handler';
import { GetTestHistoryQuery } from '../../queries/get-test-history-query';
import { ConnectionTestService } from '../../../../api/services/integrations/ConnectionTestService';
import { db } from '@/lib/db';

/**
 * Handler for getting test history
 */
@injectable()
export class GetTestHistoryHandler implements Handler<GetTestHistoryQuery, Result<any>> {
  async handle(query: GetTestHistoryQuery): Promise<Result<any>> {
    const { integrationId, connectionId, limit = 50 } = query.props;

    try {
      // Get integration with connections
      const integration = await db.integration.findFirst({
        where: { id: integrationId },
        include: {
          connections: true,
        },
      });

      if (!integration) {
        return Result.fail('Integration not found');
      }

      // Get test history
      let testHistory = [];
      if (connectionId) {
        // Get history for specific connection
        testHistory = await ConnectionTestService.getTestHistory(
          connectionId,
          integration.organizationId,
          limit
        );
      } else {
        // Get history for all connections of this integration
        for (const connection of integration.connections) {
          const history = await ConnectionTestService.getTestHistory(
            connection.id,
            integration.organizationId,
            Math.ceil(limit / integration.connections.length)
          );
          testHistory.push(
            ...history.map((h) => ({ ...h, connectionId: connection.id }))
          );
        }

        // Sort by timestamp and limit
        testHistory = testHistory
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
      }

      return Result.ok({
        integrationId: integration.id,
        testHistory,
        connections: integration.connections.map((c) => ({
          id: c.id,
          status: c.status,
          connectionType: c.connectionType,
          lastConnected: c.lastConnected,
        })),
      });
    } catch (error) {
      console.error('Error getting test history:', error);
      return Result.fail('Failed to get test history');
    }
  }
}
