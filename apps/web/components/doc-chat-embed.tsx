'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DocsChatShell, type DocChatContext } from '@acongm/chat-ui';
import {
  extractDocPageContent,
  moduleKeyFromLegacyPath,
  readDocPageTitle,
  toLegacyDocPath,
} from '@/lib/doc-chat-path';

/**
 * P1-10 / P4-04：在文档页嵌入 ChatDrawer，并随路由更新 context。
 * 不跳转独立 chat；pagePath / moduleKey 由 portal 路径派生。
 */
export function DocChatEmbed() {
  const pathname = usePathname() || '/';
  const pagePath = toLegacyDocPath(pathname);
  const [title, setTitle] = useState('当前文档');
  const [content, setContent] = useState('');

  useEffect(() => {
    // 等正文 hydration 后再取 DOM
    const frame = requestAnimationFrame(() => {
      setTitle(readDocPageTitle());
      setContent(extractDocPageContent());
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const context = useMemo<DocChatContext>(
    () => ({
      pagePath,
      moduleKey: moduleKeyFromLegacyPath(pagePath),
      title,
      content,
      tags: [],
    }),
    [pagePath, title, content],
  );

  return <DocsChatShell context={context} />;
}
