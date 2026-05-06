import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: ["http://localhost:*", "https://servicewechat.com"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
