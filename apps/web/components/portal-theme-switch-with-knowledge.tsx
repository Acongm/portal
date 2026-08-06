'use client';

import type { ComponentProps } from 'react';
import { BookMarked } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';

/**
 * 主题开关左侧的「关联知识」入口：
 * - 文档页已挂载 DocsChatShell 时：打开抽屉并弹出 + 同源选择器
 * - 否则回退到独立 chat 站
 */
export function PortalThemeSwitchWithKnowledge(
  props: ComponentProps<typeof ThemeSwitch>,
) {
  const onAssociate = () => {
    if (document.documentElement.classList.contains('acongm-chat-ready')) {
      window.dispatchEvent(new Event('acongm-chat-associate'));
      return;
    }
    const chatBase =
      process.env.NEXT_PUBLIC_CHAT_URL || 'https://chat.acongm.com';
    window.open(chatBase, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-full border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        title="关联知识并打开对话"
        aria-label="关联知识并打开对话"
        onClick={onAssociate}
      >
        <BookMarked className="size-3.5" aria-hidden />
      </button>
      <ThemeSwitch mode="light-dark-system" {...props} />
    </div>
  );
}
