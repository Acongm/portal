'use client';

import { cn } from 'cnfast';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'fumadocs-ui/components/ui/navigation-menu';
import { useHomeLayout } from 'fumadocs-ui/layouts/home';
import { useDocsLayout } from 'fumadocs-ui/layouts/docs';
import { useIsScrollTop } from 'fumadocs-ui/utils/use-is-scroll-top';
import type { DocsSlots } from 'fumadocs-ui/layouts/docs';
import type { HomeSlots } from 'fumadocs-ui/layouts/home';
import type { NavOptions } from 'fumadocs-ui/layouts/shared';
import { ChevronDown, Languages, SidebarIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { VuepressMobileNav, VuepressNavMenu } from '@/components/vuepress-nav-menu';

type SiteHeaderSlots = Pick<
  HomeSlots,
  'navTitle' | 'searchTrigger' | 'themeSwitch' | 'languageSelect'
> & {
  sidebar?: DocsSlots['sidebar'];
};

function SiteHeaderShell({
  slots,
  nav,
  isDocs,
  ...props
}: ComponentProps<'header'> & {
  slots: SiteHeaderSlots;
  nav?: NavOptions;
  isDocs?: boolean;
}) {
  const [menuValue, setMenuValue] = useState('');
  const transparentMode = nav?.transparentMode ?? 'none';
  const isTop = useIsScrollTop({ enabled: transparentMode === 'top' }) ?? true;
  const isTransparent =
    transparentMode === 'top' ? isTop : transparentMode === 'always';

  if (nav?.component) return nav.component;

  return (
    <NavigationMenu value={menuValue} onValueChange={setMenuValue} asChild>
      <header
        id="nd-nav"
        {...props}
        className={cn(
          'sticky top-0 z-40 h-14',
          isDocs && 'w-full [--fd-header-height:--spacing(14)]',
          props.className,
        )}
      >
        <div
          className={cn(
            'border-b backdrop-blur-lg transition-colors *:mx-auto *:max-w-(--fd-layout-width)',
            menuValue.length > 0 && 'max-lg:shadow-lg max-lg:rounded-b-2xl',
            (!isTransparent || menuValue.length > 0) && 'bg-fd-background/80',
          )}
        >
          <NavigationMenuList
            className="flex h-14 w-full items-center px-4"
            asChild
          >
            <nav className="flex w-full items-center gap-2">
              {slots.navTitle ? (
                <slots.navTitle className="inline-flex shrink-0 items-center gap-2.5 font-semibold" />
              ) : null}

              <VuepressNavMenu className="flex flex-row items-center gap-1 max-lg:hidden" />

              <div className="ms-auto flex flex-row items-center justify-end gap-1.5">
                {slots.searchTrigger ? (
                  <slots.searchTrigger.full
                    hideIfDisabled
                    className="w-full max-w-[240px] rounded-full ps-2.5 max-lg:hidden"
                  />
                ) : null}
                {slots.searchTrigger ? (
                  <slots.searchTrigger.sm hideIfDisabled className="p-2 lg:hidden" />
                ) : null}
                {slots.themeSwitch ? <slots.themeSwitch /> : null}
                {slots.languageSelect ? (
                  <slots.languageSelect.root className="max-lg:hidden">
                    <Languages className="size-5" />
                  </slots.languageSelect.root>
                ) : null}
                {isDocs && slots.sidebar ? (
                  <slots.sidebar.trigger
                    className={cn(
                      buttonVariants({
                        color: 'ghost',
                        size: 'icon-sm',
                        className: 'p-2 lg:hidden',
                      }),
                    )}
                  >
                    <SidebarIcon className="size-5" />
                  </slots.sidebar.trigger>
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
                      <ChevronDown
                        className="transition-transform duration-300 group-data-[state=open]:rotate-180"
                      />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="flex flex-col gap-3 p-4">
                      <VuepressMobileNav />
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
            </nav>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </div>
      </header>
    </NavigationMenu>
  );
}

export function SiteHeader(props: ComponentProps<'header'>) {
  const { slots, props: layoutProps } = useHomeLayout();
  return (
    <SiteHeaderShell
      slots={slots}
      nav={layoutProps.nav}
      isDocs={false}
      {...props}
    />
  );
}

export function DocsSiteHeader(props: ComponentProps<'header'>) {
  const { slots, props: layoutProps } = useDocsLayout();
  return (
    <SiteHeaderShell slots={slots} nav={layoutProps.nav} isDocs {...props} />
  );
}
