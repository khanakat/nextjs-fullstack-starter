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

  // Integrations
  IntegrationRepository: Symbol.for('IntegrationRepository'),
  CreateIntegrationHandler: Symbol.for('CreateIntegrationHandler'),
  UpdateIntegrationHandler: Symbol.for('UpdateIntegrationHandler'),
  DeleteIntegrationHandler: Symbol.for('DeleteIntegrationHandler'),
  GetIntegrationHandler: Symbol.for('GetIntegrationHandler'),
  GetIntegrationsHandler: Symbol.for('GetIntegrationsHandler'),
  CreateIntegrationUseCase: Symbol.for('CreateIntegrationUseCase'),
  UpdateIntegrationUseCase: Symbol.for('UpdateIntegrationUseCase'),
  DeleteIntegrationUseCase: Symbol.for('DeleteIntegrationUseCase'),
  GetIntegrationUseCase: Symbol.for('GetIntegrationUseCase'),
  GetIntegrationsUseCase: Symbol.for('GetIntegrationsUseCase'),
  IntegrationsApiController: Symbol.for('IntegrationsApiController'),

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
} as const;

// Event Bus
export { EventBusSymbol } from '../events/in-memory-event-bus';
export type { IEventBus } from '../events/in-memory-event-bus';
