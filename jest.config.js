const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  testEnvironmentOptions: {
    customExportConditions: [""]
  },
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/hooks/(.*)$": "<rootDir>/hooks/$1",
    "^@/types/(.*)$": "<rootDir>/types/$1",
    "^@/store/(.*)$": "<rootDir>/store/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/prisma/(.*)$": "<rootDir>/prisma/$1",
    "^@/public/(.*)$": "<rootDir>/public/$1",
    "^@/shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@/slices/(.*)$": "<rootDir>/src/slices/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
    // Support '@/src/...'
    "^@/src/(.*)$": "<rootDir>/src/$1",
    // Map compiled relative DI types paths used by TS transpilation
    "^((\\.\\.\/){5})shared\/infrastructure\/di\/types$": "<rootDir>/src/shared/infrastructure/di/types.ts",
    // Map deep relative imports used in some test files (../../../../../shared/...)
    "^((\\.\\.\/){5})shared\/(.*)$": "<rootDir>/src/shared/$3",
    "^((\\.\\.\/){5})src\/(.*)$": "<rootDir>/src/$3",
    "^((\\.\\.\/){5})slices\/(.*)$": "<rootDir>/src/slices/$3",
    // Explicit pattern for five-level deep paths to ensure capture groups work on Windows
    "^\.\.\/\.\.\/\.\.\/\.\.\/shared\/(.*)$": "<rootDir>/src/shared/$1",
    "^\.\.\/\.\.\/\.\.\/\.\.\/src\/(.*)$": "<rootDir>/src/$1",
    "^\.\.\/\.\.\/\.\.\/\.\.\/slices\/(.*)$": "<rootDir>/src/slices/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(node-cron|uuid|@paralleldrive/cuid2)/)"
  ],
  collectCoverageFrom: [
    "lib/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/*.spec.{js,jsx,ts,tsx}"
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
