'use client';

import { ChatDrawer } from './ChatDrawer';
import { ChatTrigger } from './ChatTrigger';
import { ChatUiProvider } from './ChatUiProvider';
import type { DocChatContext } from './ChatPanel';

export type DocsChatShellProps = {
  context: DocChatContext;
};

/**
 * 文档站嵌入入口：Provider + FAB + Drawer。
 * 宿主负责根据路由构造 DocChatContext（pagePath / moduleKey）。
 */
export function DocsChatShell({ context }: DocsChatShellProps) {
  return (
    <ChatUiProvider defaultMode="drawer">
      <ChatTrigger />
      <ChatDrawer context={context} />
    </ChatUiProvider>
  );
}
