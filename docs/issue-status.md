# Portal 仓库 Issue 状态

> 跨仓统一跟踪见：[`Acongm/node-vercel-starter/docs/platform-issue-status.md`](https://github.com/Acongm/node-vercel-starter/blob/main/docs/platform-issue-status.md)

## 本仓 Issues

| # | 标题 | 状态 | 说明 |
|---|------|------|------|
| **128** | Portal Chat v2（PR） | **已完成 ✅** | merged `a367246` |
| **127** | Embedded Chat Drawer | **已关闭 ✅** | 2026-08-19 completed |
| **130** | 顶栏 getUserInfo | **已关闭 ✅** | 2026-08-19 completed |
| **129** | Portal 产品同步 | OPEN | 依赖 #37 真 LLM / OAuth |
| **117** | Stage 1 Supabase migration | OPEN | 1.3 代码完成；剩 #37 真 LLM / OAuth |

## 下一步（portal 仓）

1. Embedded Chat 非阻塞 — ✅ FAB 始终挂载，composer 仅准备期禁用
2. **#37** mock browser smoke — ✅ `e2e/quality-gate-smoke.spec.ts`（登录 chrome / FAB / send / restore）
3. **#37** live JWT + 生产 cookie browser — ✅ 顶栏账号 / FAB
4. **#37** 真 LLM send / 真人 OAuth — 仍缺
5. **#130** 已关闭；shadcn Avatar 换皮仍可选
