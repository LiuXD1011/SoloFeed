import { Hono } from "hono";
import { db } from "../db/index.js";
import { entries, subscriptions, userEntries } from "../db/schema.js";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { fetchFeed } from "../services/rsshub.js";
import { nanoid } from "nanoid";

const feed = new Hono();

feed.use("*", authMiddleware);

// 获取关注条目流（时间线）
feed.get("/", async (c) => {
  const userId = c.get("userId");
  const limit = Number(c.req.query("limit") || 20);
  const cursor = c.req.query("cursor"); // pubDate cursor for pagination
  const platform = c.req.query("platform"); // 可选平台过滤

  // 获取用户的订阅
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (subs.length === 0) {
    return c.json({ items: [], hasMore: false });
  }

  const subIds = subs.map((s) => s.id);

  // 构建查询
  const conditions = [sql`${entries.subscriptionId} IN ${subIds}`];
  if (platform) {
    conditions.push(eq(entries.platform, platform as "bilibili" | "xiaohongshu" | "douyin"));
  }
  if (cursor) {
    conditions.push(lt(entries.pubDate, new Date(cursor)));
  }

  const items = await db
    .select({
      entry: entries,
      userEntry: userEntries,
      subscription: subscriptions,
    })
    .from(entries)
    .leftJoin(userEntries, and(eq(userEntries.entryId, entries.id), eq(userEntries.userId, userId)))
    .innerJoin(subscriptions, eq(entries.subscriptionId, subscriptions.id))
    .where(and(...conditions))
    .orderBy(desc(entries.pubDate))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const result = items.slice(0, limit).map(({ entry, userEntry, subscription }) => ({
    ...entry,
    isRead: userEntry?.isRead ?? false,
    isStarred: userEntry?.isStarred ?? false,
    subscription: {
      id: subscription.id,
      platform: subscription.platform,
      creatorName: subscription.creatorName,
      creatorAvatar: subscription.creatorAvatar,
    },
  }));

  return c.json({
    items: result,
    hasMore,
    nextCursor: hasMore ? result[result.length - 1].pubDate.toISOString() : null,
  });
});

// 手动拉取某个订阅的最新内容
feed.post("/refresh/:subscriptionId", async (c) => {
  const userId = c.get("userId");
  const subId = c.req.param("subscriptionId");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)))
    .limit(1);

  if (!sub) {
    return c.json({ error: "订阅不存在" }, 404);
  }

  const feedData = await fetchFeed(sub.rsshubRoute);

  const newEntries = [];
  for (const item of feedData.items) {
    // 用 link 去重
    const [existing] = await db
      .select()
      .from(entries)
      .where(and(eq(entries.subscriptionId, subId), eq(entries.link, item.link)))
      .limit(1);

    if (!existing) {
      const [entry] = await db
        .insert(entries)
        .values({
          id: nanoid(),
          subscriptionId: subId,
          platform: sub.platform,
          title: item.title,
          description: item.description,
          link: item.link,
          coverImage: item.coverImage,
          author: item.author,
          pubDate: item.pubDate,
        })
        .returning();
      newEntries.push(entry);
    }
  }

  return c.json({ fetched: feedData.items.length, new: newEntries.length });
});

export default feed;
