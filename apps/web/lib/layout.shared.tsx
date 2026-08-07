import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getDomainNavLinks } from '@/lib/domain-nav-links';
import { PortalNavBrand } from '@/components/portal-nav-brand';
import { PortalThemeSwitchWithKnowledge } from '@/components/portal-theme-switch-with-knowledge';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <PortalNavBrand />,
      url: '/',
    },
    // 领域二级菜单：Fumadocs 原生 card 网格（icon / 标题 / 描述）
    links: [...getDomainNavLinks()],
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
    // Chat + 登录图标在主题开关左侧（主题按钮位置不变）
    slots: {
      themeSwitch: PortalThemeSwitchWithKnowledge,
    },
  };
}
