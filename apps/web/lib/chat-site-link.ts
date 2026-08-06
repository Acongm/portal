import { moduleFolderFromLegacyPath } from '@/lib/doc-chat-path';

const DEFAULT_CHAT_BASE =
  process.env.NEXT_PUBLIC_CHAT_URL?.trim() || 'https://chat.acongm.com';

/**
 * portal pagePath → chat.acongm.com 深链
 * /career/interview-prep/README.md → /c/interview-prep?title=...
 * /react/react16.md → /c/react/react16?title=...
 */
export function buildChatSiteUrl(options: {
  pagePath: string;
  title?: string;
  base?: string;
}): string {
  const base = (options.base ?? DEFAULT_CHAT_BASE).replace(/\/$/, '');
  const { folder, slugParts } = moduleFolderFromLegacyPath(options.pagePath);
  if (!folder) return base;

  const path =
    slugParts.length > 0
      ? `${base}/c/${encodeURIComponent(folder)}/${slugParts.map(encodeURIComponent).join('/')}`
      : `${base}/c/${encodeURIComponent(folder)}`;

  const url = new URL(path);
  if (options.title?.trim()) {
    url.searchParams.set('title', options.title.trim());
  }
  return url.toString();
}
