import type { MDXComponents } from 'mdx/types';

/**
 * DocsPage 已渲染 DocsTitle；MDX 正文再出 h1 会双标题。
 * 所有文档页统一抑制正文首个 h1。
 */
export function shouldSuppressLeadingH1(_slug?: string[]): boolean {
  return true;
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
