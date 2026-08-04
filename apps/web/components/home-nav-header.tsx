'use client';

import { useHomeLayout } from 'fumadocs-ui/layouts/home';
import type { ComponentProps } from 'react';
import { SiteNavBar } from '@/components/site-nav-bar';

export function HomeNavHeader(props: ComponentProps<'header'>) {
  const { slots, props: layoutProps } = useHomeLayout();

  return <SiteNavBar slots={slots} nav={layoutProps.nav} {...props} />;
}
