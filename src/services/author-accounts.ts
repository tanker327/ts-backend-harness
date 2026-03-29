/**
 * Business logic for author accounts.
 * Handles ID generation, timestamps, and delegates to the repo layer.
 */
import * as repo from "../repos/author-accounts.ts";
import type { CreateAuthorAccount, UpdateAuthorAccount } from "../types/author-account.ts";

/** Create a new author account with a generated UUID and timestamps. */
export async function create(data: CreateAuthorAccount) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  return repo.createAuthorAccount(id, data, now);
}

/** Get an author account by ID, or null if not found. */
export async function getById(id: string) {
  return repo.getAuthorAccountById(id);
}

/** Get an author account by its unique (platform, accountId) pair. */
export async function getByPlatformId(platform: string, accountId: string) {
  return repo.getAuthorAccountByPlatformId(platform, accountId);
}

/** List all author accounts, optionally filtered by platform. */
export async function list(opts?: { platform?: string }) {
  return repo.listAuthorAccounts(opts);
}

/** Update an author account by ID. Returns the updated row or null. */
export async function update(id: string, data: UpdateAuthorAccount) {
  const now = Math.floor(Date.now() / 1000);
  return repo.updateAuthorAccount(id, data, now);
}

/** Delete an author account by ID. Returns true if deleted. */
export async function remove(id: string) {
  return repo.deleteAuthorAccount(id);
}
