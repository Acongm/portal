import navbar from '../../../scripts/vuepress-navbar.json';
import { vuepressPathToPortalUrl } from './navbar';

export type VuepressNavLink = {
  type: 'link';
  text: string;
  url: string;
  external?: boolean;
};

export type VuepressNavGroup = {
  type: 'group';
  text: string;
  children: VuepressNavNode[];
};

export type VuepressNavNode = VuepressNavLink | VuepressNavGroup;

function pathToLabel(path: string): string {
  let p = path.replace(/^\//, '').replace(/\.md$/, '');
  if (p.endsWith('/')) p = p.slice(0, -1);
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 0) return '首页';
  const last = parts[parts.length - 1];
  if (last === 'README') return parts[parts.length - 2] ?? '首页';
  return last;
}

function normalizeEntry(entry: unknown): VuepressNavNode | null {
  if (typeof entry === 'string') {
    const url = vuepressPathToPortalUrl(entry);
    return {
      type: 'link',
      text: pathToLabel(entry),
      url,
      external: url.startsWith('http'),
    };
  }

  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    if (typeof obj.link === 'string') {
      const url = vuepressPathToPortalUrl(obj.link);
      return {
        type: 'link',
        text: String(obj.text ?? pathToLabel(obj.link)),
        url,
        external: url.startsWith('http'),
      };
    }

    if (Array.isArray(obj.children) && typeof obj.text === 'string') {
      const children = obj.children
        .map(normalizeEntry)
        .filter((item): item is VuepressNavNode => item !== null);
      return {
        type: 'group',
        text: obj.text,
        children,
      };
    }
  }

  return null;
}

export const vuepressNavbarTree: VuepressNavGroup[] = (navbar as unknown[])
  .map((item) => normalizeEntry(item))
  .filter((item): item is VuepressNavGroup => item?.type === 'group');
