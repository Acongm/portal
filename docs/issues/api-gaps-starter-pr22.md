# Chat API 缺口清单（portal #87 ↔ node-vercel-starter #22）

> 前端已按 starter PR #22 契约对接。下列项需在 **node-vercel-starter** 侧确认/调整后，portal/chat 才能完整验收。

## 已对接（portal 侧已实现）

| 能力 | 前端处理 |
|------|----------|
| SSE `thinking` | → assistant-ui `reasoning` part + 可折叠「思考过程」 |
| `enableThinking` / `maxTokens` / `historyMode` | `DocChatContext` + `ChatV1Request` 透传（文档助手默认 `enableThinking: true`, `historyMode: 'short'`） |
| `conversationId` | body + `x-conversation-id` header |
| `429` + `CHAT_RATE_LIMIT` | `ChatStreamError`，UI 展示中文限额文案 |
| SSE `sources` / `usage` / `meta` | 类型已收录；sources 暂不强制渲染 |
| `/api/chat/threads*` | `@acongm/agent-session-sdk` 客户端已备（chat 站用）；portal 文档助手暂走 short ChatV1 |

## 需要 starter / 运维确认的问题

### P0 — 生产是否已部署 #22

1. **`https://api.acongm.com` 是否已包含 PR #22？**  
   若未合并/未部署：`enableThinking` 会被忽略，无 `thinking` 事件；`historyMode` / `maxTokens` 可能 400。
2. **CORS**：生产 portal（`www.acongm.com`）直连 `api.acongm.com`。请确认允许：
   - Origin: `https://www.acongm.com`、`https://chat.acongm.com`
   - Headers: `x-client-id` / `x-call-source` / `x-conversation-id` / `authorization`
   - Methods: `POST`（及 threads 的 `GET`/`DELETE`）

### P1 — Threads 代理缺口（chat 站 / 本地 Preview）

portal BFF **仅**代理了：

- `POST /api/ai/v1/chat/stream` → upstream

**缺少**（请在 portal 或统一 BFF 增加，或 chat 站同源代理）：

| 方法 | 路径 | 用途 |
|------|------|------|
| `POST` | `/api/chat/threads` | 创建长对话 |
| `GET` | `/api/chat/threads` | 列表 |
| `GET` | `/api/chat/threads/:id` | 详情+消息 |
| `DELETE` | `/api/chat/threads/:id` | 删除 |
| `POST` | `/api/chat/threads/:id/messages` | 非流式一轮 |
| `POST` | `/api/chat/threads/:id/messages/stream` | 流式 + `persisted` |

本地/Preview 的 `resolveThreadsBaseUrl()` 指向 `/api/chat/threads`，**当前 portal 无该 route → 会 404**。  
可选方案：A) portal 增加透传 proxy；B) chat 仓自建 proxy；C) 本地直连 `api.acongm.com` 并配 CORS。

### P1 — 鉴权与限额

1. 匿名依赖 `x-client-id`；未带时 starter 记为 `anonymous`，多人共享易触顶限额。  
2. 登录用户更高限额需 `Authorization: Bearer <supabase jwt>`；**portal 尚未接 auth SDK 传 token**。  
3. 请确认 429 body 稳定字段：`code/limit/remaining/resetAt/tier`（前端已按此解析）。

### P2 — 协议细节建议（starter 可改进）

1. **`thinking` 增量 vs 全量**：当前按 delta 拼接；若某 provider 推全量快照，请在文档标明，避免前端重复拼接。  
2. **`sources` 事件时机**：建议始终在首个 `delta` 之前发出，便于 UI 置顶引用。  
3. **`persisted` 事件**：thread stream 需要稳定 `messageId`/`threadId`，chat 站落库对齐用。  
4. **错误进 SSE**：流已建立后的业务错误请继续用 `event: error`；**限额请在建连前 429 JSON**（前端已区分两种）。  
5. **`historyMode: long` + 无 threads**：若只扩消息条数不落库，请在 API 文档写清与 `/api/chat/threads` 的边界，避免前端双写。

### P2 — 模型与思考

1. `enableThinking: true` 但模型不支持时：建议仍发空/`meta.enableThinking: false`，不要静默丢字段。  
2. Mock 客户端已覆盖 `thinking`；请用真实 reasoner 在 staging 验一条完整 SSE：`meta → thinking* → delta* → usage → done`。

## 前端默认行为（便于联调）

```ts
// DocChatEmbed / DocsChatShell
streamChatV1({
  enableThinking: true,   // 默认开
  historyMode: 'short',   // 文档助手
  // maxTokens: undefined → 服务端默认
})
```

关闭思考：`context={{ ..., enableThinking: false }}`。

## 建议联调顺序

1. starter #22 合入并部署 staging API  
2. 用 curl 验 `enableThinking` + 429  
3. portal Preview 走 `/api/ai/v1/chat/stream` 代理验思考 UI  
4. 补 threads proxy 后再接 chat.acongm.com 长对话
