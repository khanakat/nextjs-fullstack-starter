export interface ReportDataDto {
  reportId: string;
  data: any;
  format: 'json' | 'csv' | 'pdf';
  generatedAt: string;
}

export interface ReportConfigDto {
  type: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
  };
}
