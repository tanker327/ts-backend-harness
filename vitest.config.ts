import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/e2e/global-setup.ts"],
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/test",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      BETTER_AUTH_SECRET: "test-auth-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      NODE_ENV: "test",
      REDIS_HOST: "localhost",
      REDIS_PORT: "6380",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
    },
  },
});
