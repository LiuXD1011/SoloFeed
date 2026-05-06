import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, verificationCodes } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { generateToken, verifyToken } from "../middleware/auth.js";
import { nanoid } from "nanoid";

const auth = new Hono();

// 发送验证码
auth.post(
  "/send-code",
  zValidator(
    "json",
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
    })
  ),
  async (c) => {
    const { phone } = c.req.valid("json");

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 保存到数据库
    await db.insert(verificationCodes).values({
      id: nanoid(),
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 分钟有效
    });

    // TODO: 调用短信服务发送验证码
    // 开发阶段直接返回 code
    console.log(`[SMS] 验证码: ${code} -> ${phone}`);

    return c.json({ success: true, code: process.env.NODE_ENV === "development" ? code : undefined });
  }
);

// 登录/注册
auth.post(
  "/login",
  zValidator(
    "json",
    z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
      code: z.string().length(6, "验证码为6位"),
    })
  ),
  async (c) => {
    const { phone, code } = c.req.valid("json");

    // 验证码校验
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phone, phone),
          eq(verificationCodes.code, code),
          eq(verificationCodes.used, false),
          gt(verificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return c.json({ error: "验证码错误或已过期" }, 400);
    }

    // 标记验证码已使用
    await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, record.id));

    // 查找或创建用户
    let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          id: nanoid(),
          phone,
          nickname: `用户${phone.slice(-4)}`,
        })
        .returning();
    }

    // 生成 JWT
    const token = generateToken({ userId: user.id, phone: user.phone });

    return c.json({
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar },
    });
  }
);

// 刷新 Token
auth.post("/refresh", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "未登录" }, 401);
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user) {
      return c.json({ error: "用户不存在" }, 404);
    }

    const token = generateToken({ userId: user.id, phone: user.phone });
    return c.json({
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar },
    });
  } catch {
    return c.json({ error: "Token 无效" }, 401);
  }
});

export default auth;
