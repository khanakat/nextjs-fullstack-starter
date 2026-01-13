import { Report } from '../entities/report';
import { ReportId } from '../value-objects/report-id';

/**
 * Report Repository Interface
 * Defines the contract for report data access
 */
export interface IReportRepository {
  /**
   * Save a report (create or update)
   */
  save(report: Report): Promise<void>;

  /**
   * Find report by ID
   */
  findById(id: ReportId): Promise<Report | null>;

  /**
   * Find reports by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<Report[]>;

  /**
   * Find reports by status
   */
  findByStatus(status: string): Promise<Report[]>;

  /**
   * Find reports by template ID
   */
  findByTemplateId(templateId: string): Promise<Report[]>;

  /**
   * Find reports by created by user
   */
  findByCreatedBy(createdBy: string): Promise<Report[]>;

  /**
   * Find public reports
   */
  findPublicReports(): Promise<Report[]>;

  /**
   * Find all reports with pagination and filters
   */
  findAll(limit?: number, offset?: number, filters?: ReportFilters): Promise<Report[]>;

  /**
   * Count reports with filters
   */
  count(filters?: ReportFilters): Promise<number>;

  /**
   * Check if report exists
   */
  exists(id: ReportId): Promise<boolean>;

  /**
   * Delete a report
   */
  delete(id: ReportId): Promise<void>;
}

/**
 * Report Filters Interface
 */
export interface ReportFilters {
  organizationId?: string;
  status?: string;
  templateId?: string;
  createdBy?: string;
  isPublic?: boolean;
}
