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
import { buildChatSiteUrl } from '@/lib/chat-site-link';

/**
 * P1-10 / P4-04：在文档页嵌入 ChatDrawer，并随路由更新 context。
 * 可通过右下角「全屏对话」跳转 chat.acongm.com（同 pagePath / moduleKey）。
 */
export function DocChatEmbed() {
  const pathname = usePathname() || '/';
  const pagePath = toLegacyDocPath(pathname);
  const [title, setTitle] = useState('当前文档');
  const [content, setContent] = useState('');

  useEffect(() => {
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

  const chatSiteUrl = useMemo(
    () => buildChatSiteUrl({ pagePath, title }),
    [pagePath, title],
  );

  return (
    <>
      <DocsChatShell context={context} />
      <a
        href={chatSiteUrl}
        target="_blank"
        rel="noreferrer"
        className="acongm-chat-site-link"
        title="在 chat.acongm.com 打开全屏对话（保留当前文章上下文）"
      >
        全屏对话
      </a>
    </>
  );
}
