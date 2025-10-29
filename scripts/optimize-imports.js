#!/usr/bin/env node

/**
 * Script to optimize duplicate imports and consolidate dependencies
 * Run with: node scripts/optimize-imports.js
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Optimization configuration
const OPTIMIZATIONS = {
  // Consolidate imports from @/lib/prisma to @/lib/db
  prismaToDb: {
    pattern: /import\s*{\s*prisma\s*}\s*from\s*['"]@\/lib\/prisma['"]/g,
    replacement: "import { db as prisma } from '@/lib/db'",
  },

  // Optimize multiple utils imports
  multipleUtils: {
    // Detect multiple imports from @/lib/utils in the same file
    detect: (content) => {
      const utilsImports = content.match(
        /import\s*{\s*[^}]+\s*}\s*from\s*['"]@\/lib\/utils['"]/g,
      );
      return utilsImports && utilsImports.length > 1;
    },
    optimize: (content) => {
      // Extract all imported functions from utils
      const utilsImports = content.match(
        /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/utils['"]/g,
      );
      if (!utilsImports || utilsImports.length <= 1) return content;

      const allFunctions = new Set();
      utilsImports.forEach((imp) => {
        const match = imp.match(/import\s*{\s*([^}]+)\s*}\s*from/);
        if (match) {
          const functions = match[1].split(",").map((f) => f.trim());
          functions.forEach((f) => allFunctions.add(f));
        }
      });

      // Create a single consolidated import
      const consolidatedImport = `import { ${Array.from(allFunctions).join(", ")} } from '@/lib/utils'`;

      // Remove all existing imports and add the consolidated one
      let optimized = content.replace(
        /import\s*{\s*[^}]+\s*}\s*from\s*['"]@\/lib\/utils['"]/g,
        "",
      );

      // Agregar el import consolidado al inicio (después de otros imports)
      const firstImportMatch = optimized.match(/^import\s+.*$/m);
      if (firstImportMatch) {
        const insertIndex =
          optimized.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
        optimized =
          optimized.slice(0, insertIndex) +
          "\n" +
          consolidatedImport +
          optimized.slice(insertIndex);
      } else {
        optimized = consolidatedImport + "\n\n" + optimized;
      }

      return optimized;
    },
  },
};

// Function to process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Apply prisma to db optimization
    if (OPTIMIZATIONS.prismaToDb.pattern.test(content)) {
      content = content.replace(
        OPTIMIZATIONS.prismaToDb.pattern,
        OPTIMIZATIONS.prismaToDb.replacement,
      );
      modified = true;
      console.log(`✓ Optimized prisma import in: ${filePath}`);
    }

    // Apply multiple utils optimization
    if (OPTIMIZATIONS.multipleUtils.detect(content)) {
      const optimized = OPTIMIZATIONS.multipleUtils.optimize(content);
      if (optimized !== content) {
        content = optimized;
        modified = true;
        console.log(`✓ Consolidated utils imports in: ${filePath}`);
      }
    }

    // Write file if it was modified
    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log("🚀 Starting import optimization...\n");

  // Search for TypeScript and JavaScript files
  const patterns = [
    "app/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "hooks/**/*.{ts,tsx,js,jsx}",
    "src/**/*.{ts,tsx,js,jsx}",
  ];

  let totalFiles = 0;
  let modifiedFiles = 0;

  patterns.forEach((pattern) => {
    const files = glob.sync(pattern, {
      ignore: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    });

    files.forEach((file) => {
      totalFiles++;
      if (processFile(file)) {
        modifiedFiles++;
      }
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Optimization completed ✅`);
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, OPTIMIZATIONS };
