import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
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
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
    },
  };
}
