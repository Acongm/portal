import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getDomainNavLinks } from '@/lib/domain-nav-links';
import { PortalAuthNav } from '@/components/portal-auth-nav';
import { PortalThemeSwitchWithKnowledge } from '@/components/portal-theme-switch-with-knowledge';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Image
            src="/logo.jpg"
            alt=""
            width={28}
            height={28}
            className="rounded-sm"
            priority
          />
          {appName}
        </span>
      ),
      url: '/',
    },
    // 领域二级菜单：Fumadocs 原生 card 网格（icon / 标题 / 描述）
    links: [
      ...getDomainNavLinks(),
      {
        type: 'custom',
        secondary: true,
        children: <PortalAuthNav />,
      },
    ],
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
    // 关联入口放在主题开关左侧（覆盖默认 ThemeSwitch 插槽）
    slots: {
      themeSwitch: PortalThemeSwitchWithKnowledge,
    },
  };
}
