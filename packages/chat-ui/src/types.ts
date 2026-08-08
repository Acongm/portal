export type DocChatContext = {
  /** summaries / API 使用的文档路径键，如 /react/react16.md */
  pagePath: string;
  moduleKey?: string;
  title?: string;
  tags?: string[];
  content?: string;
  streamUrl?: string;
  summariesUrl?: string;
  enableThinking?: boolean;
  maxTokens?: number;
  historyMode?: 'short' | 'long';
  defaultScope?: 'article' | 'module';
  callSourcePrefix?: string;

  /** Durable Chat v2 context. */
  chatId?: string;
  chatsBaseUrl?: string;
  accessToken?: string | null;
  ensureChat?: (input?: { title?: string }) => Promise<string>;
  onChatPersisted?: (chatId: string) => void;
  runtimeKey?: string;

  /** @deprecated Stage 1 legacy compatibility only. */
  threadId?: string;
  /** @deprecated Stage 1 legacy compatibility only. */
  threadsBaseUrl?: string;
  /** @deprecated Stage 1 legacy compatibility only. */
  ensureThread?: (input?: { title?: string }) => Promise<string>;
  /** @deprecated Stage 1 legacy compatibility only. */
  onThreadPersisted?: (threadId: string) => void;
};
