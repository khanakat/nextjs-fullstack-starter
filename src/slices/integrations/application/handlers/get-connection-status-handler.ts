import { injectable } from 'inversify';
import { Handler, Result } from '@/shared/domain/handler';
import { GetConnectionStatusQuery } from '../../queries/get-connection-status-query';
import { prisma } from '@/lib/db';

/**
 * Handler for getting connection status
 */
@injectable()
export class GetConnectionStatusHandler implements Handler<GetConnectionStatusQuery, Result<any>> {
  async handle(query: GetConnectionStatusQuery): Promise<Result<any>> {
    const { integrationId, organizationId } = query.props;

    try {
      // Get integration with connections
      const integration = await prisma.integration.findFirst({
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
        return Result.fail('Integration not found');
      }

      const connections = integration.connections.map((connection) => ({
        id: connection.id,
        status: connection.status,
        connectionType: connection.connectionType,
        lastConnected: connection.lastConnected,
        createdAt: connection.createdAt,
      }));

      return Result.ok({
        integrationId: integration.id,
        status: integration.status,
        connections,
        hasActiveConnection: connections.some((c) => c.status === 'active' || c.status === 'connected'),
      });
    } catch (error) {
      console.error('Error getting connection status:', error);
      return Result.fail('Failed to get connection status');
    }
  }
}
