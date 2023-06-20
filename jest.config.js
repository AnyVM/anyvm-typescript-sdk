/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["generated/*", "./moveup_types/*", "utils/memoize-decorator.ts", "utils/hd-key.ts"],
  testPathIgnorePatterns: ["dist/*", "indexer.test.ts", "transaction_vector.test.ts", "transaction_builder.test.ts", "token_client.test.ts"],
  collectCoverage: true,
  setupFiles: ["dotenv/config"],
  coverageThreshold: {
    global: {
      branches: 50, // 90,
      functions: 50, // 95,
      lines: 50, // 95,
      statements: 50, // 95,
    },
  },
};
