'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@acongm/auth-client';
import { DocsChatShell, type DocChatContext } from '@acongm/chat-ui';
import {
  createChatV2,
  getChatV2,
  selectActiveChatBranch,
} from '@acongm/agent-session-sdk';
import type { ChatUiMessage, ChatV2Message } from '@acongm/kb-types';
import {
  createArticleRef,
  searchKnowledgeCatalog,
  type KnowledgeRef,
  type KnowledgeSearchHit,
} from '@acongm/kb-catalog';
import {
  extractDocPageContent,
  moduleKeyFromLegacyPath,
  readDocPageTitle,
  toLegacyDocPath,
} from '@/lib/doc-chat-path';
import { getDocModulesRegistry } from '@/lib/modules.registry';
import { usePortalArticleIndex } from '@/lib/use-portal-article-index';

const CHAT_BASE = '/api/chats';

function pointerKey(userId: string, pagePath: string): string {
  return `acongm.portal.chat.v2:${userId}:${pagePath}`;
}

function textPart(message: ChatV2Message): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } =>
      part.type === 'text' && 'text' in part && typeof part.text === 'string',
    )
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function reasoningPart(message: ChatV2Message): string {
  return message.parts
    .filter((part): part is { type: 'reasoning'; text: string } =>
      part.type === 'reasoning' &&
      'text' in part &&
      typeof part.text === 'string',
    )
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function toUiMessages(messages: readonly ChatV2Message[]): ChatUiMessage[] {
  return messages
    .filter(
      (message) => message.role === 'user' || message.role === 'assistant',
    )
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: textPart(message),
      ...(message.role === 'assistant' && reasoningPart(message)
        ? { thinking: reasoningPart(message) }
        : {}),
    }));
}

/**
 * Portal Drawer intentionally keeps only a per-user/page chatId pointer in
 * localStorage. Once that pointer exists, transcript/history always comes from
 * `/api/chats/:id`; sessionStorage is only a draft/bootstrap UI cache.
 */
export function DocChatEmbed() {
  const pathname = usePathname() || '/';
  const pagePath = toLegacyDocPath(pathname);
  const moduleKey = moduleKeyFromLegacyPath(pagePath);
  const { session, loading: authLoading } = useSession();
  const userId = session?.user.id ?? null;
  const accessToken = session?.access_token ?? null;

  const [title, setTitle] = useState('当前文档');
  const [content, setContent] = useState('');
  const [chips, setChips] = useState<KnowledgeRef[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [seedMessages, setSeedMessages] = useState<ChatUiMessage[] | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const articleIndex = usePortalArticleIndex();
  const registry = useMemo(() => getDocModulesRegistry(), []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTitle(readDocPageTitle());
      setContent(extractDocPageContent());
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!moduleKey) {
      setChips([]);
      return;
    }
    setChips([
      createArticleRef({
        moduleKey,
        pagePath,
        title: title || moduleKey,
      }),
    ]);
  }, [moduleKey, pagePath, title]);

  useEffect(() => {
    let cancelled = false;
    setChatId(null);
    setSeedMessages(null);
    setChatReady(false);

    if (!userId || !accessToken) return;
    const key = pointerKey(userId, pagePath);
    const stored = localStorage.getItem(key)?.trim();
    if (!stored) {
      setChatReady(true);
      return;
    }

    void getChatV2(stored, {
      baseUrl: CHAT_BASE,
      accessToken,
    })
      .then((detail) => {
        if (cancelled) return;
        if (
          detail.chat.userId !== userId ||
          (detail.chat.pagePath && detail.chat.pagePath !== pagePath)
        ) {
          localStorage.removeItem(key);
          setChatReady(true);
          return;
        }
        setChatId(detail.chat.id);
        setSeedMessages(
          toUiMessages(selectActiveChatBranch(detail.messages)),
        );
        setChatReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(key);
        setChatReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, accessToken, pagePath]);

  const ensureChat = useCallback(
    async (input?: { title?: string }) => {
      if (chatId) return chatId;
      if (!userId || !accessToken) {
        throw new Error('安全会话尚未准备完成，请稍后重试。');
      }
      const primary = chips[0];
      const created = await createChatV2(
        {
          title:
            input?.title?.trim().slice(0, 80) ||
            primary?.title ||
            title ||
            undefined,
          pagePath: primary?.pagePath || pagePath,
          moduleKey: primary?.moduleKey || moduleKey || undefined,
          metadata: {
            surface: 'portal',
            routePath: pathname,
          },
        },
        { baseUrl: CHAT_BASE, accessToken },
      );
      localStorage.setItem(pointerKey(userId, pagePath), created.id);
      setChatId(created.id);
      return created.id;
    }, [chatId, userId, accessToken, chips, title, pagePath, moduleKey, pathname],
  );

  const context = useMemo<DocChatContext>(() => {
    const primary = chips[0];
    return {
      pagePath: primary?.pagePath || pagePath,
      moduleKey: primary?.moduleKey || moduleKey,
      title: primary?.title || title,
      content,
      tags: [],
      historyMode: 'long',
      callSourcePrefix: 'portal',
      enableThinking: true,
      chatId: chatId ?? undefined,
      chatsBaseUrl: CHAT_BASE,
      accessToken,
      ensureChat,
      onChatPersisted: () => undefined,
      // Stable across draft→durable-chat promotion; identity/page changes remount.
      runtimeKey: userId ? `portal:${userId}:${pagePath}` : `portal:${pagePath}`,
    };
  }, [
    chips,
    pagePath,
    moduleKey,
    title,
    content,
    chatId,
    accessToken,
    ensureChat,
    userId,
  ]);

  const resolveMentionHits = useCallback(
    (query: string): KnowledgeSearchHit[] =>
      searchKnowledgeCatalog({
        registry,
        isolation: { allowedDomains: [], allowedModules: [] },
        articles: articleIndex.articles,
        query,
        limit: 16,
      }),
    [registry, articleIndex.articles],
  );

  const onChipsChange = useCallback((next: KnowledgeRef[]) => {
    setChips(next);
  }, []);

  if (authLoading || !session || !chatReady) return null;

  return (
    <DocsChatShell
      context={context}
      seedMessages={seedMessages}
      chips={chips}
      onChipsChange={onChipsChange}
      resolveMentionHits={resolveMentionHits}
    />
  );
}
