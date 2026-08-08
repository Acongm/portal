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

function textPartsOf(content: ThreadMessageLike['content']): { text: string; thinking: string } {
  if (typeof content === 'string') return { text: content, thinking: '' };
  const parts = content ?? [];
  const text = parts.filter((part): part is { type: 'text'; text: string } => typeof part === 'object' && part !== null && 'type' in part && part.type === 'text').map((part) => part.text).join('');
  const thinking = parts.filter((part): part is { type: 'reasoning'; text: string } => typeof part === 'object' && part !== null && 'type' in part && part.type === 'reasoning').map((part) => part.text).join('');
  return { text, thinking };
}

function toThreadMessage(message: ChatUiMessage): ThreadMessageLike {
  const thinking = message.thinking?.trim() || '';
  const text = message.content || '';
  const content = [
    ...(thinking && message.role === 'assistant' ? [{ type: 'reasoning' as const, text: thinking }] : []),
    ...(text ? [{ type: 'text' as const, text }] : []),
  ];
  const base: ThreadMessageLike = {
    id: message.id,
    role: message.role,
    content: content.length ? content : [{ type: 'text', text: '' }],
    metadata: { custom: { isSummary: Boolean(message.isSummary), isError: Boolean(message.isError) } },
  };
  if (message.role !== 'assistant') return base;
  return {
    ...base,
    status: message.isError
      ? { type: 'incomplete', reason: 'error', error: message.content }
      : { type: 'complete', reason: 'stop' },
  };
}

function fromThreadLike(messages: readonly ThreadMessageLike[]): ChatUiMessage[] {
  return messages.map((message, index) => {
    const { text, thinking } = textPartsOf(message.content);
    const custom = message.metadata?.custom as { isSummary?: boolean; isError?: boolean } | undefined;
    return {
      id: message.id ?? `msg-${index}`,
      role: (message.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: text,
      ...(thinking ? { thinking } : {}),
      isSummary: Boolean(custom?.isSummary),
      isError: Boolean(custom?.isError),
    };
  });
}

function historyKey(context: DocChatContext): string {
  if (context.runtimeKey?.trim()) return context.runtimeKey.trim();
  if (context.chatId?.trim()) return `chat:${context.chatId.trim()}`;
  return context.threadId ? `thread:${context.threadId}` : context.pagePath;
}

async function bootstrapMessages(storageKey: string, pagePath: string, summariesUrl?: string, skipSummary = false): Promise<ChatUiMessage[]> {
  let initial: ChatUiMessage[] = [];
  if (typeof sessionStorage !== 'undefined') initial = loadChatHistory(sessionStorage, storageKey);
  if (skipSummary) return initial;
  if (!initial.some((message) => message.isSummary)) {
    try {
      const result = await loadSummaryV1(pagePath, { url: summariesUrl });
      initial = [{ id: `summary-${pagePath}`, role: 'assistant', content: buildSummaryCardContent(result), isSummary: true }, ...initial];
    } catch {
      initial = [{ id: `summary-${pagePath}`, role: 'assistant', content: buildSummaryCardContent(null, { snapshotMissing: true }), isSummary: true }, ...initial];
    }
  }
  return initial;
}

export type DocChatRuntimeProviderProps = {
  context: DocChatContext;
  active?: boolean;
  seedMessages?: ChatUiMessage[] | null;
  children: ReactNode;
};

type RuntimeInnerProps = { context: DocChatContext; initialMessages: readonly ThreadMessageLike[]; children: ReactNode };

function DocChatRuntimeInner({ context, initialMessages, children }: RuntimeInnerProps) {
  const contextRef = useRef(context);
  contextRef.current = context;
  const adapter = useMemo(() => createDocChatModelAdapter(() => contextRef.current), []);
  const runtime = useLocalRuntime(adapter, { initialMessages });

  const persist = useCallback(() => {
    if (typeof sessionStorage === 'undefined') return;
    const messages = runtime.thread.getState().messages;
    const ui = messages.map((message) => {
      const text = message.content.filter((part): part is { type: 'text'; text: string } => part.type === 'text').map((part) => part.text).join('');
      const thinking = message.content.filter((part): part is { type: 'reasoning'; text: string } => part.type === 'reasoning').map((part) => part.text).join('').trim();
      return {
        id: message.id,
        role: (message.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: text,
        ...(thinking ? { thinking } : {}),
        isSummary: Boolean(message.metadata?.custom?.isSummary),
        isError: message.status?.type === 'incomplete',
      };
    });
    saveChatHistory(sessionStorage, historyKey(context), ui);
  }, [context, runtime]);

  useEffect(() => runtime.thread.subscribe(() => {
    const { isRunning } = runtime.thread.getState();
    if (!isRunning) persist();
  }), [runtime, persist]);

  useEffect(() => {
    const onClear = () => {
      runtime.thread.cancelRun();
      const kept = fromThreadLike(initialMessages).filter((m) => m.isSummary);
      if (typeof sessionStorage !== 'undefined') clearChatHistory(sessionStorage, historyKey(context));
      runtime.thread.reset(kept.map(toThreadMessage));
      if (typeof sessionStorage !== 'undefined') saveChatHistory(sessionStorage, historyKey(context), kept);
    };
    window.addEventListener('acongm-chat-clear', onClear);
    return () => window.removeEventListener('acongm-chat-clear', onClear);
  }, [context, initialMessages, runtime]);

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

function seedFingerprint(seed: ChatUiMessage[] | null | undefined): string {
  if (seed == null) return 'null';
  return seed.map((m) => `${m.id}\0${m.role}\0${m.content}\0${m.thinking ?? ''}\0${m.isSummary ? 1 : 0}`).join('\n');
}

export function DocChatRuntimeProvider({ context, active = true, seedMessages = null, children }: DocChatRuntimeProviderProps) {
  const { pagePath, summariesUrl, threadId } = context;
  const storageKey = historyKey(context);
  const [seed, setSeed] = useState<readonly ThreadMessageLike[] | null>(null);
  const seedKey = seedFingerprint(seedMessages);
  const seedMessagesRef = useRef(seedMessages);
  seedMessagesRef.current = seedMessages;
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;
  const prevStorageKeyRef = useRef(storageKey);

  useEffect(() => {
    let cancelled = false;
    if (!active) {
      setSeed(null);
      return;
    }
    const storageChanged = prevStorageKeyRef.current !== storageKey;
    prevStorageKeyRef.current = storageKey;
    if (storageChanged) setSeed(null);

    const load = async () => {
      const external = seedMessagesRef.current;
      if (external != null) return external;
      const skipSummary = Boolean(context.chatId) || Boolean(threadIdRef.current) || pagePath === '/' || context.moduleKey === '_general';
      return bootstrapMessages(storageKey, pagePath, summariesUrl, skipSummary);
    };

    void load().then((messages) => {
      if (cancelled) return;
      if (typeof sessionStorage !== 'undefined') {
        if (messages.length > 0) saveChatHistory(sessionStorage, storageKey, messages);
        else if (loadChatHistory(sessionStorage, storageKey).length === 0) saveChatHistory(sessionStorage, storageKey, messages);
      }
      setSeed(messages.map(toThreadMessage));
    });
    return () => { cancelled = true; };
  }, [active, pagePath, summariesUrl, storageKey, context.moduleKey, context.chatId, seedKey]);

  if (!active || !seed) return null;
  return <DocChatRuntimeInner key={storageKey} context={context} initialMessages={seed}>{children}</DocChatRuntimeInner>;
}
