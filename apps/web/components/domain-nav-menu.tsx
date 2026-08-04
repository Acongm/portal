'use client';

import Link from 'fumadocs-core/link';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from 'fumadocs-ui/components/ui/navigation-menu';
import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Atom,
  BookOpen,
  Braces,
  Bug,
  ClipboardList,
  Code2,
  Component,
  FileType,
  FileUser,
  Flower2,
  Gauge,
  GitBranch,
  GraduationCap,
  MessageSquare,
  Newspaper,
  Package,
  Palette,
  School,
  Server,
  Shapes,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  docDomains,
  getDomainHref,
  getModuleHref,
  type DocDomain,
  type DocModuleEntry,
} from '@/lib/modules.registry';

const iconMap: Record<string, LucideIcon> = {
  Code2,
  Flower2,
  School,
  Newspaper,
  Braces,
  FileType,
  Palette,
  Atom,
  Component,
  Shapes,
  Package,
  Server,
  GitBranch,
  Gauge,
  Wrench,
  AppWindow,
  BookOpen,
  Sparkles,
  Bug,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  FileUser,
};

function DomainIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = iconMap[name ?? ''] ?? BookOpen;
  return <Icon className={className} aria-hidden />;
}

function ModuleCard({
  domainId,
  module,
}: {
  domainId: string;
  module: DocModuleEntry;
}) {
  const accent = module.accent ?? '#3eaf7c';

  return (
    <NavigationMenuLink asChild>
      <Link
        href={getModuleHref(domainId, module.folder)}
        className="flex gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-fd-border hover:bg-fd-accent/60"
      >
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background"
          style={{ color: accent }}
        >
          <DomainIcon name={module.icon} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-fd-foreground">{module.title}</span>
          {module.description ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-fd-muted-foreground">
              {module.description}
            </span>
          ) : null}
        </span>
      </Link>
    </NavigationMenuLink>
  );
}

function DomainMenu({ domain }: { domain: DocDomain }) {
  const modules = (domain.categories ?? []).flatMap((c) => c.modules);
  const accent = domain.accent ?? '#3eaf7c';

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-8 rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap">
        {domain.title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="overflow-visible p-3 md:min-w-[28rem] lg:min-w-[36rem]">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-fd-border pb-3">
          <div className="flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg border border-fd-border bg-fd-card"
              style={{ color: accent }}
            >
              <DomainIcon name={domain.icon} className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">{domain.title}</p>
              {domain.description ? (
                <p className="text-xs text-fd-muted-foreground">{domain.description}</p>
              ) : null}
            </div>
          </div>
          <Link
            href={getDomainHref(domain.id)}
            className="shrink-0 text-xs font-medium text-[#3eaf7c] hover:underline"
          >
            进入领域 →
          </Link>
        </div>

        {modules.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-fd-muted-foreground">
            内容筹备中
          </p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {modules.map((module) => (
              <ModuleCard key={module.folder} domainId={domain.id} module={module} />
            ))}
          </div>
        )}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileDomainGroup({ domain }: { domain: DocDomain }) {
  const modules = (domain.categories ?? []).flatMap((c) => c.modules);

  return (
    <div className="mb-4">
      <Link
        href={getDomainHref(domain.id)}
        className="mb-1 flex items-center gap-2 text-sm font-medium text-fd-foreground"
      >
        <DomainIcon name={domain.icon} className="size-4" />
        {domain.title}
      </Link>
      {domain.description ? (
        <p className="mb-2 text-xs text-fd-muted-foreground">{domain.description}</p>
      ) : null}
      <div className="flex flex-col gap-1 border-s border-fd-border ps-3">
        {modules.length === 0 ? (
          <span className="py-1 text-xs text-fd-muted-foreground">内容筹备中</span>
        ) : (
          modules.map((module) => (
            <Link
              key={module.folder}
              href={getModuleHref(domain.id, module.folder)}
              className="py-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-primary"
            >
              {module.title}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

/** 首页顶栏：按领域下拉（卡片式模块入口，对齐 Soom 风格） */
export function DomainNavMenu({ className }: { className?: string }) {
  return (
    <NavigationMenuList className={className}>
      {docDomains.map((domain) => (
        <DomainMenu key={domain.id} domain={domain} />
      ))}
    </NavigationMenuList>
  );
}

export function DomainMobileNav() {
  return (
    <div className="flex flex-col">
      {docDomains.map((domain) => (
        <MobileDomainGroup key={domain.id} domain={domain} />
      ))}
    </div>
  );
}
