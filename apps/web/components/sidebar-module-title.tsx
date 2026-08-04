'use client';

import { useTreeContext } from 'fumadocs-ui/contexts/tree';

export function SidebarModuleTitle() {
  const { root } = useTreeContext();

  if (!root.name) return null;

  return (
    <p className="px-2 text-base font-semibold text-fd-foreground leading-tight">
      {root.name}
    </p>
  );
}
