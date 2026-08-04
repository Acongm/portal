import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { ComponentProps, FC } from 'react';
import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import { resolveDocHref } from '@/lib/doc-links';

/**
 * 替代 fumadocs createRelativeLink：在原生解析之上补齐
 * .md→.mdx / README→index / 旧绝对路径 / 跨领域模块迁移。
 */
export function createDocRelativeLink<C extends LoaderConfig>(
  source: LoaderOutput<C>,
  page: Page | C['page'],
  OverrideLink: FC<ComponentProps<'a'>> = defaultMdxComponents.a,
): FC<ComponentProps<'a'>> {
  return function DocRelativeLink({ href, ...props }) {
    const resolved = href
      ? resolveDocHref(source as unknown as LoaderOutput<LoaderConfig>, page, href)
      : href;
    return <OverrideLink href={resolved} {...props} />;
  };
}
