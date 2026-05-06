import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/solofeed",

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // RSSHub
  rsshubUrl: process.env.RSSHUB_URL || "http://localhost:1200",

  // SMS (Aliyun)
  sms: {
    accessKeyId: process.env.SMS_ACCESS_KEY || "",
    accessKeySecret: process.env.SMS_ACCESS_SECRET || "",
    signName: process.env.SMS_SIGN_NAME || "SoloFeed",
    templateCode: process.env.SMS_TEMPLATE_CODE || "",
  },

  // Bilibili
  bilibiliCookie: process.env.BILIBILI_COOKIE || "",
} as const;
