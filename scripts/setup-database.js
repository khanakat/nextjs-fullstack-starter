#!/usr/bin/env node

/**
 * Smart Database Setup Script
 * Automatically detects available database options and configures accordingly
 */

const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔍 Detecting available database options...\n");

// Check if Docker is available and running
function checkDocker() {
  try {
    execSync("docker --version", { stdio: "ignore" });
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if PostgreSQL is installed locally
function checkLocalPostgreSQL() {
  try {
    execSync("psql --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Update .env.local file
function updateEnvFile(databaseUrl, option) {
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Replace DATABASE_URL line
  envContent = envContent.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${databaseUrl}"`,
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env.local with ${option} configuration`);
}

async function main() {
  const dockerAvailable = checkDocker();
  const postgresLocalAvailable = checkLocalPostgreSQL();

  console.log(
    `🐳 Docker: ${dockerAvailable ? "✅ Available" : "❌ Not available"}`,
  );
  console.log(
    `🏠 Local PostgreSQL: ${postgresLocalAvailable ? "✅ Available" : "❌ Not available"}`,
  );
  console.log("");

  if (dockerAvailable) {
    console.log("🐳 Using Docker PostgreSQL...");
    updateEnvFile(
      "postgresql://postgres:postgres123@localhost:5432/fullstack_template?schema=public",
      "Docker PostgreSQL",
    );

    try {
      console.log("🚀 Starting Docker PostgreSQL...");
      execSync("npm run postgres:docker:start", { stdio: "inherit" });

      // Wait a moment for PostgreSQL to be ready
      console.log("⏳ Waiting for PostgreSQL to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log("📋 Applying database schema...");
      execSync("npm run db:push", { stdio: "inherit" });

      console.log("🌱 Seeding database...");
      execSync("npm run db:seed", { stdio: "inherit" });

      console.log("\n🎉 Docker PostgreSQL setup complete!");
      console.log("🔗 Access Adminer: http://localhost:8080");
      console.log("🔗 Access PgAdmin: http://localhost:5050");
    } catch (error) {
      console.error("❌ Error setting up Docker PostgreSQL:", error.message);
      fallbackToSQLite();
    }
  } else if (postgresLocalAvailable) {
    console.log("🏠 Using Local PostgreSQL...");
    updateEnvFile(
      "postgresql://postgres:postgres@localhost:5432/fullstack_template?schema=public",
      "Local PostgreSQL",
    );

    try {
      execSync("npm run postgres:local:start", { stdio: "inherit" });
      execSync("npm run postgres:local:create-db", { stdio: "inherit" });
      execSync("npm run db:push", { stdio: "inherit" });
      execSync("npm run db:seed", { stdio: "inherit" });

      console.log("\n🎉 Local PostgreSQL setup complete!");
    } catch (error) {
      console.error("❌ Error setting up Local PostgreSQL:", error.message);
      fallbackToSQLite();
    }
  } else {
    console.log("⚠️  Neither Docker nor Local PostgreSQL available");
    fallbackToSQLite();
  }
}

function fallbackToSQLite() {
  console.log("\n🔄 Falling back to SQLite...");

  try {
    // Switch schema to SQLite
    execSync("npm run db:switch:sqlite", { stdio: "inherit" });

    // Update env file
    updateEnvFile("file:./dev.db", "SQLite");

    // Setup database
    execSync("npm run db:push", { stdio: "inherit" });
    execSync("npm run db:seed", { stdio: "inherit" });

    console.log("\n🎉 SQLite setup complete!");
    console.log(
      "💡 To use PostgreSQL later, install Docker or PostgreSQL and run this script again.",
    );
  } catch (error) {
    console.error("❌ Error setting up SQLite:", error.message);
    console.log("\n📋 Manual setup required:");
    console.log("1. npm run db:switch:sqlite");
    console.log("2. Update DATABASE_URL in .env.local to: file:./dev.db");
    console.log("3. npm run db:push");
    console.log("4. npm run db:seed");
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n⏹️  Setup cancelled by user");
  process.exit(0);
});

main().catch(console.error);
