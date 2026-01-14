export type ReportStatusDto = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ReportDto {
  id: string;
  title: string;
  description?: string;
  config: Record<string, any>;
  content?: any;
  status: ReportStatusDto;
  isPublic: boolean;
  templateId?: string;
  createdBy: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string | null;
}

export interface CreateReportDto {
  title: string;
  description?: string;
  config: Record<string, any>;
  isPublic?: boolean;
  templateId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateReportDto {
  title?: string;
  description?: string;
  config?: Record<string, any>;
  content?: any;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface PaginatedReportsDto {
  reports: ReportDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
