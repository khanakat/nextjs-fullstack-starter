/**
 * Auth Infrastructure Layer
 * 
 * This module exports all infrastructure implementations for the auth slice,
 * including repositories and services.
 * 
 * The infrastructure layer provides concrete implementations of the interfaces
 * defined in the domain layer. This includes:
 * - Repositories: Data access implementations using Prisma
 * - Services: Business logic implementations using external libraries
 * - Adapters: Wrappers around NextAuth/Clerk for compatibility
 */

// Repositories
export * from './repositories';

// Services
export * from './services';
