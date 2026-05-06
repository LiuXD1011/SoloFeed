import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import auth from "./routes/auth.js";
import subscription from "./routes/subscription.js";
import feed from "./routes/feed.js";
import creator from "./routes/creator.js";

const app = new Hono();

// 全局中间件
app.use("*", logger());
app.use("*", corsMiddleware);
app.onError(errorHandler);

// 健康检查
app.get("/healthz", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// API 路由
const api = new Hono();
api.route("/auth", auth);
api.route("/subscriptions", subscription);
api.route("/entries", feed);
api.route("/creators", creator);

app.route("/api", api);

// 启动服务
serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`SoloFeed Server running at http://localhost:${info.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`RSSHub: ${config.rsshubUrl}`);
});

export default app;
