'use client';

import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import type { ComponentProps } from 'react';
import { SiteNavBar } from '@/components/site-nav-bar';

export function DocsNavHeader(props: ComponentProps<'header'>) {
  const { slots, props: layoutProps } = useNotebookLayout();

  return (
    <SiteNavBar
      slots={slots}
      nav={layoutProps.nav}
      docsMode
      {...props}
    />
  );
}
