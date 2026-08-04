import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { docDomains, getDomainHref } from '@/lib/modules.registry';
import { pickSidebarTree } from '@/lib/sidebar-tree';
import { DocChatEmbed } from '@/components/doc-chat-embed';
import '@acongm/ui-theme/tokens.css';
import '@acongm/chat-ui/styles.css';

/**
 * 放在 [[...slug]] 以便按路由选取领域级 sidebar tree。
 * 领域首页与模块深页共用同一棵领域树（如 /docs/engineering 与 webpack 深页一致）。
 */
export default async function DocsSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const base = baseOptions();
  const fullTree = source.getPageTree();
  const tree = pickSidebarTree(fullTree, slug);

  return (
    <DocsLayout
      tree={tree}
      {...base}
      // 领域菜单只给首页顶栏；docs 侧栏渲染当前领域完整 page tree
      links={[]}
      tabs={docDomains.map((domain) => ({
        title: domain.title,
        description: domain.description,
        url: getDomainHref(domain.id),
      }))}
      sidebar={{
        collapsible: true,
        // pickSidebarTree 已强制领域树展开；保留高 defaultOpenLevel 兜底
        defaultOpenLevel: 99,
      }}
    >
      {children}
      <DocChatEmbed />
    </DocsLayout>
  );
}
