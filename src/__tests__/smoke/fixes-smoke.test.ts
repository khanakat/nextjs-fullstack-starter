import { describe, it, expect } from '@jest/globals';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { UserFactory } from '../factories/user-factory';
import { NextRequest } from 'next/server';
import { ScheduledReportsController } from '@/slices/reporting/presentation/controllers/scheduled-reports-controller';

// Minimal mock for ScheduledReportUseCase focusing only on getExecutionHistory
class MockScheduledReportUseCase {
  async getExecutionHistory(id: string, page: number, limit: number) {
    if (!id || typeof id !== 'string') {
      return { isSuccess: false, error: new Error('not found') };
    }
    const items = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `exec-${i + 1}`,
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - (i + 1) * 1000),
      finishedAt: new Date(Date.now() - i * 1000),
      durationMs: 1000,
      logs: [`run ${i + 1}`],
    }));
    return {
      isSuccess: true,
      value: {
        items,
        totalCount: 3,
        page,
        pageSize: limit,
        totalPages: 1,
      },
    };
  }
}

describe('Fixes Smoke Tests', () => {
  it('UniqueId accepts valid CUID values', () => {
    const valid = 'clhqr2k3z0000qzrmn4n4n4n4';
    const id = new UniqueId(valid);
    expect(id.id).toBe(valid);
    expect(UniqueId.isValid(valid)).toBe(true);
  });

  it('UserFactory generates a username string', () => {
    const user = UserFactory.create();
    expect(typeof user.username).toBe('string');
    expect(user.username.length).toBeGreaterThan(0);
  });

  it('ScheduledReportsController returns execution history JSON structure', async () => {
    const controller = new ScheduledReportsController(new MockScheduledReportUseCase() as any);
    const request = {
      url: 'http://localhost/api/scheduled-reports/abc/execution-history?page=1&limit=5',
      headers: new Headers(),
    } as any;
    const response = await controller.getExecutionHistory(request, { params: { id: 'abc' } });
    expect(response.status).toBe(200);
    const json = typeof (response as any).json === 'function'
      ? await (response as any).json()
      : JSON.parse(
          typeof (response as any).text === 'function'
            ? await (response as any).text()
            : String((response as any).body || '{}')
        );
    expect(Array.isArray(json.executions)).toBe(true);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(5);
    expect(json.total).toBeGreaterThanOrEqual(0);
  });
});
