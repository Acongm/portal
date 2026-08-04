/**
 * AI Chat v1 契约类型 — 对齐 specs/ai-chat-api.md
 * POST /api/ai/v1/chat 与 /api/ai/v1/chat/stream
 */

export type ChatRole = 'user' | 'assistant';

export type ChatScope = 'article' | 'module';

export type ChatV1Message = {
  role: ChatRole;
  content: string;
};

export type ChatV1Context = {
  scope: ChatScope;
  pagePath: string;
  moduleKey: string;
  title: string;
  tags: string[];
  /** 裁剪后的当前文章正文；仅首轮或需要时附带 */
  content?: string;
};

export type ChatV1Request = {
  messages: ChatV1Message[];
  context: ChatV1Context;
  enableWebSearch?: boolean;
};

export type ChatV1JsonResponse = {
  provider: string;
  model: string;
  message: string;
  sources?: Array<{ title?: string; url?: string }>;
};

export type ChatV1StreamMetaEvent = {
  type: 'meta';
  provider?: string;
  model?: string;
};

export type ChatV1StreamDeltaEvent = {
  type: 'delta';
  content?: string;
};

export type ChatV1StreamUsageEvent = {
  type: 'usage';
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ChatV1StreamDoneEvent = {
  type: 'done';
};

export type ChatV1StreamErrorEvent = {
  type: 'error';
  message?: string;
};

export type ChatV1StreamEvent =
  | ChatV1StreamMetaEvent
  | ChatV1StreamDeltaEvent
  | ChatV1StreamUsageEvent
  | ChatV1StreamDoneEvent
  | ChatV1StreamErrorEvent;

/** UI 会话消息（含摘要卡 / 流式 / 错误态） */
export type ChatUiMessage = {
  id: string;
  role: ChatRole;
  content: string;
  isSummary?: boolean;
  isError?: boolean;
  streaming?: boolean;
};
