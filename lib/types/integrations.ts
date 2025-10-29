export interface Integration {
  id: string;
  name: string;
  type: string;
  description?: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConnection {
  id: string;
  integrationId: string;
  userId: string;
  organizationId?: string;
  status: "active" | "inactive" | "error";
  config: Record<string, any>;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  action: string;
  status: "success" | "error" | "warning";
  requestData?: any;
  responseData?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}
