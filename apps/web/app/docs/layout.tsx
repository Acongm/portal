import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { docDomains, getDomainHref } from '@/lib/modules.registry';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const base = baseOptions();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...base}
      // 领域菜单只给首页顶栏；docs 侧栏仅渲染当前模块 page tree
      links={[]}
      // 侧栏 Tab 只保留领域切换；模块级 root 负责隔离具体目录
      tabs={docDomains.map((domain) => ({
        title: domain.title,
        description: domain.description,
        url: getDomainHref(domain.id),
      }))}
      sidebar={{
        collapsible: true,
        // 模块内各级目录默认全部展开，保证任意深度页面看到的模块 tree 一致、完整
        defaultOpenLevel: 99,
      }}
    >
      {children}
    </DocsLayout>
  );
}
