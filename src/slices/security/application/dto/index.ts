/**
 * TODO: Implement security DTOs
 * Placeholder to prevent TypeScript compilation errors
 */

export class ApiKeyPermission {
  static READ = 'READ';
  static WRITE = 'WRITE';
  static ADMIN = 'ADMIN';
}

export interface ApiKeyDto {
  id: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface SecurityEventDto {
  id: string;
  type: string;
  userId: string;
  timestamp: Date;
  details: any;
}
