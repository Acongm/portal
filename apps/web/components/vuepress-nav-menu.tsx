'use client';

import Link from 'fumadocs-core/link';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'fumadocs-ui/components/ui/navigation-menu';
import { ChevronRight } from 'lucide-react';
import { vuepressNavbarTree } from '@/lib/vuepress-navbar';
import type {
  VuepressNavGroup,
  VuepressNavLink,
  VuepressNavNode,
} from '@/lib/vuepress-navbar';

function NavLeaf({ item, nested }: { item: VuepressNavLink; nested?: boolean }) {
  const className =
    'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground whitespace-nowrap';

  if (nested) {
    return (
      <Link href={item.url} external={item.external} className={className}>
        {item.text}
      </Link>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <Link href={item.url} external={item.external} className={className}>
        {item.text}
      </Link>
    </NavigationMenuLink>
  );
}

function NavSubGroup({ item }: { item: VuepressNavGroup }) {
  return (
    <div className="group/sub relative min-w-[11rem]">
      <div
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground whitespace-nowrap"
      >
        <span>{item.text}</span>
        <ChevronRight className="size-4 shrink-0 text-fd-muted-foreground" />
      </div>
      <div
        className="absolute top-0 left-full z-50 hidden min-w-[14rem] rounded-lg border border-fd-border bg-fd-background p-1 shadow-lg group-hover/sub:block"
      >
        {item.children.map((child, index) => (
          <NavNode key={`${item.text}-${index}`} item={child} nested />
        ))}
      </div>
    </div>
  );
}

function NavNode({ item, nested = false }: { item: VuepressNavNode; nested?: boolean }) {
  if (item.type === 'link') {
    return <NavLeaf item={item} nested={nested} />;
  }
  return <NavSubGroup item={item} />;
}

function TopLevelMenu({ group }: { group: VuepressNavGroup }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-8 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap">
        {group.text}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="p-2">
        <div className="flex">
          {group.children.map((child, index) =>
            child.type === 'group' ? (
              <NavSubGroup key={`${group.text}-${index}`} item={child} />
            ) : (
              <div key={`${group.text}-${index}`} className="min-w-[11rem] p-1">
                <NavLeaf item={child} />
              </div>
            ),
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function VuepressNavMenu({ className }: { className?: string }) {
  return (
    <NavigationMenuList className={className}>
      {vuepressNavbarTree.map((group) => (
        <TopLevelMenu key={group.text} group={group} />
      ))}
    </NavigationMenuList>
  );
}

function MobileNavGroup({ item, depth = 0 }: { item: VuepressNavGroup; depth?: number }) {
  return (
    <div className={depth === 0 ? 'mb-3' : 'mb-2'}>
      <p
        className={
          depth === 0
            ? 'mb-1 text-sm font-medium text-fd-foreground'
            : 'mb-1 text-sm text-fd-muted-foreground'
        }
      >
        {item.text}
      </p>
      <div className="flex flex-col gap-0.5">
        {item.children.map((child, index) => (
          <MobileNavNode key={`${item.text}-${index}`} item={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

function MobileNavNode({ item, depth }: { item: VuepressNavNode; depth: number }) {
  if (item.type === 'link') {
    return (
      <Link
        href={item.url}
        external={item.external}
        className="inline-flex items-center gap-2 py-1.5 text-sm transition-colors hover:text-fd-primary"
      >
        {item.text}
      </Link>
    );
  }
  return <MobileNavGroup item={item} depth={depth} />;
}

export function VuepressMobileNav() {
  return (
    <div className="flex flex-col">
      {vuepressNavbarTree.map((group) => (
        <MobileNavGroup key={group.text} item={group} />
      ))}
    </div>
  );
}
