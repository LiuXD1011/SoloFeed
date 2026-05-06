import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { nanoid } from "nanoid";

const subscription = new Hono();

// 所有订阅路由需要认证
subscription.use("*", authMiddleware);

// 获取我的订阅列表
subscription.get("/", async (c) => {
  const userId = c.get("userId");

  const list = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt);

  return c.json({ list });
});

// 添加订阅
subscription.post(
  "/",
  zValidator(
    "json",
    z.object({
      platform: z.enum(["bilibili", "xiaohongshu", "douyin"]),
      creatorId: z.string().min(1),
      creatorName: z.string().min(1),
      creatorAvatar: z.string().optional(),
      creatorDesc: z.string().optional(),
      rsshubRoute: z.string().min(1),
      group: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    // 检查是否已订阅
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.platform, data.platform),
          eq(subscriptions.creatorId, data.creatorId)
        )
      )
      .limit(1);

    if (existing) {
      return c.json({ error: "已订阅该博主" }, 409);
    }

    const [sub] = await db
      .insert(subscriptions)
      .values({
        id: nanoid(),
        userId,
        platform: data.platform,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        creatorAvatar: data.creatorAvatar || "",
        creatorDesc: data.creatorDesc || "",
        rsshubRoute: data.rsshubRoute,
        group: data.group || "default",
      })
      .returning();

    return c.json(sub, 201);
  }
);

// 取消订阅
subscription.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const subId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subId), eq(subscriptions.userId, userId)))
    .limit(1);

  if (!existing) {
    return c.json({ error: "订阅不存在" }, 404);
  }

  await db.delete(subscriptions).where(eq(subscriptions.id, subId));

  return c.json({ success: true });
});

export default subscription;
