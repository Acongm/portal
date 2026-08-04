import type { LoaderOutput } from 'fumadocs-core/source';
import { getDomainIdForLegacyFolder } from '@/lib/modules.registry';

function posixDirname(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx === -1 ? '' : normalized.slice(0, idx);
}

function splitHash(href: string): { path: string; hash?: string } {
  const idx = href.indexOf('#');
  if (idx === -1) return { path: href };
  return { path: href.slice(0, idx), hash: href.slice(idx + 1) };
}

function withHash(url: string, hash?: string): string {
  return hash ? `${url}#${hash}` : url;
}

/** 相对链接候选：.md→.mdx、README→index、去扩展名等 */
export function relativeHrefVariants(path: string): string[] {
  const variants = new Set<string>([path]);

  const add = (value: string) => {
    if (value) variants.add(value);
  };

  if (path.endsWith('.md')) {
    add(`${path.slice(0, -3)}.mdx`);
    if (/(^|\/)README\.md$/i.test(path)) {
      add(path.replace(/README\.md$/i, 'index.mdx'));
      add(path.replace(/README\.md$/i, 'index.md'));
    }
  }

  if (path.endsWith('.mdx') && /(^|\/)README\.mdx$/i.test(path)) {
    add(path.replace(/README\.mdx$/i, 'index.mdx'));
  }

  if (path.endsWith('.html')) {
    const stem = path.slice(0, -5);
    add(`${stem}.mdx`);
    add(`${stem}.md`);
    add(`${stem}/index.mdx`);
  }

  if (
    !/\.(md|mdx|html|ts|tsx|js|jsx|json|svg|png|jpg|gif|webp)$/i.test(path)
  ) {
    add(`${path}.mdx`);
    add(`${path}.md`);
    add(`${path}/index.mdx`);
  }

  return [...variants];
}

/**
 * 将 VuePress 时代绝对路径 `/react/foo.md` 映射到
 * `/docs/{domain}/react/foo`
 */
export function remapLegacyAbsolutePath(pathname: string): string | null {
  const { path, hash } = splitHash(pathname);
  if (!path.startsWith('/')) return null;
  if (
    path.startsWith('/docs/') ||
    path.startsWith('/images/') ||
    path.startsWith('/api/') ||
    path.startsWith('/og/') ||
    path === '/'
  ) {
    return null;
  }

  const cleaned = path.replace(/\/+$/, '').replace(/\.(md|mdx|html)$/i, '');
  const segments = cleaned.split('/').filter(Boolean);
  if (!segments.length) return null;

  const folder = segments[0];
  const domain = getDomainIdForLegacyFolder(folder);
  if (!domain) return null;

  const rest = segments.slice(1);
  const url =
    rest.length === 0
      ? `/docs/${domain}/${folder}`
      : `/docs/${domain}/${folder}/${rest.join('/')}`;
  return withHash(url, hash);
}

function remapCrossDomainModulePath(joinedPath: string): string[] {
  const parts = joinedPath.split('/').filter(Boolean);
  if (parts.length < 2) return [];

  const maybeDomain = parts[0];
  const moduleFolder = parts[1];
  const correctDomain = getDomainIdForLegacyFolder(moduleFolder);
  if (!correctDomain || correctDomain === maybeDomain) return [];

  const remapped = [correctDomain, ...parts.slice(1)].join('/');
  return relativeHrefVariants(remapped);
}

function joinVirtual(dir: string, relativeHref: string): string {
  const parts = [...dir.split('/').filter(Boolean)];
  for (const seg of relativeHref.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join('/');
}

/**
 * 解析 MDX 内链到当前 docs 路由。
 * 解决：.md→.mdx、README→index、无尾斜杠首页相对路径、旧绝对路径、跨领域模块迁移。
 */
export function resolveDocHref(
  // fumadocs LoaderOutput 泛型随 MDX schema 变化，这里放宽以便 web 侧复用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: LoaderOutput<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  href: string,
): string {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;

  const { path, hash } = splitHash(href);
  if (!path) return href;

  if (path.startsWith('./') || path.startsWith('../')) {
    const dir = posixDirname(page.path);
    for (const candidate of relativeHrefVariants(path)) {
      const hit = source.getPageByHref(candidate, {
        dir,
        language: page.locale,
      });
      if (hit?.page) {
        return withHash(hit.page.url, hash ?? hit.hash);
      }
    }

    const joined = joinVirtual(dir, path);
    for (const remappedFile of remapCrossDomainModulePath(joined)) {
      const hit = source.getPages(page.locale).find((item) => {
        const stems = relativeHrefVariants(remappedFile).map((v) =>
          v.replace(/\.(md|mdx|html)$/i, ''),
        );
        const itemStem = item.path.replace(/\.(md|mdx)$/i, '');
        return stems.includes(itemStem) || stems.includes(item.path);
      });
      if (hit) return withHash(hit.url, hash);
    }

    return href;
  }

  if (path.startsWith('/')) {
    const remapped = remapLegacyAbsolutePath(href);
    if (remapped) {
      const noHash = remapped.split('#')[0];
      const pageHit = source
        .getPages(page.locale)
        .find((item) => item.url === noHash);
      if (pageHit) return withHash(pageHit.url, hash);
      return remapped;
    }
  }

  if (path.startsWith('/docs/') && /\.(md|mdx|html)$/i.test(path)) {
    const cleaned = path.replace(/\.(md|mdx|html)$/i, '');
    const pageHit = source
      .getPages(page.locale)
      .find((item) => item.url === cleaned);
    if (pageHit) return withHash(pageHit.url, hash);
    return withHash(cleaned, hash);
  }

  return href;
}
