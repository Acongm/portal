# Portal 仓库 Issue 状态

> 跨仓统一跟踪见：[`Acongm/node-vercel-starter/docs/platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues

| # | 标题 | 状态 | 说明 |
|---|------|------|------|
| **128** | Portal Chat v2（PR） | **已完成 ✅** | merged `a367246` |
| **127** | Embedded Chat Drawer | **应关闭 ✅** | 与 #128 重复，代码已合入 |
| **130** | 顶栏 getUserInfo | **Phase 2 源码完成** | `AuthAccountButton menu` + `/account#settings` + auth retry；shadcn Avatar 仍可选 |
| **129** | Portal 产品同步 | OPEN | 依赖 #37 browser smoke |
| **117** | Stage 1 Supabase migration | OPEN | 1.3 代码完成；剩 E2E |

## 下一步（portal 仓）

1. Embedded Chat 非阻塞 — ✅ FAB 始终挂载，composer 仅准备期禁用
2. **#37** mock browser smoke — ✅ `e2e/quality-gate-smoke.spec.ts`（登录 chrome / FAB / send / restore）
3. **#37** live JWT browser — ✅ `pnpm test:e2e:live`（注入真实 session，顶栏账号 + FAB）
4. **#37** 生产 cookie / OAuth browser — 仍待 `*.acongm.com`
5. **#130** shadcn Avatar/Menu 仍可选，不阻塞登录态
