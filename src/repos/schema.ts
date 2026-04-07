/**
 * Drizzle ORM table definitions for the PostgreSQL database.
 * Includes Better Auth tables (users, sessions, accounts, verifications).
 */
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { boolean, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const authorAccounts = pgTable(
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
    isVerified: boolean("is_verified").notNull().default(false),
    meta: text("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [unique("author_accounts_platform_account_id").on(t.platform, t.accountId)],
);

export const contents = pgTable(
  "contents",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    sourceId: text("source_id"),
    url: text("url"),
    authorAccountId: text("author_account_id").references(() => authorAccounts.id),
    parentId: text("parent_id").references((): AnyPgColumn => contents.id),
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
    postedAt: timestamp("posted_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    meta: text("meta"),
    rawPayload: text("raw_payload"),
  },
  (t) => [unique("contents_platform_source_id").on(t.platform, t.sourceId)],
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
