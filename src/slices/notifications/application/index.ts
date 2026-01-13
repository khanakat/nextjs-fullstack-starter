/**
 * Notifications Application Layer
 * 
 * This module exports all application layer components for the notifications system:
 * - Use Cases: Business logic orchestration
 * - Commands: Write operations
 * - Queries: Read operations
 * - DTOs: Data transfer objects
 * - Handlers: Command and query handlers
 * - Services: Application-specific services
 */

// Use Cases
export * from './use-cases/send-notification-use-case';
export * from './use-cases/get-notifications-use-case';
export * from './use-cases/mark-notification-read-use-case';
export * from './use-cases/update-notification-preferences-use-case';
// export * from './use-cases/create-notification.use-case'; // Temporarily disabled due to TypeScript errors
// export * from './use-cases/get-notifications-use-case'; // Temporarily disabled due to duplicate export

// Commands
export * from './commands/send-notification-command';
export * from './commands/create-notification.command';

// Queries
// export * from './queries/get-notifications-query'; // GetNotificationsQuery is exported from use-cases/get-notifications-use-case

// DTOs
export * from './dtos/notification-dto';
export * from './dtos/notification-preferences-dto';
export * from './dtos/send-notification-dto';

// Handlers (if they exist)
// export * from './handlers';

// Services (if they exist)
// export * from './services';