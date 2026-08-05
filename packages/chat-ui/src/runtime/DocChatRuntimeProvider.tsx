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
  useLocalRuntime,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import type { ChatUiMessage } from '@acongm/kb-types';
import {
  buildSummaryCardContent,
  clearChatHistory,
  loadChatHistory,
  loadSummaryV1,
  saveChatHistory,
} from '@acongm/agent-session-sdk';
import type { DocChatContext } from '../types';
import { createDocChatModelAdapter } from './createDocChatModelAdapter';

function toThreadMessage(message: ChatUiMessage): ThreadMessageLike {
  return {
    id: message.id,
    role: message.role,
    content: [{ type: 'text', text: message.content }],
    status: message.isError
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

function fromThreadLike(messages: readonly ThreadMessageLike[]): ChatUiMessage[] {
  return messages.map((message, index) => {
    const content =
      typeof message.content === 'string'
        ? message.content
        : (message.content ?? [])
            .filter(
              (part): part is { type: 'text'; text: string } =>
                typeof part === 'object' &&
                part !== null &&
                'type' in part &&
                part.type === 'text',
            )
            .map((part) => part.text)
            .join('');
    const custom = message.metadata?.custom as
      | { isSummary?: boolean; isError?: boolean }
      | undefined;
    return {
      id: message.id ?? `msg-${index}`,
      role: (message.role === 'assistant' ? 'assistant' : 'user') as
        | 'user'
        | 'assistant',
      content,
      isSummary: Boolean(custom?.isSummary),
      isError: Boolean(custom?.isError),
    };
  });
}

async function bootstrapMessages(
  pagePath: string,
  summariesUrl?: string,
): Promise<ChatUiMessage[]> {
  let initial: ChatUiMessage[] = [];
  if (typeof sessionStorage !== 'undefined') {
    initial = loadChatHistory(sessionStorage, pagePath);
  }
  if (!initial.some((message) => message.isSummary)) {
    try {
      const result = await loadSummaryV1(pagePath, { url: summariesUrl });
      initial = [
        {
          id: `summary-${pagePath}`,
          role: 'assistant',
          content: buildSummaryCardContent(result),
          isSummary: true,
        },
        ...initial,
      ];
    } catch {
      initial = [
        {
          id: `summary-${pagePath}`,
          role: 'assistant',
          content: buildSummaryCardContent(null, { snapshotMissing: true }),
          isSummary: true,
        },
        ...initial,
      ];
    }
  }
  return initial;
}

export type DocChatRuntimeProviderProps = {
  context: DocChatContext;
  active?: boolean;
  children: ReactNode;
};

type RuntimeInnerProps = {
  context: DocChatContext;
  initialMessages: readonly ThreadMessageLike[];
  children: ReactNode;
};

/**
 * LocalRuntime 内核：assistant-ui 管消息 / 停止 / 重试；
 * 仅注入薄 ChatModelAdapter + 初始摘要/历史。
 */
function DocChatRuntimeInner({
  context,
  initialMessages,
  children,
}: RuntimeInnerProps) {
  const contextRef = useRef(context);
  contextRef.current = context;

  const adapter = useMemo(
    () => createDocChatModelAdapter(() => contextRef.current),
    [],
  );

  const runtime = useLocalRuntime(adapter, { initialMessages });

  const persist = useCallback(() => {
    if (typeof sessionStorage === 'undefined') return;
    const messages = runtime.thread.getState().messages;
    const ui = messages.map((message) => ({
      id: message.id,
      role: (message.role === 'assistant' ? 'assistant' : 'user') as
        | 'user'
        | 'assistant',
      content: message.content
        .filter(
          (part): part is { type: 'text'; text: string } => part.type === 'text',
        )
        .map((part) => part.text)
        .join(''),
      isSummary: Boolean(message.metadata?.custom?.isSummary),
      isError: message.status?.type === 'incomplete',
    }));
    saveChatHistory(sessionStorage, context.pagePath, ui);
  }, [context.pagePath, runtime]);

  useEffect(() => {
    return runtime.thread.subscribe(() => {
      const { isRunning } = runtime.thread.getState();
      if (!isRunning) persist();
    });
  }, [runtime, persist]);

  useEffect(() => {
    const onClear = () => {
      runtime.thread.cancelRun();
      const kept = fromThreadLike(initialMessages).filter((m) => m.isSummary);
      if (typeof sessionStorage !== 'undefined') {
        clearChatHistory(sessionStorage, context.pagePath);
      }
      runtime.thread.reset(kept.map(toThreadMessage));
      saveChatHistory(sessionStorage, context.pagePath, kept);
    };
    window.addEventListener('acongm-chat-clear', onClear);
    return () => window.removeEventListener('acongm-chat-clear', onClear);
  }, [context.pagePath, initialMessages, runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

/**
 * ChatV1 SSE（agent-session-sdk）→ assistant-ui LocalRuntime。
 * portal Drawer 与 chat Fullscreen 共用。
 */
export function DocChatRuntimeProvider({
  context,
  active = true,
  children,
}: DocChatRuntimeProviderProps) {
  const { pagePath, summariesUrl } = context;
  const [seed, setSeed] = useState<readonly ThreadMessageLike[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSeed(null);
    if (!active) return;

    void bootstrapMessages(pagePath, summariesUrl).then((messages) => {
      if (cancelled) return;
      if (typeof sessionStorage !== 'undefined') {
        saveChatHistory(sessionStorage, pagePath, messages);
      }
      setSeed(messages.map(toThreadMessage));
    });

    return () => {
      cancelled = true;
    };
  }, [active, pagePath, summariesUrl]);

  if (!active || !seed) return null;

  // key=pagePath：换文重建 LocalRuntime，避免手写 ExternalStore 状态机
  return (
    <DocChatRuntimeInner
      key={pagePath}
      context={context}
      initialMessages={seed}
    >
      {children}
    </DocChatRuntimeInner>
  );
}
