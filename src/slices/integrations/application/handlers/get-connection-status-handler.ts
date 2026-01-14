import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { GetConnectionStatusQuery } from '../../queries/get-connection-status-query';
import { db } from '@/lib/db';

/**
 * Handler for getting connection status
 */
@injectable()
export class GetConnectionStatusHandler extends CommandHandler<GetConnectionStatusQuery, Result<any>> {
  async handle(query: GetConnectionStatusQuery): Promise<Result<any>> {
    const { integrationId, organizationId } = query.props;

    try {
      // Get integration with connections
      const integration = await db.integration.findFirst({
        where: {
          id: integrationId,
          organizationId,
        },
        include: {
          connections: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!integration) {
        return Result.failure(new Error('Integration not found'));
      }

      const connections = integration.connections.map((connection) => ({
        id: connection.id,
        status: connection.status,
        connectionType: connection.connectionType,
        lastConnected: connection.lastConnected,
        createdAt: connection.createdAt,
      }));

      return Result.success({
        integrationId: integration.id,
        status: integration.status,
        connections,
        hasActiveConnection: connections.some((c) => c.status === 'active' || c.status === 'connected'),
      });
    } catch (error) {
      console.error('Error getting connection status:', error);
      return Result.failure(new Error('Failed to get connection status'));
    }
  }
}
