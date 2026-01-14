/**
 * DTO for Security Events operations
 */

export interface SecurityEventDto {
  id: string;
  organizationId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'investigating';
  description: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSecurityEventsRequest {
  organizationId?: string;
  page?: number;
  limit?: number;
}

export interface ListSecurityEventsResponse {
  events: SecurityEventDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateSecurityEventRequest {
  eventId: string;
  resolved: boolean;
}

export interface UpdateSecurityEventResponse {
  event: SecurityEventDto;
}
