# Portal 仓库 Issue 状态

> 最后更新：2026-09-03  
> 跨仓统一跟踪：[`platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues（对照 `origin/main`）

| # | 标题 | 代码 | GitHub | 说明 |
|---|------|------|--------|------|
| **128** | Portal Chat v2（PR） | ✅ | MERGED | |
| **127** | Embedded Chat Drawer | ✅ | **CLOSED** 2026-08-19 | |
| **130** | 顶栏 getUserInfo | ✅ | **CLOSED** 2026-08-19 | shadcn Avatar 仍可选 |
| **129** | Portal 产品同步 | chrome + 非阻塞 embed + mock e2e ✅ | OPEN | **没有** `test:e2e:live`；生产 → `#37` |
| **117** | Stage 1 迁移 | 1.3 代码 ✅ | OPEN | 1.4 `#37` / 1.5 `#35` |
| **116** | Stage 0 生产可靠性 | 部分被 v2 覆盖 | OPEN | 依赖 auth `#25–#29` 生产回跳 |
| **1** | Program 总控 | — | OPEN | Stage 0 未关 |
| **118** | Shared UI Registry | 部分接线 | OPEN | Stage 2，不抢主线 |
| **4** / **5** | KB / DocHub Epic | — | OPEN | 不抢主线 |
| **7** / **10–#12** / **119** / **121** / **122** | Stage 5–6 | — | OPEN | 不抢主线 |

## 纠正

- 旧文档写「`#37` 生产 JWT browser / `pnpm test:e2e:live`」——**portal `main` 没有 live Playwright 脚本**。只有 `e2e/quality-gate-smoke.spec.ts`（mock）。

## 证据

- 顶栏：`AuthAccountButton` + `/account#settings`，合同 `tests/contracts/portal-auth-chrome.test.mjs`
- 嵌入 Chat：`doc-chat-embed.tsx` FAB 始终挂载；`composerDisabled` 仅准备期/失败
- BFF：`apps/web/app/api/chats/`、`apps/web/app/api/user/`
- mock e2e：登录 chrome / FAB / send / restore / reload+edit

## 下一步

1. `#37` 生产 cookie：顶栏登录态 + Drawer 会话持久化
2. 若要对齐 Chat，再补 `test:e2e:live`
3. `#116` 等 auth 生产 OAuth / Email 关完再关
