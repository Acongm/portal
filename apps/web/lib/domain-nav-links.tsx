import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
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

function DomainIcon({ name }: { name?: string }) {
  const Icon = iconMap[name ?? ''] ?? BookOpen;
  return <Icon aria-hidden />;
}

/**
 * Fumadocs 原生 `type: 'menu'` 链接。
 * HomeLayout 会自动把二级项渲染为卡片（icon + 标题 + 描述）。
 */
export function getDomainNavLinks(): LinkItemType[] {
  return docDomains.map((domain) => {
    const modules = (domain.categories ?? []).flatMap((c) => c.modules);

    return {
      type: 'menu' as const,
      // 仅首页顶栏展示；避免泄漏到 Docs 侧栏变成「全站模块列表」
      on: 'nav' as const,
      text: domain.title,
      url: getDomainHref(domain.id),
      icon: <DomainIcon name={domain.icon} />,
      items:
        modules.length === 0
          ? [
              {
                type: 'custom' as const,
                children: (
                  <span className="col-span-full rounded-lg border border-dashed border-fd-border px-3 py-6 text-center text-sm text-fd-muted-foreground">
                    内容筹备中，敬请期待
                  </span>
                ),
              },
            ]
          : modules.map((module) => ({
              text: module.title,
              description: module.description,
              url: getModuleHref(domain.id, module.folder),
              icon: <DomainIcon name={module.icon} />,
            })),
    };
  });
}
