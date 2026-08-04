import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getDomainNavLinks } from '@/lib/domain-nav-links';
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
    links: getDomainNavLinks(),
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
      // 明 / 暗 / 跟随系统；首次默认 system（见 RootProvider）
      mode: 'light-dark-system',
    },
  };
}
