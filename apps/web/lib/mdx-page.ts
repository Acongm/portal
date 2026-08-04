import type { MDXComponents } from 'mdx/types';

/** 模块首页 MDX 常与 frontmatter title 重复渲染 h1 */
export function shouldSuppressLeadingH1(slug?: string[]): boolean {
  if (!slug || slug.length === 0) return true;
  // /docs/<domain> or /docs/<domain>/<module>
  if (slug.length <= 2) return true;
  const last = slug[slug.length - 1];
  return last === 'index' || last === 'INDEX';
}

export function withSuppressLeadingH1(
  components: MDXComponents,
  enabled: boolean,
): MDXComponents {
  if (!enabled) return components;
  return {
    ...components,
    h1: () => null,
  };
}
