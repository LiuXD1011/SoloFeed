import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json({ error: err.message || "服务器内部错误" }, 500);
}
