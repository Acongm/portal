import {
  moduleFolderFromLegacyPath as catalogModuleFolder,
} from '@acongm/kb-catalog';
import { allDocDomains, getDocModulesRegistry } from '@/lib/modules.registry';

const DOMAIN_IDS = allDocDomains.map((d) => d.id);

function safeDecodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * portal 路由 → summaries-v1 / ChatV1 pagePath
 * /docs/core/react/react16 → /react/react16.md
 */
export function toLegacyDocPath(pathname: string): string {
  let path = safeDecodePath(String(pathname || '/').split(/[?#]/)[0]);
  if (!path.startsWith('/')) path = `/${path}`;

  const domainMatch = path.match(/^\/docs\/([^/]+)(\/.*)?$/);
  if (domainMatch && DOMAIN_IDS.includes(domainMatch[1])) {
    path = domainMatch[2] || '/';
  } else if (path.startsWith('/docs/')) {
    path = path.slice('/docs'.length) || '/';
  }

  if (!path.startsWith('/')) path = `/${path}`;
  if (path.endsWith('.html')) path = path.replace(/\.html$/, '.md');
  if (path.endsWith('/')) {
    path = `${path}README.md`;
  } else if (!/\.(md|mdx)$/i.test(path)) {
    const segments = path.replace(/^\//, '').split('/').filter(Boolean);
    if (segments.length === 1) {
      path = `/${segments[0]}/README.md`;
    } else {
      path = `${path}.md`;
    }
  }
  if (path.endsWith('.mdx')) path = path.replace(/\.mdx$/, '.md');
  return path;
}

export function moduleKeyFromLegacyPath(pagePath: string): string {
  const segments = pagePath.replace(/^\//, '').split('/').filter(Boolean);
  return segments[0] || '';
}

/** legacy pagePath → chat 站 moduleKey（doc-modules folder）与文章 slug */
export function moduleFolderFromLegacyPath(pagePath: string): {
  folder: string;
  slugParts: string[];
} {
  return catalogModuleFolder(getDocModulesRegistry(), pagePath);
}

const MAX_ARTICLE_CHARS = 8000;

export function extractDocPageContent(): string {
  if (typeof document === 'undefined') return '';
  const selectors = [
    '#nd-page article',
    '#nd-page .prose',
    '#nd-page',
    'article',
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      const normalized = element.textContent.replace(/\s+/g, ' ').trim();
      if (normalized.length <= MAX_ARTICLE_CHARS) return normalized;
      return `${normalized.slice(0, MAX_ARTICLE_CHARS)}…`;
    }
  }
  return '';
}

export function readDocPageTitle(): string {
  if (typeof document === 'undefined') return '当前文档';
  const heading = document.querySelector('#nd-page h1');
  if (heading?.textContent?.trim()) return heading.textContent.trim();
  return document.title.replace(/\s*\|\s*acongm\s*$/i, '') || '当前文档';
}
