/**
 * Drizzle ORM table definitions for the SQLite database.
 * Includes Better Auth tables (users, sessions, accounts, verifications).
 */
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authorAccounts = sqliteTable(
  "author_accounts",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    accountId: text("account_id").notNull(),
    accountUrl: text("account_url"),
    handle: text("handle"),
    name: text("name").notNull(),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    followers: integer("followers"),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    meta: text("meta"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [unique("author_accounts_platform_account_id").on(t.platform, t.accountId)],
);

export const contents = sqliteTable(
  "contents",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    sourceId: text("source_id"),
    url: text("url"),
    authorAccountId: text("author_account_id").references(() => authorAccounts.id),
    parentId: text("parent_id").references((): AnySQLiteColumn => contents.id),
    title: text("title"),
    text: text("text"),
    textFormat: text("text_format").default("plain"),
    slug: text("slug"),
    language: text("language"),
    contentType: text("content_type"),
    likes: integer("likes"),
    reposts: integer("reposts"),
    replies: integer("replies"),
    views: integer("views"),
    bookmarks: integer("bookmarks"),
    status: text("status").notNull().default("fetched"),
    rating: integer("rating"),
    postedAt: integer("posted_at"),
    fetchedAt: integer("fetched_at"),
    archivedAt: integer("archived_at"),
    readAt: integer("read_at"),
    meta: text("meta"),
    rawPayload: text("raw_payload"),
  },
  (t) => [unique("contents_platform_source_id").on(t.platform, t.sourceId)],
);

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
