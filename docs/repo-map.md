# Platform v2 仓库地图

本地工作区根目录：`~/code/acongm`（多仓并列，非 monorepo）。

## 仓库与职责

| 仓库 | 域名 | 职责 | Vercel Root | 本地端口 |
| --- | --- | --- | --- | --- |
| [Acongm/portal](https://github.com/Acongm/portal) | `www.acongm.com` | 文档站（Next.js + Fumadocs）**消费** auth/chat 模块 | `apps/web` | `3000` |
| [Acongm/auth](https://github.com/Acongm/auth) | `auth.acongm.com` | OAuth SSO + **`@acongm/auth-client` 唯一源** | `apps/auth` | `3100` |
| [Acongm/chat](https://github.com/Acongm/chat) | `chat.acongm.com` | 独立 Chat 站 + **chat 包唯一源** | `apps/web` | `3200` |
| [Acongm/node-vercel-starter](https://github.com/Acongm/node-vercel-starter) | `api.acongm.com` | NestJS API（Auth/User/Chat BFF） | 仓库根 | `3001` |
| [Acongm/dochub](https://github.com/Acongm/dochub) | `dochub.acongm.com` | DocHub 编辑端（Phase 3） | TBD | TBD |

## 模块所有权（先完善接口，再接入）

```
auth 仓 ── @acongm/auth-client ──┬──> chat 仓（workspace 缓存 + sync）
                                 └──> portal 仓（packages 缓存 + sync）

chat 仓 ── @acongm/chat-ui / agent-session-sdk / … ──> portal 仓（sync）

api 仓 ── /api/auth /api/user /api/chats ──> 所有前端经 BFF 消费
```

| 模块 | 唯一源 | 接入文档 | 同步脚本 |
| --- | --- | --- | --- |
| Auth 前端 | `auth/packages/auth-client` | `auth/docs/module-integration.md` | `auth/scripts/sync-auth-client-to-consumers.sh` |
| Chat 前端 | `chat/packages/*` | `chat/docs/module-integration.md` | `chat/scripts/sync-chat-packages-to-portal.sh` |
| API | `node-vercel-starter/src/modules` | `docs/user-chat-ui-contract-testing.md` | — |

portal `packages/` 为 **只读缓存**，见 `portal/packages/README.md`。

## site.config.yaml

`auth/site.config.yaml` 与 `node-vercel-starter/site.config.yaml` 共享同一 schema（domains / git / limits / oauth）。

## 本地启动

| 服务 | 命令 | URL |
| --- | --- | --- |
| portal | `cd portal && pnpm dev` | http://localhost:3000/docs |
| auth | `cd auth && pnpm dev` | http://localhost:3100/login |
| api | `cd node-vercel-starter && npm run start` | http://localhost:3001 |
| chat | `cd chat && pnpm dev` | http://localhost:3200 |

跨仓改包后：在源仓执行 sync 脚本，再在消费方 `pnpm types:check`。
