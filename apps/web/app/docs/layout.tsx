import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { SiteDocsContainer } from '@/components/site-docs-container';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      nav={{ enabled: false }}
      slots={{
        container: SiteDocsContainer,
      }}
    >
      {children}
    </DocsLayout>
  );
}
