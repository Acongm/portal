'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@acongm/auth-client';
import { DocsChatShell, type DocChatContext } from '@acongm/chat-ui';
import { usePageBoundChat } from '@acongm/chat-ui/integration';
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

/**
 * Portal Drawer intentionally keeps only a per-user/page chatId pointer in
 * localStorage. Transcript/history always comes from `/api/chats/:id` via the
 * shared chat module integration hook.
 */
export function DocChatEmbed() {
  const pathname = usePathname() || '/';
  const pagePath = toLegacyDocPath(pathname);
  const moduleKey = moduleKeyFromLegacyPath(pagePath);
  const { session, loading: authLoading } = useSession({ ensureAnonymous: true });
  const userId = session?.user.id ?? null;
  const accessToken = session?.access_token ?? null;

  const [title, setTitle] = useState('当前文档');
  const [content, setContent] = useState('');
  const [chips, setChips] = useState<KnowledgeRef[]>([]);
  const articleIndex = usePortalArticleIndex();
  const registry = useMemo(() => getDocModulesRegistry(), []);

  const {
    chatId,
    seedMessages,
    ready: chatReady,
    ensureChat,
  } = usePageBoundChat({
    userId,
    accessToken,
    pagePath,
    moduleKey,
    pointerKey: userId ? pointerKey(userId, pagePath) : '',
    chatsBaseUrl: CHAT_BASE,
    title,
    chips,
    metadata: {
      surface: 'portal',
      routePath: pathname,
    },
  });

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
