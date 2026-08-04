'use client';

import { cn } from 'cnfast';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'fumadocs-ui/components/ui/navigation-menu';
import type { BaseSlots } from 'fumadocs-ui/layouts/shared';
import type { NavOptions } from 'fumadocs-ui/layouts/shared';
import { ChevronDown, Languages } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { DomainMobileNav, DomainNavMenu } from '@/components/domain-nav-menu';

type NavSlots = Pick<
  BaseSlots,
  'navTitle' | 'searchTrigger' | 'themeSwitch' | 'languageSelect'
>;

export function SiteNavBar({
  slots,
  nav,
  ...props
}: ComponentProps<'header'> & {
  slots: NavSlots;
  nav?: NavOptions;
}) {
  const [menuOpen, setMenuOpen] = useState('');

  if (nav?.component) return nav.component;

  return (
    <NavigationMenu value={menuOpen} onValueChange={setMenuOpen} asChild>
      <header
        id="nd-nav"
        {...props}
        className={cn(
          'site-nav-bar sticky top-0 z-40 w-full border-b bg-fd-background/80 backdrop-blur-sm',
          props.className,
        )}
      >
        <div
          className={cn(
            'flex h-14 w-full max-w-none items-center gap-1 px-4 md:gap-2 md:px-6',
            menuOpen.length > 0 && 'max-lg:shadow-lg',
          )}
        >
          {slots.navTitle ? (
            <slots.navTitle className="inline-flex shrink-0 items-center gap-2.5 font-semibold" />
          ) : null}

          <DomainNavMenu className="ms-1 flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto max-lg:hidden" />

          <div className="flex shrink-0 items-center gap-1.5 ms-auto">
            {slots.searchTrigger ? (
              <slots.searchTrigger.full
                hideIfDisabled
                className="w-[min(220px,24vw)] shrink-0 rounded-full ps-2.5 max-lg:hidden"
              />
            ) : null}
            {slots.languageSelect ? (
              <slots.languageSelect.root className="max-lg:hidden">
                <Languages className="size-5 text-fd-muted-foreground" />
              </slots.languageSelect.root>
            ) : null}
            {slots.themeSwitch ? <slots.themeSwitch /> : null}
            {slots.searchTrigger ? (
              <slots.searchTrigger.sm hideIfDisabled className="p-2 lg:hidden" />
            ) : null}
            <NavigationMenuItem asChild className="lg:hidden">
              <div>
                <NavigationMenuTrigger
                  aria-label="切换菜单"
                  className={cn(
                    buttonVariants({
                      size: 'icon-sm',
                      color: 'ghost',
                      className: 'group p-2 [&_svg]:size-5',
                    }),
                  )}
                >
                  <ChevronDown className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-4">
                  <DomainMobileNav />
                  <div className="flex items-center gap-2 border-t border-fd-border pt-3">
                    {slots.languageSelect ? (
                      <slots.languageSelect.root>
                        <Languages className="size-5" />
                      </slots.languageSelect.root>
                    ) : null}
                    {slots.themeSwitch ? <slots.themeSwitch /> : null}
                  </div>
                </NavigationMenuContent>
              </div>
            </NavigationMenuItem>
          </div>
        </div>
        <NavigationMenuViewport className="!overflow-visible" />
      </header>
    </NavigationMenu>
  );
}
