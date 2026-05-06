# SoloFeed

> 极简跨端追更，拒绝信息轰炸

一键同步小红书、抖音、B站等社交平台的关注列表，让你在一个平台跨端追更所有常看博主。彻底屏蔽广告与算法推荐，拒绝无意义的信息轰炸。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 客户端 | uni-app + Vue 3 + TypeScript | 一套代码编译为微信小程序、H5、APP |
| 状态管理 | Pinia | 轻量、类型安全 |
| 后端 | Hono + TypeScript | 轻量高性能 Web 框架 |
| ORM | Drizzle ORM | 类型安全的 SQL 查询构建器 |
| 数据库 | PostgreSQL 16 | 用户、订阅、条目存储 |
| 缓存 | Redis 7 | Feed 缓存、会话管理 |
| 数据源 | RSSHub (Docker) | 将各平台内容转换为标准 RSS |
| 认证 | JWT + 短信验证码 | 手机号无密码登录 |

## 整体架构

```
┌─────────────────────────────────────────────┐
│           SoloFeed 客户端 (uni-app)          │
│       微信小程序 / H5 / APP (Vue3+TS)        │
│                                              │
│   首页信息流  ·  发现/搜索  ·  订阅管理  ·  我的  │
│                                              │
│   Pinia 状态管理  ·  本地 Storage 持久化       │
└──────────────────┬──────────────────────────┘
                   │  HTTP API (REST)
                   ▼
┌──────────────────────────────────────────────┐
│            SoloFeed 后端 (Hono)               │
│                                              │
│   /api/auth          发送验证码 / 登录注册      │
│   /api/creators      搜索博主 / 博主信息        │
│   /api/subscriptions  订阅 CRUD               │
│   /api/entries       信息流（游标分页）/ 刷新    │
│                                              │
│   PostgreSQL  ·  Redis  ·  JWT 认证           │
└──────────────────┬──────────────────────────┘
                   │  RSS/Atom
                   ▼
┌──────────────────────────────────────────────┐
│          RSSHub 实例 (Docker 自建)            │
│                                              │
│   /bilibili/user/dynamic/:uid   B站动态      │
│   /bilibili/user/video/:uid     B站视频      │
│   /bilibili/user/fav/:uid       B站收藏      │
│   ... (1,582 个命名空间，持续扩展中)            │
└──────────────────────────────────────────────┘
```

## 项目结构

```
SoloFeed/
├── docker-compose.yml              # PostgreSQL + Redis + RSSHub 一键部署
│
├── server/                         # 后端服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts           # Drizzle ORM 迁移配置
│   ├── .env.example                # 环境变量模板
│   └── src/
│       ├── index.ts                # Hono 入口，注册中间件和路由
│       ├── config.ts               # 环境变量统一管理
│       ├── db/
│       │   ├── index.ts            # PostgreSQL 连接
│       │   └── schema.ts           # 数据表定义 (5 张表)
│       ├── middleware/
│       │   ├── auth.ts             # JWT 认证中间件
│       │   ├── cors.ts             # 跨域配置
│       │   └── error.ts            # 全局错误处理
│       ├── routes/
│       │   ├── auth.ts             # 验证码发送 / 登录注册 / Token 刷新
│       │   ├── creator.ts          # 博主搜索 (代理B站API) / 博主详情
│       │   ├── subscription.ts     # 订阅 增/删/查
│       │   └── feed.ts             # 信息流查询 (游标分页) / 手动刷新
│       └── services/
│           ├── rsshub.ts           # RSSHub Feed 获取与解析
│           └── xml-parser.ts       # RSS XML 解析工具
│
└── src/                            # 客户端 (uni-app)
    ├── main.ts                     # 应用入口，注册 Pinia
    ├── App.vue                     # 根组件，全局样式 + 登录检查
    ├── pages.json                  # 页面路由 + 底部 TabBar 配置
    ├── manifest.json               # uni-app 应用配置
    │
    ├── pages/
    │   ├── index/index.vue         # 首页 — 信息流 + 平台 Tab 切换
    │   ├── discover/index.vue      # 发现 — 搜索B站UP主 + 一键关注
    │   ├── subscription/index.vue  # 订阅 — 关注列表 + 长按取消
    │   ├── profile/index.vue       # 我的 — 用户信息 + 设置 + 退出
    │   └── login/index.vue         # 登录 — 手机号 + 验证码
    │
    ├── stores/                     # Pinia 状态管理
    │   ├── user.ts                 # 用户状态 (登录/登出/Token)
    │   ├── feed.ts                 # 信息流状态 (条目列表/分页/刷新)
    │   └── subscription.ts         # 订阅状态 (增/删/查/按平台分组)
    │
    ├── api/                        # 后端 API 调用层
    │   ├── auth.ts                 # 认证接口
    │   ├── creator.ts              # 博主接口
    │   ├── subscription.ts         # 订阅接口
    │   ├── feed.ts                 # 信息流接口
    │   └── index.ts                # 统一导出
    │
    ├── types/
    │   └── index.ts                # 全局 TypeScript 类型定义
    │
    └── utils/
        ├── request.ts              # uni.request 封装 (Token 拦截器)
        ├── storage.ts              # 本地存储封装
        └── platform.ts             # 平台标签 / 颜色 / 时间格式化
```

## 数据模型

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│    users     │     │   subscriptions   │     │     entries      │
├──────────────┤     ├───────────────────┤     ├──────────────────┤
│ id (PK)      │◄────│ userId (FK)       │     │ id (PK)          │
│ phone        │     │ id (PK)           │◄────│ subscriptionId   │
│ nickname     │     │ platform          │     │ platform         │
│ avatar       │     │ creatorId         │     │ title            │
│ createdAt    │     │ creatorName       │     │ description      │
│ updatedAt    │     │ creatorAvatar     │     │ link             │
└──────────────┘     │ creatorDesc       │     │ coverImage       │
                     │ rsshubRoute       │     │ author           │
                     │ group             │     │ pubDate          │
                     │ createdAt         │     │ fetchedAt        │
                     └───────────────────┘     └──────────────────┘
                                                       │
                     ┌───────────────────┐              │
                     │   user_entries    │              │
                     ├───────────────────┤              │
                     │ id (PK)           │              │
                     │ userId (FK)       │              │
                     │ entryId (FK)      │◄─────────────┘
                     │ isRead            │
                     │ isStarred         │
                     │ readAt            │
                     └───────────────────┘

                     ┌────────────────────┐
                     │ verification_codes │
                     ├────────────────────┤
                     │ id (PK)            │
                     │ phone              │
                     │ code               │
                     │ used               │
                     │ expiresAt          │
                     │ createdAt          │
                     └────────────────────┘
```

## API 接口一览

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/send-code` | 发送短信验证码 | 否 |
| POST | `/api/auth/login` | 验证码登录/注册，返回 JWT | 否 |
| POST | `/api/auth/refresh` | 刷新 Token | Bearer |
| GET | `/api/creators/search?keyword=` | 搜索B站UP主 | Bearer |
| GET | `/api/creators/:platform/:id` | 获取博主详情 | Bearer |
| GET | `/api/subscriptions` | 获取我的订阅列表 | Bearer |
| POST | `/api/subscriptions` | 添加订阅 | Bearer |
| DELETE | `/api/subscriptions/:id` | 取消订阅 | Bearer |
| GET | `/api/entries?limit=&cursor=&platform=` | 信息流（游标分页） | Bearer |
| POST | `/api/entries/refresh/:subscriptionId` | 手动拉取最新内容 | Bearer |

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose
- 微信开发者工具（小程序调试用）

### 1. 启动基础设施

```bash
cd SoloFeed
docker compose up -d
```

这会启动三个服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 主数据库 |
| Redis | 6379 | 缓存 |
| RSSHub | 1200 | Feed 数据源 |

验证 RSSHub：浏览器访问 `http://localhost:1200/bilibili/user/dynamic/946974`

### 2. 启动后端

```bash
cd SoloFeed/server

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接、JWT 密钥等

# 生成并执行数据库迁移
pnpm db:generate
pnpm db:migrate

# 启动开发服务
pnpm dev
```

后端运行在 `http://localhost:3000`，健康检查：`curl http://localhost:3000/healthz`

### 3. 启动客户端

```bash
cd SoloFeed

# 安装依赖
pnpm install

# H5 模式（浏览器调试）
pnpm dev:h5

# 微信小程序模式
pnpm dev:mp-weixin
# 然后用微信开发者工具打开 dist/dev/mp-weixin 目录
```

## 开发进度

### 第一阶段 — 基础骨架 + B站阅读 (MVP) 当前阶段

| 模块 | 功能 | 状态 |
|------|------|------|
| **后端** | Hono 项目骨架、中间件 (Auth/CORS/Error) | 已完成 |
| **后端** | 数据库 Schema (5 张表) + Drizzle ORM | 已完成 |
| **后端** | 短信验证码登录 / JWT 认证 | 已完成 |
| **后端** | 订阅 CRUD (增/删/查) | 已完成 |
| **后端** | 信息流查询 (游标分页) + 手动刷新 | 已完成 |
| **后端** | 博主搜索 (代理B站 API) + 博主详情 | 已完成 |
| **后端** | RSSHub Feed 获取与 XML 解析 | 已完成 |
| **后端** | Docker Compose (PG + Redis + RSSHub) | 已完成 |
| **客户端** | pages.json + 底部 TabBar (4 页) | 已完成 |
| **客户端** | HTTP 请求封装 (Token 拦截器) | 已完成 |
| **客户端** | TypeScript 类型定义 | 已完成 |
| **客户端** | API 调用层 (auth/feed/subscription/creator) | 已完成 |
| **客户端** | Pinia 状态管理 (user/feed/subscription) | 已完成 |
| **客户端** | 登录页 (手机号 + 验证码) | 已完成 |
| **客户端** | 首页信息流 (平台 Tab + 下拉刷新 + 上拉加载) | 已完成 |
| **客户端** | 发现页 (搜索B站UP主 + 一键关注) | 已完成 |
| **客户端** | 订阅管理页 (关注列表 + 长按取消) | 已完成 |
| **客户端** | 个人中心页 (用户信息 + 设置 + 退出) | 已完成 |
| **联调** | 前后端联调 (登录 + 搜索 + 订阅 + 信息流) | 待开始 |
| **联调** | 微信小程序端适配测试 | 待开始 |
| **联调** | 短信服务接入 (当前开发模式验证码打印在控制台) | 待开始 |
| **联调** | TabBar 图标替换 (当前为占位图标) | 待开始 |

### 第二阶段 — 体验优化 + 更多平台

| 功能 | 说明 | 状态 |
|------|------|------|
| 小红书支持 | 通过 RSSHub 路由接入 | 规划中 |
| 抖音支持 | 通过 RSSHub 路由接入 | 规划中 |
| 富文本渲染 | 视频播放、图片轮播 | 规划中 |
| 离线缓存 | 本地存储已加载条目 | 规划中 |
| 暗色模式 | 跟随系统 / 手动切换 | 规划中 |
| 收藏/星标 | 条目标记 + 筛选 | 规划中 |
| 分组管理 | 订阅按自定义分组归类 | 规划中 |

### 第三阶段 — 高级功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 推送通知 | 博主更新时提醒 | 规划中 |
| AI 摘要 | 条目内容智能摘要 | 规划中 |
| OPML 导入导出 | 标准 RSS 订阅迁移 | 规划中 |
| 一键同步关注 | OAuth 导入各平台关注列表 | 规划中 |
| 多语言 | i18n 国际化 | 规划中 |
| 阅读统计 | 周报、阅读习惯分析 | 规划中 |

## 参考项目

| 项目 | 路径 | 参考内容 |
|------|------|----------|
| **Folo** | `/mnt/c/WORK/SoloFeed/Folo/` | 跨平台 RSS 阅读器的整体架构设计。Monorepo 结构 (apps + packages)、Drizzle ORM 数据库方案、Feed 解析与聚合逻辑、AI 集成方案 |
| **RSSHub** | `/mnt/c/WORK/SoloFeed/RSSHub/` | 数据抓取与路由体系。B站等平台的路由实现 (lib/routes/bilibili/)、RSS Feed 生成格式、缓存策略、Docker 部署方案 |
| **RSSHub-Radar** | `/mnt/c/WORK/SoloFeed/RSSHub-Radar/` | 浏览器扩展中的 Feed 发现机制。WXT 框架使用、URL 匹配与 RSS 源检测逻辑 |

## 注意事项

- **manifest.json** 中的 `appid` 需替换为微信小程序的 AppID
- **src/utils/request.ts** 中的 `BASE_URL` 需根据部署环境修改
- **server/.env** 需根据 `.env.example` 创建并填写真实配置
- 开发阶段短信验证码会打印在服务端控制台，不会真正发送
- TabBar 图标当前为占位文件，需替换为正式设计图标
- uni-app 条件编译已使用：H5 端直接打开链接，小程序端复制链接到剪贴板

## License

Private
