# Chat 架构 Issues 修订稿（#15 / #16 / #17 / #18 / #23）

> **状态**：GitHub App 无 Issues 写权限，无法直接 `gh issue edit`。本文件为权威修订源；有权限者请将下方「建议 Issue 正文」同步到对应 Issue。
>
> **设计参考**：`content/docs/superpowers/specs/2026-06-14-ai-reading-assistant-v1-design.mdx`  
> **官方选型**：[LocalRuntime + ChatModelAdapter](https://www.assistant-ui.com/docs/runtimes/custom/local-runtime)（自定义 REST/SSE）；仅当已有 redux/zustand 消息源时才用 ExternalStore。

## 包职责（portal + chat.acongm.com 共用）

| 包 | Issue | 职责 | 不负责 |
|----|-------|------|--------|
| `@acongm/kb-types` | #17 | ChatV1 / SummariesV1 契约类型 | 运行时、UI |
| `@acongm/ui-theme` | #15 | Codex 基础 CSS tokens | assistant-ui 映射、组件 |
| `@acongm/assistant-ui-theme` | #15 衍生 | tokens → assistant-ui CSS 变量 | 业务逻辑 |
| `@acongm/agent-session-sdk` | #16 依赖 | SSE / client-id / history / summary（无 UI） | React Runtime、Thread UI |
| `@acongm/chat-ui` | #16 | `@assistant-ui/react` LocalRuntime + Thread + Drawer/Fullscreen | 自研消息状态机、自研 Markdown 面板 |

```
DocChatEmbed (#18/#23)
  → DocsChatShell / ChatDrawer | ChatFullscreen
    → DocChatRuntimeProvider
         useLocalRuntime(ChatModelAdapter)   ← 官方管 messages / stop / retry
         adapter.run → agent-session-sdk.streamChatV1
    → AssistantThread (ThreadPrimitive + MarkdownTextPrimitive)
```

## Runtime 原则（减少自研）

1. **用 LocalRuntime**：消息、停止、重试、分支由 assistant-ui 管理。
2. **只写薄 ChatModelAdapter**：`async *run` 内调 `streamChatV1`，yield 累计 `{ content: [{ type: 'text', text }] }`。
3. **禁止 ExternalStore**（除非引入全局 store）：不要手写 `messages` / `isRunning` / `abortRef` / `onNew` 状态机。
4. **摘要**：静态 `/summaries-v1.json` → `initialMessages` / `thread.reset`；打开助手零 Chat API。
5. **历史**：sessionStorage 经 sdk `load/saveChatHistory`；路由切换时 `reset`，不清空别篇文章会话。

## 过时 PR 标记

| PR | 处理 |
|----|------|
| #86 | `[superseded]` 自研 ChatPanel / Markdown 方向错误，已由 #87 替代 |
| #87 | 正确方向：assistant-ui 包拆分；Runtime 须为 LocalRuntime（非 ExternalStore） |

---

## 建议 Issue 正文

### #15 `[P1-02] packages/ui-theme` + `assistant-ui-theme`

```markdown
## 目标仓库
`Acongm/portal`（并被 `Acongm/chat` 复用）

## 目标
提供与 Codex / 站点一致的 CSS 变量，供 portal 与 chat 共用。

## 交付
1. `@acongm/ui-theme`：基础 tokens（色、字体、间距、chat 壳层变量）。
2. `@acongm/assistant-ui-theme`：将 tokens 映射为 `@assistant-ui/react` 所需 CSS 变量；导出 `assistant-ui.css`。
3. 明/暗主题跟随站点（不在包内硬编码业务主题切换逻辑）。

## 非目标
- 不实现 Chat Runtime / Thread UI。
- 不替代 Fumadocs / 站点全局主题系统。

## 验收
- portal / chat 均可 `import '@acongm/assistant-ui-theme/assistant-ui.css'`。
- Thread / Composer 视觉与 Codex 风格一致，无默认 Inter/紫渐变。
```

### #16 `[P1-03] packages/chat-ui`（assistant-ui + Drawer/Fullscreen）

```markdown
## 目标仓库
`Acongm/portal` + `Acongm/chat`

## 目标
基于 `@assistant-ui/react` 提供可嵌入文档的 ChatDrawer 与独立站 ChatFullscreen。

## 架构（强制）
- Runtime：`useLocalRuntime` + 薄 `ChatModelAdapter`（官方推荐自定义 API 路径）。
- 流式：adapter 内调用 `@acongm/agent-session-sdk.streamChatV1`，yield 累计 text parts。
- UI：`ThreadPrimitive` + `@assistant-ui/react-markdown`；停止用 `ComposerPrimitive.Cancel`。
- 壳：PC 潜入分栏 / 平板遮罩 / 手机底部 sheet（见 v1 设计稿）。
- 依赖：#15 主题、#17 类型、后端 ChatV1 SSE。

## 明确禁止
- 自研 ChatPanel / 自研流式 Markdown 面板替代 assistant-ui。
- `useExternalStoreRuntime` 手写 messages / abort / isRunning（无外部 store 时）。

## 验收
- 发送才打 Chat API；打开助手只读 summaries 静态资源。
- 流式 Markdown、停止、重试、复制、清空可用。
- chat 仓可单独引用 `ChatFullscreen`。
```

### #17 `[P1-04] packages/kb-types`

```markdown
## 目标仓库
`Acongm/portal`

## 目标
冻结 ChatV1 / SummariesV1 TypeScript 契约，对齐 ai-chat-api。

## 交付
- `ChatV1Request` / `ChatV1StreamEvent` / `ChatV1Context` / `ChatUiMessage`。
- Summaries v1 snapshot 类型。
- 无运行时依赖。

## 验收
- agent-session-sdk / chat-ui / portal BFF 共用同一类型源。
```

### #18 `[P1-10] ChatDrawer embed 接入文档页`

```markdown
## 目标仓库
`Acongm/portal`

## 目标
文档页嵌入 ChatDrawer，不跳转独立 chat。

## 交付
- `DocChatEmbed` → `DocsChatShell` / `ChatDrawer`。
- 传入 `pagePath` / `moduleKey` / `title` / `content`。
- 响应式：PC 分栏、平板遮罩、手机底部面板。

## 依赖
#16 chat-ui、#15 主题。

## 验收
- `/docs/**` 可打开助手；正文可读宽度满足设计稿。
```

### #23 `[P4-04] ChatDrawer 绑定文档 context`

```markdown
## 目标仓库
`Acongm/portal`

## 目标
路由切换时更新助手 context，会话按 pagePath 隔离。

## 交付
- pathname → legacy `pagePath` / `moduleKey`。
- DOM 正文/标题在 soft navigation 后可靠刷新。
- `LocalRuntime.thread.reset(initialMessages)` 切换文章；历史按 path 存 sessionStorage。

## 验收
- 换页后提问使用新文章 context；旧页会话可回到该页恢复。
- 打开/换页不调用 Chat API。
```

---

## 实现顺序

1. ~~#17 kb-types~~（已有）
2. ~~#15 ui-theme / assistant-ui-theme~~（已有 / PR #87）
3. #16：LocalRuntime 精简 + Drawer/Fullscreen（本 PR 纠正）
4. #18 / #23：DocChatEmbed context（已有骨架，随 #16 验收）
