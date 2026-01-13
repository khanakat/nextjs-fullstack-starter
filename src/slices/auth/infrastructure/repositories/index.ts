/**
 * Auth Infrastructure Repositories
 *
 * This module exports repository implementations for auth slice.
 *
 * Note: This project uses NextAuth and Clerk for authentication, which manage
 * sessions and tokens using JWT strategy. The Session and AuthToken repositories
 * are adapters that wrap existing auth providers to maintain Clean Architecture
 * principles while keeping the existing authentication flow working.
 */

export { PrismaUserRepository } from './prisma-user-repository';
export { PrismaMfaDeviceRepository } from './prisma-mfa-device-repository';
export { NextAuthSessionRepository } from './nextauth-session-repository';
export { NextAuthAuthTokenRepository } from './nextauth-auth-token-repository';
