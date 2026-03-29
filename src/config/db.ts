/**
 * Drizzle ORM database client backed by LibSQL/Turso (SQLite).
 * Connects using DATABASE_URL from the validated env config.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "./env.ts";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client);
