'use client';

import { Container as DocsGridContainer } from 'fumadocs-ui/layouts/docs/slots/container';
import type { ComponentProps } from 'react';
import { DocsSiteHeader } from '@/components/site-header';

export function SiteDocsContainer(props: ComponentProps<'div'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DocsSiteHeader />
      <DocsGridContainer {...props} />
    </div>
  );
}
