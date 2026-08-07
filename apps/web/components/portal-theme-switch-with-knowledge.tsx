'use client';

import type { ComponentProps } from 'react';
import { MessagesSquare } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { AuthAccountButton } from '@acongm/auth-client';

/**
 * 主题开关左侧：跳转 Chat + 登录图标；主题按钮位置与样式保持不变。
 */
export function PortalThemeSwitchWithKnowledge(
  props: ComponentProps<typeof ThemeSwitch>,
) {
  const chatBase =
    process.env.NEXT_PUBLIC_CHAT_URL || 'https://chat.acongm.com';

  return (
    <div className="portal-chrome-actions inline-flex items-center gap-1.5">
      <a
        href={chatBase}
        className="portal-chrome-icon-btn"
        title="打开 Chat"
        aria-label="打开 Chat"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessagesSquare className="size-3.5" aria-hidden />
      </a>
      <AuthAccountButton variant="icon" className="portal-chrome-icon-btn" />
      <ThemeSwitch mode="light-dark-system" {...props} />
    </div>
  );
}
