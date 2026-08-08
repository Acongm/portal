'use client';

import type { ComponentProps } from 'react';
import { MessagesSquare } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { AuthAccountButton } from '@acongm/auth-client';
import { buttonVariants } from '@/components/ui/button';

function splitAlignClass(className?: string): {
  wrapperClassName: string;
  themeClassName?: string;
} {
  if (!className?.trim()) {
    return { wrapperClassName: 'portal-chrome-actions' };
  }
  const tokens = className.trim().split(/\s+/);
  const align: string[] = [];
  const rest: string[] = [];
  for (const token of tokens) {
    if (token === 'ms-auto' || token === 'ml-auto' || token === 'me-auto' || token === 'mr-auto') {
      align.push(token);
    } else {
      rest.push(token);
    }
  }
  return {
    wrapperClassName: ['portal-chrome-actions', ...align].filter(Boolean).join(' '),
    themeClassName: rest.length ? rest.join(' ') : undefined,
  };
}

/**
 * 主题开关左侧：Chat + 登录图标；首页顶栏与文档详情侧栏共用。
 * 通用交互视觉来自 Acongm Button primitive，不再维护 portal 专属 icon button CSS。
 */
export function PortalThemeSwitchWithKnowledge(
  props: ComponentProps<typeof ThemeSwitch>,
) {
  const chatBase = process.env.NEXT_PUBLIC_CHAT_URL || 'https://chat.acongm.com';
  const { className, ...rest } = props;
  const { wrapperClassName, themeClassName } = splitAlignClass(className);
  const iconButtonClass = buttonVariants({
    variant: 'ghost',
    size: 'icon',
    className: 'size-8 rounded-full text-muted-foreground',
  });

  return (
    <div className={`${wrapperClassName} inline-flex items-center gap-1.5`}>
      <a
        href={chatBase}
        className={iconButtonClass}
        title="打开 Chat"
        aria-label="打开 Chat"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessagesSquare className="size-3.5" aria-hidden />
      </a>
      <AuthAccountButton variant="icon" className={iconButtonClass} />
      <ThemeSwitch
        mode="light-dark-system"
        className={themeClassName}
        {...rest}
      />
    </div>
  );
}
