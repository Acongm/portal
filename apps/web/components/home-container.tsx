'use client';

import { cn } from 'cnfast';
import type { ComponentProps } from 'react';

/** 覆盖 Fumadocs Home 默认 [--fd-layout-width:1400px]，与文档全宽一致 */
export function HomeContainer({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      id="nd-home-layout"
      {...props}
      className={cn('flex flex-1 flex-col [--fd-layout-width:100%]', className)}
    />
  );
}
