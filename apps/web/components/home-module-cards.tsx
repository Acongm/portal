import Link from 'next/link';
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
import { docDomains, getDomainHref, getModuleHref } from '@/lib/modules.registry';

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

export function HomeModuleCards() {
  return (
    <div className="space-y-16">
      {docDomains.map((domain) => {
        const DomainIcon = iconMap[domain.icon ?? ''] ?? BookOpen;
        const domainAccent = domain.accent ?? 'var(--primary)';
        const hasModules = (domain.categories ?? []).some((c) => c.modules.length > 0);

        return (
          <section key={domain.id}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-fd-border bg-fd-card"
                    style={{ color: domainAccent }}
                  >
                    <DomainIcon className="size-4" aria-hidden />
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight">{domain.title}</h2>
                </div>
                {domain.description ? (
                  <p className="text-sm text-fd-muted-foreground">{domain.description}</p>
                ) : null}
              </div>
              <Link
                href={getDomainHref(domain.id)}
                className="text-sm font-medium text-primary hover:underline"
              >
                进入领域 →
              </Link>
            </div>

            {!hasModules ? (
              <div className="rounded-2xl border border-dashed border-fd-border bg-fd-card/40 px-6 py-10 text-center text-sm text-fd-muted-foreground">
                内容筹备中，后续将在此领域下新增模块。
              </div>
            ) : (
              <div className="space-y-10">
                {domain.categories.map((category) => (
                  <div key={category.title}>
                    <h3 className="mb-4 text-sm font-medium text-fd-muted-foreground">
                      {category.title}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {category.modules.map((module) => {
                        const Icon = iconMap[module.icon ?? ''] ?? BookOpen;
                        const accent = module.accent ?? domainAccent;

                        return (
                          <Link
                            key={module.folder}
                            href={getModuleHref(domain.id, module.folder)}
                            className="group relative overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                          >
                            <div
                              className="absolute inset-x-0 top-0 h-1 opacity-80"
                              style={{ background: accent }}
                            />
                            <div
                              className="mb-4 flex size-11 items-center justify-center rounded-xl border border-fd-border bg-fd-background shadow-sm"
                              style={{ color: accent }}
                            >
                              <Icon className="size-5" aria-hidden />
                            </div>
                            <h4 className="text-base font-semibold text-fd-foreground group-hover:text-primary">
                              {module.title}
                            </h4>
                            {module.description ? (
                              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                                {module.description}
                              </p>
                            ) : null}
                            <span className="mt-4 inline-flex text-xs font-medium text-primary">
                              进入文档 →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
