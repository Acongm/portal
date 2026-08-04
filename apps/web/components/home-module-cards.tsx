import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Atom,
  BookOpen,
  Braces,
  Bug,
  ClipboardList,
  Component,
  FileType,
  FileUser,
  Gauge,
  GitBranch,
  GraduationCap,
  MessageSquare,
  Package,
  Palette,
  Server,
  Shapes,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { docModuleCategories } from '@/lib/modules.registry';

const iconMap: Record<string, LucideIcon> = {
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
    <div className="space-y-14">
      {docModuleCategories.map((category) => (
        <section key={category.title}>
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">{category.title}</h2>
            {category.description ? (
              <p className="mt-2 text-sm text-fd-muted-foreground">{category.description}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.modules.map((module) => {
              const Icon = iconMap[module.icon ?? ''] ?? BookOpen;
              const accent = module.accent ?? '#3eaf7c';

              return (
                <Link
                  key={module.folder}
                  href={`/docs/${module.folder}`}
                  className="group relative overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#3eaf7c]/40 hover:shadow-md"
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
                  <h3 className="text-base font-semibold text-fd-foreground group-hover:text-[#3eaf7c]">
                    {module.title}
                  </h3>
                  {module.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                      {module.description}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-flex text-xs font-medium text-[#3eaf7c]">
                    进入文档 →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
