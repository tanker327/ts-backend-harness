/**
 * Data access layer for author accounts.
 * All database queries for the author_accounts table live here.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import type { CreateAuthorAccount, UpdateAuthorAccount } from "../types/author-account.ts";
import { authorAccounts } from "./schema.ts";

/** Insert a new author account and return the created row. */
export async function createAuthorAccount(id: string, data: CreateAuthorAccount, now: Date) {
  const [row] = await db
    .insert(authorAccounts)
    .values({
      id,
      platform: data.platform,
      accountId: data.accountId,
      accountUrl: data.accountUrl ?? null,
      handle: data.handle ?? null,
      name: data.name,
      description: data.description ?? null,
      avatarUrl: data.avatarUrl ?? null,
      followers: data.followers ?? null,
      isVerified: data.isVerified ?? false,
      meta: data.meta ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

/** Find an author account by its primary key. */
export async function getAuthorAccountById(id: string) {
  const [row] = await db.select().from(authorAccounts).where(eq(authorAccounts.id, id));
  return row ?? null;
}

/** Find an author account by the unique (platform, accountId) pair. */
export async function getAuthorAccountByPlatformId(platform: string, accountId: string) {
  const [row] = await db
    .select()
    .from(authorAccounts)
    .where(and(eq(authorAccounts.platform, platform), eq(authorAccounts.accountId, accountId)));
  return row ?? null;
}

/** List all author accounts, optionally filtered by platform. */
export async function listAuthorAccounts(opts?: { platform?: string }) {
  const query = db.select().from(authorAccounts);
  if (opts?.platform) {
    return query.where(eq(authorAccounts.platform, opts.platform));
  }
  return query;
}

/** Update an author account by ID and return the updated row. */
export async function updateAuthorAccount(id: string, data: UpdateAuthorAccount, now: Date) {
  const [row] = await db
    .update(authorAccounts)
    .set({ ...data, updatedAt: now })
    .where(eq(authorAccounts.id, id))
    .returning();
  return row ?? null;
}

/** Delete an author account by ID. Returns true if a row was deleted. */
export async function deleteAuthorAccount(id: string) {
  const result = await db.delete(authorAccounts).where(eq(authorAccounts.id, id)).returning();
  return result.length > 0;
}
