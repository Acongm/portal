const DEFAULT_CHAT_BASE =
  process.env.NEXT_PUBLIC_CHAT_URL?.trim() || 'https://chat.acongm.com';

/**
 * portal pagePath → chat.acongm.com 深链
 * /react/react16.md → /c/react/react16?title=...
 */
export function buildChatSiteUrl(options: {
  pagePath: string;
  title?: string;
  base?: string;
}): string {
  const base = (options.base ?? DEFAULT_CHAT_BASE).replace(/\/$/, '');
  const segments = options.pagePath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);
  const moduleKey = segments[0];
  if (!moduleKey) return base;

  const slugParts = segments
    .slice(1)
    .map((part) => part.replace(/\.mdx?$/i, ''))
    .filter(Boolean);

  const path =
    slugParts.length > 0
      ? `${base}/c/${encodeURIComponent(moduleKey)}/${slugParts.map(encodeURIComponent).join('/')}`
      : `${base}/c/${encodeURIComponent(moduleKey)}`;

  const url = new URL(path);
  if (options.title?.trim()) {
    url.searchParams.set('title', options.title.trim());
  }
  return url.toString();
}
