// Re-export from db.ts to maintain compatibility
// This file is deprecated - use @/lib/db instead
export { db as prisma, testConnection } from "./db";
