import { Hono } from "hono";
import { ofetch } from "ofetch";
import { config } from "../config.js";
import { authMiddleware } from "../middleware/auth.js";

const creator = new Hono();

creator.use("*", authMiddleware);

// 搜索B站UP主
creator.get("/search", async (c) => {
  const keyword = c.req.query("keyword");
  if (!keyword) {
    return c.json({ error: "请输入搜索关键词" }, 400);
  }

  try {
    // 代理B站搜索API
    const data = await ofetch<{
      data: {
        result: Array<{
          mid: number;
          uname: string;
          upic: string;
          usign: string;
          fans: number;
          videos: number;
        }>;
      };
    }>("https://api.bilibili.com/x/web-interface/search/type", {
      params: {
        search_type: "bili_user",
        keyword,
        page: 1,
        page_size: 20,
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Cookie: config.bilibiliCookie,
      },
      timeout: 10000,
    });

    const list = (data.data?.result ?? []).map((item) => ({
      creatorId: String(item.mid),
      creatorName: item.uname,
      creatorAvatar: item.upic.startsWith("//") ? `https:${item.upic}` : item.upic,
      creatorDesc: item.usign,
      platform: "bilibili" as const,
      stats: { fans: item.fans, videos: item.videos },
      rsshubRoute: `/bilibili/user/dynamic/${item.mid}`,
    }));

    return c.json({ list });
  } catch (err: any) {
    console.error("[Bilibili Search Error]", err.message);
    return c.json({ error: "搜索失败，请稍后重试" }, 500);
  }
});

// 获取博主信息（通过 RSSHub Feed 解析）
creator.get("/:platform/:id", async (c) => {
  const platform = c.req.param("platform");
  const id = c.req.param("id");

  if (platform !== "bilibili") {
    return c.json({ error: "暂不支持该平台" }, 400);
  }

  try {
    const { ofetch: fetch } = await import("ofetch");
    // 先通过B站API获取基本信息
    const data = await fetch<{
      data: {
        mid: number;
        name: string;
        face: string;
        sign: string;
        fans: number;
      };
    }>(`https://api.bilibili.com/x/space/acc/info`, {
      params: { mid: id },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    return c.json({
      creatorId: String(data.data.mid),
      creatorName: data.data.name,
      creatorAvatar: data.data.face,
      creatorDesc: data.data.sign,
      platform: "bilibili",
      rsshubRoute: `/bilibili/user/dynamic/${data.data.mid}`,
    });
  } catch (err: any) {
    console.error("[Creator Info Error]", err.message);
    return c.json({ error: "获取博主信息失败" }, 500);
  }
});

export default creator;
