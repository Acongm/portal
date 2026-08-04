import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { docDomains, getDomainHref } from '@/lib/modules.registry';
import { pickSidebarTree } from '@/lib/sidebar-tree';
import { DocChatEmbed } from '@/components/doc-chat-embed';
import '@acongm/ui-theme/tokens.css';
import '@acongm/chat-ui/styles.css';

/**
 * 放在 [[...slug]] 以便按路由选取模块 root tree。
 * 避免中文 URL 编解码不一致时 fumadocs searchPath 失败回退整棵领域树。
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
      // 领域菜单只给首页顶栏；docs 侧栏仅渲染当前模块 / 领域 page tree
      links={[]}
      tabs={docDomains.map((domain) => ({
        title: domain.title,
        description: domain.description,
        url: getDomainHref(domain.id),
      }))}
      sidebar={{
        collapsible: true,
        // pickSidebarTree 已对文件夹设 collapsible:false + defaultOpen:true；
        // 仍保留高 defaultOpenLevel 作为兜底
        defaultOpenLevel: 99,
      }}
    >
      {children}
      <DocChatEmbed />
    </DocsLayout>
  );
}
