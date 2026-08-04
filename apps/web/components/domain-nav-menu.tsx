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
  ArrowRight,
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
        className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-fd-border/80 bg-fd-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3eaf7c]/45 hover:shadow-md"
      >
        <span
          className="absolute inset-x-0 top-0 h-1 opacity-90 transition-opacity group-hover/card:opacity-100"
          style={{ background: accent }}
        />
        <span
          className="mb-3 flex size-10 items-center justify-center rounded-xl border border-fd-border bg-fd-background shadow-sm"
          style={{ color: accent }}
        >
          <DomainIcon name={module.icon} className="size-5" />
        </span>
        <span className="text-sm font-semibold text-fd-foreground group-hover/card:text-[#3eaf7c]">
          {module.title}
        </span>
        {module.description ? (
          <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fd-muted-foreground">
            {module.description}
          </span>
        ) : null}
        <span className="mt-auto pt-3 text-xs font-medium text-[#3eaf7c] opacity-0 transition-opacity group-hover/card:opacity-100">
          查看文档 →
        </span>
      </Link>
    </NavigationMenuLink>
  );
}

function DomainMenu({ domain }: { domain: DocDomain }) {
  const categories = domain.categories ?? [];
  const modules = categories.flatMap((c) => c.modules);
  const accent = domain.accent ?? '#3eaf7c';
  const cols =
    modules.length <= 2 ? 'sm:grid-cols-2' : modules.length <= 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <NavigationMenuItem value={domain.id}>
      <NavigationMenuTrigger className="h-9 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-fd-accent/70 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground">
        {domain.title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="site-mega-panel overflow-visible p-0">
        <div className="flex w-[min(920px,92vw)] flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-popover text-fd-popover-foreground shadow-xl md:flex-row">
          {/* 左侧领域介绍卡 */}
          <div
            className="relative flex shrink-0 flex-col justify-between gap-6 overflow-hidden border-b border-fd-border p-5 md:w-[240px] md:border-b-0 md:border-e"
            style={{
              background: `linear-gradient(160deg, ${accent}18 0%, transparent 55%)`,
            }}
          >
            <div>
              <span
                className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-fd-border bg-fd-background/90 shadow-sm backdrop-blur"
                style={{ color: accent }}
              >
                <DomainIcon name={domain.icon} className="size-6" />
              </span>
              <p className="text-base font-semibold tracking-tight">{domain.title}</p>
              {domain.description ? (
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  {domain.description}
                </p>
              ) : null}
            </div>
            <Link
              href={getDomainHref(domain.id)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3eaf7c] transition-colors hover:text-[#359e6c]"
            >
              进入领域
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* 右侧模块卡片网格 */}
          <div className="min-w-0 flex-1 bg-fd-background/40 p-4 md:p-5">
            {modules.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-fd-border text-sm text-fd-muted-foreground">
                内容筹备中，敬请期待
              </div>
            ) : categories.length > 1 ? (
              <div className="space-y-5">
                {categories.map((category) => (
                  <div key={category.title}>
                    <p className="mb-2.5 text-xs font-medium tracking-wide text-fd-muted-foreground uppercase">
                      {category.title}
                    </p>
                    <div className={`grid gap-3 ${cols}`}>
                      {category.modules.map((module) => (
                        <ModuleCard
                          key={module.folder}
                          domainId={domain.id}
                          module={module}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-3 ${cols}`}>
                {modules.map((module) => (
                  <ModuleCard key={module.folder} domainId={domain.id} module={module} />
                ))}
              </div>
            )}
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileDomainGroup({ domain }: { domain: DocDomain }) {
  const modules = (domain.categories ?? []).flatMap((c) => c.modules);
  const accent = domain.accent ?? '#3eaf7c';

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
      <Link
        href={getDomainHref(domain.id)}
        className="flex items-center gap-3 border-b border-fd-border px-4 py-3"
      >
        <span
          className="flex size-9 items-center justify-center rounded-xl border border-fd-border bg-fd-background"
          style={{ color: accent }}
        >
          <DomainIcon name={domain.icon} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{domain.title}</span>
          {domain.description ? (
            <span className="block text-xs text-fd-muted-foreground">{domain.description}</span>
          ) : null}
        </span>
      </Link>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {modules.length === 0 ? (
          <span className="px-2 py-3 text-xs text-fd-muted-foreground">内容筹备中</span>
        ) : (
          modules.map((module) => (
            <Link
              key={module.folder}
              href={getModuleHref(domain.id, module.folder)}
              className="rounded-xl border border-fd-border/70 bg-fd-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-[#3eaf7c]/40 hover:text-[#3eaf7c]"
            >
              {module.title}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

/** 首页顶栏：Soom 风格领域 mega-menu（左侧介绍 + 右侧模块卡片） */
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
