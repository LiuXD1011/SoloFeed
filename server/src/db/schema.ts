import { pgTable, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";

// 平台枚举
export const platformEnum = pgEnum("platform", ["bilibili", "xiaohongshu", "douyin"]);

// 用户表
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  nickname: text("nickname").notNull().default(""),
  avatar: text("avatar").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 订阅表
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  creatorId: text("creator_id").notNull(), // 平台侧博主 ID
  creatorName: text("creator_name").notNull(),
  creatorAvatar: text("creator_avatar").notNull().default(""),
  creatorDesc: text("creator_desc").notNull().default(""),
  rsshubRoute: text("rsshub_route").notNull(), // 如 /bilibili/user/dynamic/946974
  group: text("group").notNull().default("default"), // 分组
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 条目缓存表
export const entries = pgTable("entries", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  link: text("link").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  author: text("author").notNull().default(""),
  pubDate: timestamp("pub_date", { withTimezone: true }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

// 用户-条目状态表（已读、星标）
export const userEntries = pgTable("user_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entryId: text("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
});

// 验证码表
export const verificationCodes = pgTable("verification_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
