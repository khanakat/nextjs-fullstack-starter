/**
 * Files Slice - Infrastructure Layer
 * 
 * This layer contains implementations of domain interfaces and external dependencies.
 * It handles database access, external services, and infrastructure concerns.
 * 
 * Key components:
 * - Repositories: Prisma implementations of repository interfaces
 * - Services: External service implementations (file storage, etc.)
 * - Mappers: Convert between domain entities and database models
 */

export { PrismaFileRepository } from './repositories/prisma-file-repository';
