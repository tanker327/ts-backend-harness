/**
 * Drizzle ORM database client backed by PostgreSQL via postgres-js.
 * Connects using DATABASE_URL from the validated env config.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client);
