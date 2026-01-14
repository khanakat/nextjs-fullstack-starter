import { injectable } from 'inversify';
import { CommandHandler, Result } from '@/shared/application/base';
import { TestIntegrationCommand } from '../commands/test-integration-command';
import { ConnectionTestService } from '../../../../api/services/integrations/ConnectionTestService';
import { db } from '@/lib/db';

/**
 * Handler for testing integration connections
 */
@injectable()
export class TestIntegrationHandler extends CommandHandler<TestIntegrationCommand, Result<any>> {
  async handle(command: TestIntegrationCommand): Promise<Result<any>> {
    const { integrationId, connectionId, testCapabilities } = command.props;

    try {
      // Get integration with connections
      const integration = await db.integration.findFirst({
        where: {
          id: integrationId,
          organization: {
            members: {
              some: { userId: command.userId },
            },
          },
        },
        include: {
          connections: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!integration) {
        return Result.failure(new Error('Integration not found or access denied'));
      }

      // Determine which connection to test
      let targetConnectionId = connectionId;
      if (!targetConnectionId && integration.connections.length > 0) {
        targetConnectionId = integration.connections[0].id;
      }

      if (!targetConnectionId) {
        return Result.failure(new Error('No active connection found for this integration'));
      }

      // Test the connection
      const testResult = await ConnectionTestService.testStoredConnection(
        targetConnectionId,
        integration.organizationId
      );

      // If capabilities test is requested, run additional tests
      let capabilityResult = null;
      if (testCapabilities && testResult.success) {
        capabilityResult = await ConnectionTestService.testConnectionCapabilities(
          targetConnectionId,
          integration.organizationId
        );
      }

      return Result.success({
        connectionTest: testResult,
        capabilityTest: capabilityResult,
        connectionId: targetConnectionId,
        integrationId: integration.id,
      });
    } catch (error) {
      console.error('Error testing integration:', error);
      return Result.failure(new Error('Failed to test integration'));
    }
  }
}
