/**
 * Zod-validated environment configuration.
 * All env var access in the app must go through the exported `env` object.
 */
import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  ANTHROPIC_API_KEY: z.string().optional(),
});

function parseEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    console.error("\n❌ Environment validation failed.");
    console.error(`   Missing or invalid: ${missing}`);
    console.error("   Copy .env.example to .env and fill in the required values:");
    console.error("   \x1b[36m$ cp .env.example .env\x1b[0m\n");
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
