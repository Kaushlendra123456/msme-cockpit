/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  testTimeout: 15000,
};