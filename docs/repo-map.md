# Platform v2 仓库地图

本地工作区根目录：`~/code/acongm`（多仓并列，非 monorepo）。

## 仓库与职责

| 仓库 | 域名 | 职责 | Vercel Root | 本地端口 |
| --- | --- | --- | --- | --- |
| [Acongm/portal](https://github.com/Acongm/portal) | `www.acongm.com` | 文档站（Next.js + Fumadocs）+ chat UI 包 | `apps/web` | `3000` |
| [Acongm/auth](https://github.com/Acongm/auth) | `auth.acongm.com` | OAuth SSO 中转 + `@acongm/auth-client` / `@acongm/config` | `apps/auth` | `3100` |
| [Acongm/node-vercel-starter](https://github.com/Acongm/node-vercel-starter) | `api.acongm.com` | NestJS API（Chat / Threads / 同步预留） | 仓库根（`vercel.json`） | `3001` |
| [Acongm/dochub](https://github.com/Acongm/dochub) | `dochub.acongm.com` | DocHub 编辑端（Phase 3，仓体尚未落地） | TBD | TBD |
| [Acongm/chat](https://github.com/Acongm/chat) | `chat.acongm.com` | 独立 Chat 站（模块/文章上下文 + 隔离白名单） | `apps/web` | `3200` |

> 历史仓库名 `Acongm/platform` 已指向 portal；规划 Issues 中出现的 platform 一律按 portal 理解。

## 包与共享契约

| 包 | 所在仓 | 用途 |
| --- | --- | --- |
| `@acongm/kb-types` | portal | ChatV1 / SummariesV1 类型 |
| `@acongm/ui-theme` | portal | Codex 主题 CSS 变量 |
| `@acongm/chat-ui` | portal / chat | ChatDrawer / Fullscreen |
| `@acongm/agent-session-sdk` | portal / chat | Threads 客户端 SDK |
| `@acongm/auth-client` | auth | Supabase session / cookie / hooks |
| `@acongm/config` | auth | `site.config.yaml` 加载与 OAuth URL |

跨仓本地联调优先用各仓自包含依赖（`pnpm install` / `npm install`）。私有包迁出见 P5-06。

## site.config.yaml

`auth/site.config.yaml` 与 `node-vercel-starter/site.config.yaml` 共享同一 schema：

- `domains.*`：portal / auth / api / chat / dochub
- `git.*`：内容仓库与目录（当前指向 `Acongm/portal` 的 `content/docs`）
- `limits.*`：匿名 / 登录用户 chat 日限额
- `oauth.*`：providers、匿名 thread 认领开关

本地可通过 `SITE_CONFIG_PATH` 覆盖加载路径。

## 本地一次性初始化

```bash
mkdir -p ~/code/acongm && cd ~/code/acongm
git clone https://github.com/Acongm/portal.git
git clone https://github.com/Acongm/auth.git
git clone https://github.com/Acongm/node-vercel-starter.git
git clone https://github.com/Acongm/dochub.git
git clone https://github.com/Acongm/chat.git

cd portal && pnpm install
cd ../auth && pnpm install
cd ../node-vercel-starter && npm install
cd ../chat && pnpm install

cp auth/apps/auth/.env.example auth/apps/auth/.env.local
# 填入 nest 项目 Supabase URL + anon key（见 auth/docs/oauth-setup.md）

# 可选：~/code/acongm/scripts/dev-local.sh {portal|api|auth|all}
```

## 本地启动

| 服务 | 命令 | URL |
| --- | --- | --- |
| portal | `cd portal && pnpm dev` | http://localhost:3000/docs |
| auth | `cd auth && pnpm dev` | http://localhost:3100/login |
| api | `cd node-vercel-starter && npm run start` | http://localhost:3001 |
| chat | `cd chat && pnpm dev` | http://localhost:3200 |

portal 本地 Chat 代理默认指向 `AI_CHAT_UPSTREAM_URL=http://localhost:3001/api/ai/v1/chat/stream`（见 `portal/apps/web/.env.local`）。独立 chat 站见 `chat/apps/web/.env.example`。

## Vercel 要点

| 项目 | Root Directory | Install | 备注 |
| --- | --- | --- | --- |
| portal | `apps/web` | monorepo 根 `pnpm install`（见 `apps/web/vercel.json`） | 生产域名 `www.acongm.com` |
| auth | `apps/auth` | `cd ../.. && pnpm install` | 需 `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.acongm.com` |
| api | `.` | `npm install` | 需配置 `SUPABASE_JWT_SECRET` 等 |
| chat | `apps/web` | monorepo 根 `pnpm install` | 生产域名 `chat.acongm.com`；隔离策略见 `chat.config.yaml` |

## 默认分支

各仓默认分支为 **`main`**。内容发布目标以 `site.config.yaml` 的 `git.publishBranch` 为准；若与 remote HEAD 不一致，以实际 HEAD 为准并同步配置。
