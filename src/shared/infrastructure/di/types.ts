/**
 * Dependency Injection Types
 * Defines all service identifiers for the IoC container
 */

// Database
export const TYPES = {
  // Database
  PrismaClient: Symbol.for('PrismaClient'),
  UnitOfWork: Symbol.for('UnitOfWork'),

  // Event Bus
  EventBus: Symbol.for('EventBus'),

  // Authentication
  UserRepository: Symbol.for('UserRepository'),
  SessionRepository: Symbol.for('SessionRepository'),
  MfaDeviceRepository: Symbol.for('MfaDeviceRepository'),
  AuthTokenRepository: Symbol.for('AuthTokenRepository'),
  AuthService: Symbol.for('AuthService'),
  PasswordService: Symbol.for('PasswordService'),
  MfaService: Symbol.for('MfaService'),
  SessionService: Symbol.for('SessionService'),

  // Authentication - Handlers
  RegisterUserHandler: Symbol.for('RegisterUserHandler'),
  LoginHandler: Symbol.for('LoginHandler'),
  LogoutHandler: Symbol.for('LogoutHandler'),
  ChangePasswordHandler: Symbol.for('ChangePasswordHandler'),
  VerifyEmailHandler: Symbol.for('VerifyEmailHandler'),
  RequestPasswordResetHandler: Symbol.for('RequestPasswordResetHandler'),
  ResetPasswordHandler: Symbol.for('ResetPasswordHandler'),
  EnableMfaHandler: Symbol.for('EnableMfaHandler'),
  VerifyMfaHandler: Symbol.for('VerifyMfaHandler'),
  DisableMfaHandler: Symbol.for('DisableMfaHandler'),
  GetUserHandler: Symbol.for('GetUserHandler'),
  GetUsersHandler: Symbol.for('GetUsersHandler'),
  GetCurrentUserHandler: Symbol.for('GetCurrentUserHandler'),
  GetSessionsHandler: Symbol.for('GetSessionsHandler'),
  GetMfaDevicesHandler: Symbol.for('GetMfaDevicesHandler'),

  // Authentication - Use Cases
  RegisterUseCase: Symbol.for('RegisterUseCase'),
  LoginUseCase: Symbol.for('LoginUseCase'),
  LogoutUseCase: Symbol.for('LogoutUseCase'),
  ChangePasswordUseCase: Symbol.for('ChangePasswordUseCase'),
  VerifyEmailUseCase: Symbol.for('VerifyEmailUseCase'),
  ResetPasswordUseCase: Symbol.for('ResetPasswordUseCase'),
  MfaUseCase: Symbol.for('MfaUseCase'),
  SessionUseCase: Symbol.for('SessionUseCase'),

  // Authentication - Controllers
  AuthController: Symbol.for('AuthController'),
  MfaController: Symbol.for('MfaController'),
  SessionController: Symbol.for('SessionController'),

  // User Management
  CreateUserHandler: Symbol.for('CreateUserHandler'),
  UpdateUserHandler: Symbol.for('UpdateUserHandler'),
  UsersController: Symbol.for('UsersController'),

  // Organizations
  OrganizationRepository: Symbol.for('OrganizationRepository'),
  CreateOrganizationHandler: Symbol.for('CreateOrganizationHandler'),
  UpdateOrganizationHandler: Symbol.for('UpdateOrganizationHandler'),
  DeleteOrganizationHandler: Symbol.for('DeleteOrganizationHandler'),
  GetOrganizationHandler: Symbol.for('GetOrganizationHandler'),
  GetOrganizationsHandler: Symbol.for('GetOrganizationsHandler'),
  CreateOrganizationUseCase: Symbol.for('CreateOrganizationUseCase'),
  UpdateOrganizationUseCase: Symbol.for('UpdateOrganizationUseCase'),
  DeleteOrganizationUseCase: Symbol.for('DeleteOrganizationUseCase'),
  GetOrganizationUseCase: Symbol.for('GetOrganizationUseCase'),
  GetOrganizationsUseCase: Symbol.for('GetOrganizationsUseCase'),
  OrganizationsController: Symbol.for('OrganizationsController'),

  // Analytics
  DashboardRepository: Symbol.for('DashboardRepository'),
  CreateDashboardHandler: Symbol.for('CreateDashboardHandler'),
  UpdateDashboardHandler: Symbol.for('UpdateDashboardHandler'),
  DeleteDashboardHandler: Symbol.for('DeleteDashboardHandler'),
  GetDashboardHandler: Symbol.for('GetDashboardHandler'),
  GetDashboardsHandler: Symbol.for('GetDashboardsHandler'),
  CreateDashboardUseCase: Symbol.for('CreateDashboardUseCase'),
  UpdateDashboardUseCase: Symbol.for('UpdateDashboardUseCase'),
  DeleteDashboardUseCase: Symbol.for('DeleteDashboardUseCase'),
  GetDashboardUseCase: Symbol.for('GetDashboardUseCase'),
  GetDashboardsUseCase: Symbol.for('GetDashboardsUseCase'),
  DashboardsController: Symbol.for('DashboardsController'),

  // Workflows
  WorkflowRepository: Symbol.for('WorkflowRepository'),
  CreateWorkflowHandler: Symbol.for('CreateWorkflowHandler'),
  UpdateWorkflowHandler: Symbol.for('UpdateWorkflowHandler'),
  DeleteWorkflowHandler: Symbol.for('DeleteWorkflowHandler'),
  GetWorkflowHandler: Symbol.for('GetWorkflowHandler'),
  GetWorkflowsHandler: Symbol.for('GetWorkflowsHandler'),
  CreateWorkflowUseCase: Symbol.for('CreateWorkflowUseCase'),
  UpdateWorkflowUseCase: Symbol.for('UpdateWorkflowUseCase'),
  DeleteWorkflowUseCase: Symbol.for('DeleteWorkflowUseCase'),
  GetWorkflowUseCase: Symbol.for('GetWorkflowUseCase'),
  GetWorkflowsUseCase: Symbol.for('GetWorkflowsUseCase'),
  WorkflowsApiController: Symbol.for('WorkflowsApiController'),

  // Workflow Instances
  WorkflowInstanceRepository: Symbol.for('WorkflowInstanceRepository'),
  CreateWorkflowInstanceHandler: Symbol.for('CreateWorkflowInstanceHandler'),
  UpdateWorkflowInstanceHandler: Symbol.for('UpdateWorkflowInstanceHandler'),
  PerformWorkflowActionHandler: Symbol.for('PerformWorkflowActionHandler'),
  ExecuteWorkflowHandler: Symbol.for('ExecuteWorkflowHandler'),
  GetWorkflowInstanceHandler: Symbol.for('GetWorkflowInstanceHandler'),
  ListWorkflowInstancesHandler: Symbol.for('ListWorkflowInstancesHandler'),
  WorkflowInstancesApiController: Symbol.for('WorkflowInstancesApiController'),

  // Workflow Tasks
  WorkflowTaskRepository: Symbol.for('WorkflowTaskRepository'),
  UpdateWorkflowTaskHandler: Symbol.for('UpdateWorkflowTaskHandler'),
  CompleteWorkflowTaskHandler: Symbol.for('CompleteWorkflowTaskHandler'),
  GetWorkflowTaskHandler: Symbol.for('GetWorkflowTaskHandler'),
  ListWorkflowTasksHandler: Symbol.for('ListWorkflowTasksHandler'),
  WorkflowTasksApiController: Symbol.for('WorkflowTasksApiController'),

  // Workflow Templates
  WorkflowTemplateRepository: Symbol.for('WorkflowTemplateRepository'),
  CreateWorkflowTemplateHandler: Symbol.for('CreateWorkflowTemplateHandler'),
  GetWorkflowTemplateHandler: Symbol.for('GetWorkflowTemplateHandler'),
  ListWorkflowTemplatesHandler: Symbol.for('ListWorkflowTemplatesHandler'),
  WorkflowTemplatesApiController: Symbol.for('WorkflowTemplatesApiController'),

  // Integrations
  IntegrationRepository: Symbol.for('IntegrationRepository'),
  CreateIntegrationHandler: Symbol.for('CreateIntegrationHandler'),
  UpdateIntegrationHandler: Symbol.for('UpdateIntegrationHandler'),
  DeleteIntegrationHandler: Symbol.for('DeleteIntegrationHandler'),
  GetIntegrationHandler: Symbol.for('GetIntegrationHandler'),
  GetIntegrationsHandler: Symbol.for('GetIntegrationsHandler'),
  SyncIntegrationHandler: Symbol.for('SyncIntegrationHandler'),
  CreateIntegrationUseCase: Symbol.for('CreateIntegrationUseCase'),
  UpdateIntegrationUseCase: Symbol.for('UpdateIntegrationUseCase'),
  DeleteIntegrationUseCase: Symbol.for('DeleteIntegrationUseCase'),
  GetIntegrationUseCase: Symbol.for('GetIntegrationUseCase'),
  GetIntegrationsUseCase: Symbol.for('GetIntegrationsUseCase'),
  IntegrationsApiController: Symbol.for('IntegrationsApiController'),

  // Integration Templates
  IntegrationTemplateRepository: Symbol.for('IntegrationTemplateRepository'),
  ListTemplatesHandler: Symbol.for('ListTemplatesHandler'),
  CreateIntegrationFromTemplateHandler: Symbol.for('CreateIntegrationFromTemplateHandler'),
  IntegrationTemplatesApiController: Symbol.for('IntegrationTemplatesApiController'),

  // Webhooks
  WebhookRepository: Symbol.for('WebhookRepository'),
  WebhookEventRepository: Symbol.for('WebhookEventRepository'),
  TestWebhookHandler: Symbol.for('TestWebhookHandler'),
  GetWebhookStatsHandler: Symbol.for('GetWebhookStatsHandler'),
  ListWebhooksHandler: Symbol.for('ListWebhooksHandler'),
  CreateWebhookHandler: Symbol.for('CreateWebhookHandler'),
  UpdateWebhookHandler: Symbol.for('UpdateWebhookHandler'),
  DeleteWebhookHandler: Symbol.for('DeleteWebhookHandler'),
  GetWebhookHandler: Symbol.for('GetWebhookHandler'),
  GetWebhookDeliveriesHandler: Symbol.for('GetWebhookDeliveriesHandler'),
  ProcessWebhookHandler: Symbol.for('ProcessWebhookHandler'),
  WebhooksApiController: Symbol.for('WebhooksApiController'),

  // Integration Connections
  ConnectIntegrationHandler: Symbol.for('ConnectIntegrationHandler'),
  DisconnectIntegrationHandler: Symbol.for('DisconnectIntegrationHandler'),
  HandleOAuthCallbackHandler: Symbol.for('HandleOAuthCallbackHandler'),
  GetConnectionStatusHandler: Symbol.for('GetConnectionStatusHandler'),
  TestIntegrationHandler: Symbol.for('TestIntegrationHandler'),
  GetTestHistoryHandler: Symbol.for('GetTestHistoryHandler'),

  // Reporting
  ReportRepository: Symbol.for('ReportRepository'),
  ReportTemplateRepository: Symbol.for('ReportTemplateRepository'),
  ScheduledReportRepository: Symbol.for('ScheduledReportRepository'),

  // Reporting - Handlers
  CreateReportHandler: Symbol.for('CreateReportHandler'),
  UpdateReportHandler: Symbol.for('UpdateReportHandler'),
  PublishReportHandler: Symbol.for('PublishReportHandler'),
  ArchiveReportHandler: Symbol.for('ArchiveReportHandler'),
  DeleteReportHandler: Symbol.for('DeleteReportHandler'),
  GetReportHandler: Symbol.for('GetReportHandler'),
  GetReportsHandler: Symbol.for('GetReportsHandler'),
  CreateTemplateHandler: Symbol.for('CreateTemplateHandler'),
  GetTemplateHandler: Symbol.for('GetTemplateHandler'),
  GetTemplatesHandler: Symbol.for('GetTemplatesHandler'),
  CreateScheduledReportHandler: Symbol.for('CreateScheduledReportHandler'),
  GetScheduledReportHandler: Symbol.for('GetScheduledReportHandler'),
  GetScheduledReportsHandler: Symbol.for('GetScheduledReportsHandler'),
  ActivateScheduledReportHandler: Symbol.for('ActivateScheduledReportHandler'),
  CancelScheduledReportHandler: Symbol.for('CancelScheduledReportHandler'),
  ExecuteScheduledReportHandler: Symbol.for('ExecuteScheduledReportHandler'),
  GetScheduledReportRunsHandler: Symbol.for('GetScheduledReportRunsHandler'),
  GetScheduledReportStatsHandler: Symbol.for('GetScheduledReportStatsHandler'),

  // Reporting - Use Cases
  ReportManagementUseCase: Symbol.for('ReportManagementUseCase'),
  TemplateManagementUseCase: Symbol.for('TemplateManagementUseCase'),
  ScheduledReportUseCase: Symbol.for('ScheduledReportUseCase'),

  // Reporting - Services
  ReportExportService: Symbol.for('ReportExportService'),
  ReportOrchestrationService: Symbol.for('ReportOrchestrationService'),
  ReportSchedulerService: Symbol.for('ReportSchedulerService'),

  // Reporting - Controllers
  ReportsController: Symbol.for('ReportsController'),
  TemplatesController: Symbol.for('TemplatesController'),
  ScheduledReportsController: Symbol.for('ScheduledReportsController'),
  ExportsController: Symbol.for('ExportsController'),
  ExportsApiController: Symbol.for('ExportsApiController'),

  // Reporting - Export Handlers
  CreateExportJobHandler: Symbol.for('CreateExportJobHandler'),
  CancelExportJobHandler: Symbol.for('CancelExportJobHandler'),
  RetryExportJobHandler: Symbol.for('RetryExportJobHandler'),
  DeleteExportJobHandler: Symbol.for('DeleteExportJobHandler'),
  BulkDeleteExportJobsHandler: Symbol.for('BulkDeleteExportJobsHandler'),
  GenerateDirectExportHandler: Symbol.for('GenerateDirectExportHandler'),
  GetExportJobHandler: Symbol.for('GetExportJobHandler'),
  GetExportJobsHandler: Symbol.for('GetExportJobsHandler'),
  DownloadExportFileHandler: Symbol.for('DownloadExportFileHandler'),

  // Reporting - Export Repository
  ExportJobRepository: Symbol.for('ExportJobRepository'),

  // Notifications
  NotificationRepository: Symbol.for('NotificationRepository'),
  NotificationPreferencesRepository: Symbol.for('NotificationPreferencesRepository'),
  NotificationRoutingService: Symbol.for('NotificationRoutingService'),
  NotificationDeliveryService: Symbol.for('NotificationDeliveryService'),
  NotificationService: Symbol.for('NotificationService'),
  CreateNotificationHandler: Symbol.for('CreateNotificationHandler'),
  MarkNotificationReadHandler: Symbol.for('MarkNotificationReadHandler'),
  DeleteNotificationHandler: Symbol.for('DeleteNotificationHandler'),
  MarkAllNotificationsReadHandler: Symbol.for('MarkAllNotificationsReadHandler'),
  DeleteOldNotificationsHandler: Symbol.for('DeleteOldNotificationsHandler'),
  GetNotificationHandler: Symbol.for('GetNotificationHandler'),
  ListNotificationsHandler: Symbol.for('ListNotificationsHandler'),
  GetUnreadCountHandler: Symbol.for('GetUnreadCountHandler'),
  SendNotificationUseCase: Symbol.for('SendNotificationUseCase'),
  GetNotificationsUseCase: Symbol.for('GetNotificationsUseCase'),
  MarkNotificationReadUseCase: Symbol.for('MarkNotificationReadUseCase'),
  UpdateNotificationPreferencesUseCase: Symbol.for('UpdateNotificationPreferencesUseCase'),
  SSENotificationStreamingService: Symbol.for('SSENotificationStreamingService'),
  EmailNotificationService: Symbol.for('EmailNotificationService'),
  NotificationsController: Symbol.for('NotificationsController'),
  PreferencesController: Symbol.for('PreferencesController'),

  // External Services
  EmailService: Symbol.for('EmailService'),
  FileStorageService: Symbol.for('FileStorageService'),
  PDFGenerationService: Symbol.for('PDFGenerationService'),

  // Files
  FileRepository: Symbol.for('FileRepository'),
  UploadFileHandler: Symbol.for('UploadFileHandler'),
  DeleteFileHandler: Symbol.for('DeleteFileHandler'),
  UpdateFileUrlHandler: Symbol.for('UpdateFileUrlHandler'),
  DeleteManyFilesHandler: Symbol.for('DeleteManyFilesHandler'),
  GetFileHandler: Symbol.for('GetFileHandler'),
  ListFilesHandler: Symbol.for('ListFilesHandler'),
  GetFileStatisticsHandler: Symbol.for('GetFileStatisticsHandler'),

  // Settings
  SettingRepository: Symbol.for('SettingRepository'),
  CreateSettingHandler: Symbol.for('CreateSettingHandler'),
  UpdateSettingHandler: Symbol.for('UpdateSettingHandler'),
  DeleteSettingHandler: Symbol.for('DeleteSettingHandler'),
  GetSettingHandler: Symbol.for('GetSettingHandler'),
  ListSettingsHandler: Symbol.for('ListSettingsHandler'),
  GetSettingsHandler: Symbol.for('GetSettingsHandler'),

  // Audit
  AuditLogRepository: Symbol.for('AuditLogRepository'),
  CreateAuditLogHandler: Symbol.for('CreateAuditLogHandler'),
  UpdateAuditLogHandler: Symbol.for('UpdateAuditLogHandler'),
  DeleteAuditLogHandler: Symbol.for('DeleteAuditLogHandler'),
  GetAuditLogHandler: Symbol.for('GetAuditLogHandler'),
  ListAuditLogsHandler: Symbol.for('ListAuditLogsHandler'),
  GetAuditLogsHandler: Symbol.for('GetAuditLogsHandler'),
  GetAuditStatisticsHandler: Symbol.for('GetAuditStatisticsHandler'),
  AuditApiController: Symbol.for('AuditApiController'),

  // Email
  EmailApiController: Symbol.for('EmailApiController'),
  EmailListsApiController: Symbol.for('EmailListsApiController'),
  EmailTemplatesApiController: Symbol.for('EmailTemplatesApiController'),

  // Mobile
  RegisterDeviceHandler: Symbol.for('RegisterDeviceHandler'),
  UpdateDeviceHandler: Symbol.for('UpdateDeviceHandler'),
  DeleteDeviceHandler: Symbol.for('DeleteDeviceHandler'),
  GetDeviceHandler: Symbol.for('GetDeviceHandler'),
  GetDevicesHandler: Symbol.for('GetDevicesHandler'),
  SubscribePushHandler: Symbol.for('SubscribePushHandler'),
  UnsubscribePushHandler: Symbol.for('UnsubscribePushHandler'),
  SendPushNotificationHandler: Symbol.for('SendPushNotificationHandler'),
  QueueOfflineActionHandler: Symbol.for('QueueOfflineActionHandler'),
  GetOfflineActionsHandler: Symbol.for('GetOfflineActionsHandler'),
  UpdateOfflineActionHandler: Symbol.for('UpdateOfflineActionHandler'),
  DeleteOfflineActionHandler: Symbol.for('DeleteOfflineActionHandler'),
  UpdateNotificationPreferencesHandler: Symbol.for('UpdateNotificationPreferencesHandler'),
  GetNotificationPreferencesHandler: Symbol.for('GetNotificationPreferencesHandler'),
  SyncDataHandler: Symbol.for('SyncDataHandler'),
  GetServerUpdatesHandler: Symbol.for('GetServerUpdatesHandler'),
  GetVapidKeyHandler: Symbol.for('GetVapidKeyHandler'),
  MobileApiController: Symbol.for('MobileApiController'),

  // UI
  ComponentsApiController: Symbol.for('ComponentsApiController'),
  PreferencesApiController: Symbol.for('PreferencesApiController'),
  TemplatesApiController: Symbol.for('TemplatesApiController'),
  ThemesApiController: Symbol.for('ThemesApiController'),

  // Security
  ListApiKeysHandler: Symbol.for('ListApiKeysHandler'),
  CreateApiKeyHandler: Symbol.for('CreateApiKeyHandler'),
  GetPermissionAnalyticsHandler: Symbol.for('GetPermissionAnalyticsHandler'),
  GetViolationsHandler: Symbol.for('GetViolationsHandler'),
  AuditUserPermissionsHandler: Symbol.for('AuditUserPermissionsHandler'),
  GetComplianceReportHandler: Symbol.for('GetComplianceReportHandler'),
  ResolveViolationHandler: Symbol.for('ResolveViolationHandler'),
  LogPermissionCheckHandler: Symbol.for('LogPermissionCheckHandler'),
  CreateViolationHandler: Symbol.for('CreateViolationHandler'),
  ListSecurityEventsHandler: Symbol.for('ListSecurityEventsHandler'),
  UpdateSecurityEventHandler: Symbol.for('UpdateSecurityEventHandler'),
  GetSecurityMetricsHandler: Symbol.for('GetSecurityMetricsHandler'),
  SecurityApiController: Symbol.for('SecurityApiController'),
} as const;

// Event Bus
export { EventBusSymbol } from '../events/in-memory-event-bus';
export type { IEventBus } from '../events/in-memory-event-bus';
