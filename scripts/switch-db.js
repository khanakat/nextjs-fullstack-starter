#!/usr/bin/env node

/**
 * Script to switch between PostgreSQL and SQLite
 *
 * Usage:
 *   node scripts/switch-db.js postgresql
 *   node scripts/switch-db.js sqlite
 */

const fs = require("fs");
const path = require("path");

const dbType = process.argv[2];
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");

if (!dbType || !["postgresql", "sqlite"].includes(dbType)) {
  console.error("❌ Usage: node scripts/switch-db.js [postgresql|sqlite]");
  process.exit(1);
}

console.log(`🔄 Switching to ${dbType.toUpperCase()}...`);

let schema = fs.readFileSync(schemaPath, "utf8");

if (dbType === "postgresql") {
  // Switch to PostgreSQL
  schema = schema.replace(
    /\/\/ For PostgreSQL.*?\n\/\/ \}/gms,
    `// For PostgreSQL (Recommended for production)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Optional: Enable preview features
  // directUrl = env("DIRECT_URL")
}`,
  );

  schema = schema.replace(
    /\/\/ Para SQLite.*?\ndatasource db \{[^}]*\}/gms,
    `// For SQLite (Temporary development)
// datasource db {
//   provider = "sqlite"
//   url      = env("DATABASE_URL")
// }`,
  );

  // Restore PostgreSQL types
  schema = schema.replace(
    /refresh_token\s+String\?(?!\s+@db\.Text)/g,
    "refresh_token     String? @db.Text",
  );
  schema = schema.replace(
    /access_token\s+String\?(?!\s+@db\.Text)/g,
    "access_token      String? @db.Text",
  );
  schema = schema.replace(
    /id_token\s+String\?(?!\s+@db\.Text)/g,
    "id_token          String? @db.Text",
  );
  schema = schema.replace(
    /content\s+String\?(?!\s+@db\.Text)/g,
    "content     String?  @db.Text",
  );
  schema = schema.replace(
    /content\s+String(?!\s+@db\.Text)(?!\?)/g,
    "content   String   @db.Text",
  );
  schema = schema.replace(
    /value\s+String(?!\s+@db\.Text)(?!\?)/g,
    "value       String   @db.Text",
  );

  // Restaurar enum
  schema = schema.replace(
    /type\s+String\s+\/\/ NotificationType.*/,
    "type      NotificationType",
  );
  schema = schema.replace(
    /\/\/ Notification types enum.*?\/\/ \}/gms,
    `// Notification types enum
enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MENTION
  SYSTEM
}`,
  );
} else if (dbType === "sqlite") {
  // Switch to SQLite
  schema = schema.replace(
    /\/\/ For PostgreSQL.*?\n\/\/ \}/gms,
    `// For PostgreSQL (Recommended for production)
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
//   // Optional: Enable preview features
//   // directUrl = env("DIRECT_URL")
// }`,
  );

  schema = schema.replace(
    /\/\/ Para SQLite.*?\ndatasource db \{[^}]*\}/gms,
    `// For SQLite (Temporary development)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`,
  );

  // Remove PostgreSQL-specific types for SQLite
  schema = schema.replace(
    /refresh_token\s+String\?\s+@db\.Text/g,
    "refresh_token     String?",
  );
  schema = schema.replace(
    /access_token\s+String\?\s+@db\.Text/g,
    "access_token      String?",
  );
  schema = schema.replace(
    /id_token\s+String\?\s+@db\.Text/g,
    "id_token          String?",
  );
  schema = schema.replace(
    /content\s+String\?\s+@db\.Text/g,
    "content     String?",
  );
  schema = schema.replace(/content\s+String\s+@db\.Text/g, "content   String");
  schema = schema.replace(/value\s+String\s+@db\.Text/g, "value       String");

  // Cambiar enum a String
  schema = schema.replace(
    /type\s+NotificationType/,
    "type      String // NotificationType: LIKE, COMMENT, FOLLOW, MENTION, SYSTEM",
  );
  schema = schema.replace(
    /\/\/ Notification types enum.*?enum NotificationType \{[^}]*\}/gms,
    `// Notification types (using String instead of enum for SQLite compatibility)
// enum NotificationType {
//   LIKE
//   COMMENT
//   FOLLOW
//   MENTION
//   SYSTEM
// }`,
  );
}

fs.writeFileSync(schemaPath, schema);

console.log(`✅ Schema updated for ${dbType.toUpperCase()}`);
console.log(`📝 Remember to update your DATABASE_URL in .env.local`);

if (dbType === "postgresql") {
  console.log(
    `🔗 DATABASE_URL="postgresql://username:password@localhost:5432/fullstack_template?schema=public"`,
  );
} else {
  console.log(`🔗 DATABASE_URL="file:./dev.db"`);
}

console.log(`🚀 Run: npx prisma db push && npm run db:seed`);
