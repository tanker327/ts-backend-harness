import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/local.db";
const isLocal = url.startsWith("file:");

export default defineConfig({
  schema: "./src/repos/schema.ts",
  out: "./drizzle",
  dialect: isLocal ? "sqlite" : "turso",
  dbCredentials: isLocal ? { url } : { url, authToken: process.env.DATABASE_AUTH_TOKEN! },
});
