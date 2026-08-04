import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { DocsNavHeader } from '@/components/docs-nav-header';
import { SidebarModuleTitle } from '@/components/sidebar-module-title';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const { nav, ...rest } = baseOptions();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...rest}
      tabs={false}
      nav={{ ...nav, mode: 'top' }}
      slots={{
        header: DocsNavHeader,
      }}
      sidebar={{
        collapsible: true,
        defaultOpenLevel: 1,
        banner: SidebarModuleTitle,
      }}
    >
      {children}
    </DocsLayout>
  );
}
