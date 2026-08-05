'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import type { ChatUiMessage } from '@acongm/kb-types';
import {
  buildSummaryCardContent,
  clearChatHistory,
  deriveTagOptions,
  loadChatHistory,
  loadSummaryV1,
  modelHistory,
  resolveCallSource,
  saveChatHistory,
  streamChatV1,
} from '@acongm/agent-session-sdk';
import type { DocChatContext } from '../types';

function textOf(message: AppendMessage): string {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function toThreadMessage(message: ChatUiMessage): ThreadMessageLike {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.streaming
      ? { type: 'running' }
      : message.isError
        ? { type: 'incomplete', reason: 'error', error: message.content }
        : { type: 'complete', reason: 'stop' },
    metadata: {
      custom: {
        isSummary: Boolean(message.isSummary),
        isError: Boolean(message.isError),
      },
    },
  };
}

export type DocChatRuntimeProviderProps = {
  context: DocChatContext;
  active?: boolean;
  children: ReactNode;
};

/**
 * ChatV1 SSE（@acongm/agent-session-sdk）→ assistant-ui ExternalStoreRuntime。
 * portal Drawer 与 chat Fullscreen 共用。
 */
export function DocChatRuntimeProvider({
  context,
  active = true,
  children,
}: DocChatRuntimeProviderProps) {
  const {
    pagePath,
    moduleKey = '',
    title = '当前文档',
    tags = [],
    content = '',
    streamUrl,
    summariesUrl,
  } = context;

  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const persist = useCallback((next: ChatUiMessage[], path = pagePath) => {
    if (typeof sessionStorage !== 'undefined') {
      saveChatHistory(sessionStorage, path, next);
    }
  }, [pagePath]);

  const bootstrap = useCallback(
    async (path: string) => {
      let initial: ChatUiMessage[] = [];
      if (typeof sessionStorage !== 'undefined') {
        initial = loadChatHistory(sessionStorage, path);
      }
      if (!initial.some((m) => m.isSummary)) {
        try {
          const result = await loadSummaryV1(path, { url: summariesUrl });
          initial = [
            {
              id: `summary-${path}`,
              role: 'assistant',
              content: buildSummaryCardContent(result),
              isSummary: true,
            },
            ...initial,
          ];
        } catch {
          initial = [
            {
              id: `summary-${path}`,
              role: 'assistant',
              content: buildSummaryCardContent(null, { snapshotMissing: true }),
              isSummary: true,
            },
            ...initial,
          ];
        }
      }
      setMessages(initial);
      persist(initial, path);
    },
    [persist, summariesUrl],
  );

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    setMessages([]);
    if (active) void bootstrap(pagePath);
  }, [active, pagePath, bootstrap]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const question = textOf(message).trim();
      if (!question) return;

      const userMessage: ChatUiMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
      };
      const answer: ChatUiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        streaming: true,
      };

      const base = [...messagesRef.current, userMessage, answer];
      setMessages(base);
      setIsRunning(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const tagOptions = deriveTagOptions(question);
      const callSource = resolveCallSource(
        tagOptions.scope,
        tagOptions.enableWebSearch,
      );

      try {
        const events = await streamChatV1(
          {
            messages: modelHistory(base.filter((item) => item !== answer)),
            context: {
              scope: tagOptions.scope,
              pagePath,
              moduleKey,
              title,
              tags,
              content,
            },
            enableWebSearch: tagOptions.enableWebSearch,
          },
          { signal: controller.signal, callSource, url: streamUrl },
        );

        for await (const event of events) {
          if (event.type === 'delta') {
            answer.content += event.content || '';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === answer.id ? { ...m, content: answer.content } : m,
              ),
            );
          }
          if (event.type === 'error') {
            throw new Error(event.message || '回答失败');
          }
        }

        answer.streaming = false;
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === answer.id ? { ...m, streaming: false } : m,
          );
          persist(updated);
          return updated;
        });
      } catch (error) {
        const err = error as { name?: string; message?: string };
        answer.streaming = false;
        if (!answer.content) {
          answer.content =
            err?.name === 'AbortError'
              ? '已停止生成。'
              : err?.message || '回答失败，请重试。';
        }
        answer.isError = err?.name !== 'AbortError';
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === answer.id
              ? {
                  ...m,
                  content: answer.content,
                  streaming: false,
                  isError: answer.isError,
                }
              : m,
          );
          persist(updated);
          return updated;
        });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsRunning(false);
      }
    },
    [content, moduleKey, pagePath, persist, streamUrl, tags, title],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  const threadMessages = useMemo(
    () => messages.map(toThreadMessage),
    [messages],
  );

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: threadMessages,
    convertMessage: (message) => message,
    onNew,
    onCancel,
  });

  useEffect(() => {
    const onClear = () => {
      abortRef.current?.abort();
      setMessages((prev) => {
        const kept = prev.filter((m) => m.isSummary);
        if (typeof sessionStorage !== 'undefined') {
          clearChatHistory(sessionStorage, pagePath);
        }
        persist(kept);
        return kept;
      });
    };
    window.addEventListener('acongm-chat-clear', onClear);
    return () => window.removeEventListener('acongm-chat-clear', onClear);
  }, [pagePath, persist]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
