import { ReportManagementUseCase } from '../../../../../slices/reporting/application/use-cases/report-management-use-case';
import { CreateReportHandler } from '../../../../../slices/reporting/application/handlers/create-report-handler';
import { UpdateReportHandler } from '../../../../../slices/reporting/application/handlers/update-report-handler';
import { PublishReportHandler } from '../../../../../slices/reporting/application/handlers/publish-report-handler';
import { ArchiveReportHandler } from '../../../../../slices/reporting/application/handlers/archive-report-handler';
import { DeleteReportHandler } from '../../../../../slices/reporting/application/handlers/delete-report-handler';
import { GetReportHandler } from '../../../../../slices/reporting/application/query-handlers/get-report-handler';
import { GetReportsHandler } from '../../../../../slices/reporting/application/query-handlers/get-reports-handler';
import { CreateReportCommand } from '../../../../../slices/reporting/application/commands/create-report-command';
import { UpdateReportCommand } from '../../../../../slices/reporting/application/commands/update-report-command';
import { PublishReportCommand } from '../../../../../slices/reporting/application/commands/publish-report-command';
import { ArchiveReportCommand } from '../../../../../slices/reporting/application/commands/archive-report-command';
import { DeleteReportCommand } from '../../../../../slices/reporting/application/commands/delete-report-command';
import { GetReportQuery } from '../../../../../slices/reporting/application/queries/get-report-query';
import { GetReportsQuery } from '../../../../../slices/reporting/application/queries/get-reports-query';
import { Result } from '../../../../../shared/application/base/result';
import { PaginatedResult } from '../../../../../shared/application/base/paginated-result';
import { ReportDto } from '../../../../../slices/reporting/application/dtos/report-dto';
import { ReportFactory } from '../../../factories/report-factory';

describe('ReportManagementUseCase', () => {
  let useCase: ReportManagementUseCase;
  let mockCreateHandler: jest.Mocked<CreateReportHandler>;
  let mockUpdateHandler: jest.Mocked<UpdateReportHandler>;
  let mockPublishHandler: jest.Mocked<PublishReportHandler>;
  let mockArchiveHandler: jest.Mocked<ArchiveReportHandler>;
  let mockDeleteHandler: jest.Mocked<DeleteReportHandler>;
  let mockGetReportHandler: jest.Mocked<GetReportHandler>;
  let mockGetReportsHandler: jest.Mocked<GetReportsHandler>;

  beforeEach(() => {
    // Create mocked handlers
    mockCreateHandler = {
      handle: jest.fn(),
    } as any;

    mockUpdateHandler = {
      handle: jest.fn(),
    } as any;

    mockPublishHandler = {
      handle: jest.fn(),
    } as any;

    mockArchiveHandler = {
      handle: jest.fn(),
    } as any;

    mockDeleteHandler = {
      handle: jest.fn(),
    } as any;

    mockGetReportHandler = {
      handle: jest.fn(),
    } as any;

    mockGetReportsHandler = {
      handle: jest.fn(),
    } as any;

    // Create use case with mocked dependencies
    useCase = new ReportManagementUseCase(
      mockCreateHandler,
      mockUpdateHandler,
      mockPublishHandler,
      mockArchiveHandler,
      mockDeleteHandler,
      mockGetReportHandler,
      mockGetReportsHandler
    );
  });

  describe('createReport', () => {
    it('should create report successfully', async () => {
      const command = new CreateReportCommand({
        title: 'Test Report',
        description: 'Test Description',
        config: { filters: {} },
        createdBy: 'user-123',
        organizationId: 'org-123',
      });

      const expectedReport = ReportFactory.createDto();
      mockCreateHandler.handle.mockResolvedValue(Result.success(expectedReport));

      // Mock command validation
      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.createReport(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedReport);
      expect(mockCreateHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when command validation fails', async () => {
      const command = new CreateReportCommand({
        title: '',
        description: 'Test Description',
        config: { filters: {} },
        createdBy: 'user-123',
        organizationId: 'org-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.failure('Title is required'));

      const result = await useCase.createReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Title is required');
      expect(mockCreateHandler.handle).not.toHaveBeenCalled();
    });

    it('should fail when handler returns error', async () => {
      const command = new CreateReportCommand({
        title: 'Test Report',
        description: 'Test Description',
        config: { filters: {} },
        createdBy: 'user-123',
        organizationId: 'org-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));
      mockCreateHandler.handle.mockResolvedValue(Result.failure('Database error'));

      const result = await useCase.createReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateReport', () => {
    it('should update report successfully', async () => {
      const command = new UpdateReportCommand({
        id: 'report-123',
        title: 'Updated Report',
        description: 'Updated Description',
        updatedBy: 'user-123',
      });

      const expectedReport = ReportFactory.createDto({ title: 'Updated Report' });
      mockUpdateHandler.handle.mockResolvedValue(Result.success(expectedReport));

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.updateReport(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedReport);
      expect(mockUpdateHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when command validation fails', async () => {
      const command = new UpdateReportCommand({
        id: '',
        title: 'Updated Report',
        updatedBy: 'user-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.failure('Report ID is required'));

      const result = await useCase.updateReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Report ID is required');
      expect(mockUpdateHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('publishReport', () => {
    it('should publish report successfully', async () => {
      const command = new PublishReportCommand({
        id: 'report-123',
        publishedBy: 'user-123',
      });

      const expectedReport = ReportFactory.createDto({ status: 'published' });
      mockPublishHandler.handle.mockResolvedValue(Result.success(expectedReport));

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.publishReport(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedReport);
      expect(mockPublishHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when handler returns error', async () => {
      const command = new PublishReportCommand({
        id: 'report-123',
        publishedBy: 'user-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));
      mockPublishHandler.handle.mockResolvedValue(Result.failure('Report not ready for publishing'));

      const result = await useCase.publishReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Report not ready for publishing');
    });
  });

  describe('archiveReport', () => {
    it('should archive report successfully', async () => {
      const command = new ArchiveReportCommand({
        id: 'report-123',
        archivedBy: 'user-123',
      });

      const expectedReport = ReportFactory.createDto({ status: 'archived' });
      mockArchiveHandler.handle.mockResolvedValue(Result.success(expectedReport));

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.archiveReport(command);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedReport);
      expect(mockArchiveHandler.handle).toHaveBeenCalledWith(command);
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      const command = new DeleteReportCommand({
        id: 'report-123',
        deletedBy: 'user-123',
      });

      mockDeleteHandler.handle.mockResolvedValue(Result.success(undefined));

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.deleteReport(command);

      expect(result.isSuccess).toBe(true);
      expect(mockDeleteHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when report cannot be deleted', async () => {
      const command = new DeleteReportCommand({
        id: 'report-123',
        deletedBy: 'user-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));
      mockDeleteHandler.handle.mockResolvedValue(Result.failure('Cannot delete published report'));

      const result = await useCase.deleteReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Cannot delete published report');
    });
  });

  describe('getReport', () => {
    it('should get report successfully', async () => {
      const query = new GetReportQuery({
        id: 'report-123',
        userId: 'user-123',
      });

      const expectedReport = ReportFactory.createDto();
      mockGetReportHandler.handle.mockResolvedValue(Result.success(expectedReport));

      jest.spyOn(query, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.getReport(query);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedReport);
      expect(mockGetReportHandler.handle).toHaveBeenCalledWith(query);
    });

    it('should fail when report not found', async () => {
      const query = new GetReportQuery({
        id: 'nonexistent-report',
        userId: 'user-123',
      });

      jest.spyOn(query, 'validate').mockReturnValue(Result.success(undefined));
      mockGetReportHandler.handle.mockResolvedValue(Result.failure('Report not found'));

      const result = await useCase.getReport(query);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Report not found');
    });
  });

  describe('getReports', () => {
    it('should get reports successfully', async () => {
      const query = new GetReportsQuery({
        userId: 'user-123',
        organizationId: 'org-123',
        page: 1,
        limit: 10,
      });

      const reports = [
        ReportFactory.createDto(),
        ReportFactory.createDto(),
      ];
      const paginatedResult = new PaginatedResult(reports, 2, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      jest.spyOn(query, 'validate').mockReturnValue(Result.success(undefined));

      const result = await useCase.getReports(query);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(2);
      expect(result.value.totalCount).toBe(2);
      expect(mockGetReportsHandler.handle).toHaveBeenCalledWith(query);
    });
  });

  describe('getReportsByStatus', () => {
    it('should get reports by status successfully', async () => {
      const reports = [ReportFactory.createDto({ status: 'draft' })];
      const paginatedResult = new PaginatedResult(reports, 1, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.getReportsByStatus('draft', 'user-123', 'org-123', 1, 10);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0].status).toBe('draft');
    });
  });

  describe('getUserReports', () => {
    it('should get user reports successfully', async () => {
      const reports = [
        ReportFactory.createDto({ createdBy: 'user-123' }),
        ReportFactory.createDto({ createdBy: 'user-123' }),
      ];
      const paginatedResult = new PaginatedResult(reports, 2, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.getUserReports('user-123', 'org-123', 1, 10);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(2);
      expect(result.value.items.every(r => r.createdBy === 'user-123')).toBe(true);
    });
  });

  describe('getPublicReports', () => {
    it('should get public reports successfully', async () => {
      const reports = [ReportFactory.createDto({ isPublic: true })];
      const paginatedResult = new PaginatedResult(reports, 1, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.getPublicReports('org-123', 1, 10);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0].isPublic).toBe(true);
    });
  });

  describe('searchReports', () => {
    it('should search reports successfully', async () => {
      const reports = [ReportFactory.createDto({ title: 'Sales Report' })];
      const paginatedResult = new PaginatedResult(reports, 1, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.searchReports('Sales', 'user-123', 'org-123', 1, 10);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0].title).toContain('Sales');
    });
  });

  describe('getReportsInDateRange', () => {
    it('should get reports in date range successfully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const reports = [ReportFactory.createDto()];
      const paginatedResult = new PaginatedResult(reports, 1, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.getReportsInDateRange(startDate, endDate, 'user-123', 'org-123', 1, 10);

      expect(result.isSuccess).toBe(true);
      expect(result.value.items).toHaveLength(1);
    });
  });

  describe('getReportStatistics', () => {
    it('should get report statistics successfully', async () => {
      const reports = [
        ReportFactory.createDto({ status: 'published' }),
        ReportFactory.createDto({ status: 'draft' }),
        ReportFactory.createDto({ status: 'archived' }),
      ];
      const paginatedResult = new PaginatedResult(reports, 3, 1, 10);
      mockGetReportsHandler.handle.mockResolvedValue(Result.success(paginatedResult));

      const result = await useCase.getReportStatistics('user-123', 'org-123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalReports).toBe(3);
      expect(result.value.publishedReports).toBe(1);
      expect(result.value.draftReports).toBe(1);
      expect(result.value.archivedReports).toBe(1);
      expect(result.value.recentActivity).toBeDefined();
    });
  });

  describe('duplicateReport', () => {
    it('should duplicate report successfully', async () => {
      const originalReport = ReportFactory.createDto({ title: 'Original Report' });
      const duplicatedReport = ReportFactory.createDto({ title: 'Copy of Original Report' });

      mockGetReportHandler.handle.mockResolvedValue(Result.success(originalReport));
      mockCreateHandler.handle.mockResolvedValue(Result.success(duplicatedReport));

      const result = await useCase.duplicateReport('report-123', 'user-123', 'Copy of Original Report');

      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('Copy of Original Report');
      expect(mockGetReportHandler.handle).toHaveBeenCalled();
      expect(mockCreateHandler.handle).toHaveBeenCalled();
    });

    it('should fail when original report not found', async () => {
      mockGetReportHandler.handle.mockResolvedValue(Result.failure('Report not found'));

      const result = await useCase.duplicateReport('nonexistent-report', 'user-123');

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Report not found');
      expect(mockCreateHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle handler exceptions gracefully', async () => {
      const command = new CreateReportCommand({
        title: 'Test Report',
        description: 'Test Description',
        config: { filters: {} },
        createdBy: 'user-123',
        organizationId: 'org-123',
      });

      jest.spyOn(command, 'validate').mockReturnValue(Result.success(undefined));
      mockCreateHandler.handle.mockRejectedValue(new Error('Unexpected error'));

      const result = await useCase.createReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle validation exceptions', async () => {
      const command = new CreateReportCommand({
        title: 'Test Report',
        description: 'Test Description',
        config: { filters: {} },
        createdBy: 'user-123',
        organizationId: 'org-123',
      });

      jest.spyOn(command, 'validate').mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = await useCase.createReport(command);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Validation error');
    });
  });
});