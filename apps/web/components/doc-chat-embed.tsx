'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DocsChatShell, type DocChatContext } from '@acongm/chat-ui';
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

/**
 * 文档页嵌入 ChatDrawer；与 chat 站共用 Composer（+/@/chips）与接口。
 * 当前文章自动写入关联知识；顶栏「关联」入口通过事件打开抽屉并弹出选择器。
 */
export function DocChatEmbed() {
  const pathname = usePathname() || '/';
  const pagePath = toLegacyDocPath(pathname);
  const moduleKey = moduleKeyFromLegacyPath(pagePath);
  const [title, setTitle] = useState('当前文档');
  const [content, setContent] = useState('');
  const [chips, setChips] = useState<KnowledgeRef[]>([]);
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

  const context = useMemo<DocChatContext>(() => {
    const primary = chips[0];
    return {
      pagePath: primary?.pagePath || pagePath,
      moduleKey: primary?.moduleKey || moduleKey,
      title: primary?.title || title,
      content,
      tags: [],
      historyMode: 'short',
      callSourcePrefix: 'portal',
      enableThinking: true,
    };
  }, [chips, pagePath, moduleKey, title, content]);

  const resolveMentionHits = useCallback(
    (query: string): KnowledgeSearchHit[] =>
      searchKnowledgeCatalog({
        registry,
        isolation: {
          allowedDomains: [],
          allowedModules: [],
        },
        articles: articleIndex.articles,
        query,
        limit: 16,
      }),
    [registry, articleIndex.articles],
  );

  const onChipsChange = useCallback((next: KnowledgeRef[]) => {
    setChips(next);
  }, []);

  return (
    <DocsChatShell
      context={context}
      chips={chips}
      onChipsChange={onChipsChange}
      resolveMentionHits={resolveMentionHits}
    />
  );
}
