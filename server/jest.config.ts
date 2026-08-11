import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src/tests"],

  moduleFileExtensions: ["ts", "js", "json"],

  testMatch: ["**/*.test.ts"],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
    "!src/swagger/**",
  ],

  coverageDirectory: "coverage",

  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],

  globalTeardown: "<rootDir>/src/tests/jest.teardown.ts",

  clearMocks: true,
  verbose: true,
};

export default config;
