'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DocChatRuntimeProvider } from './runtime/DocChatRuntimeProvider';
import { AssistantThread } from './thread/AssistantThread';
import { useChatUi } from './ChatUiProvider';
import type { DocChatContext } from './types';

export type ChatDrawerProps = {
  context: DocChatContext;
};

/**
 * 文档页嵌入抽屉：PC 分栏 / 平板侧栏 / 手机底栏。
 * 挂到 document.body，避免被 Fumadocs layout 的 transform/overflow 裁切，
 * 遮罩与面板分开动画（参考 Radix Dialog / assistant-ui Modal portal 模式）。
 */
export function ChatDrawer({ context }: ChatDrawerProps) {
  const { open, closePanel, mode } = useChatUi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || mode !== 'drawer') return null;

  return createPortal(
    <div
      className="acongm-chat-drawer acongm-chat-root acongm-aui-root"
      role="dialog"
      aria-modal="true"
      aria-label="AI 阅读助手"
    >
      <button
        className="acongm-chat-backdrop"
        type="button"
        tabIndex={-1}
        aria-label="关闭 AI 阅读助手"
        onClick={closePanel}
      />
      <aside className="acongm-chat-shell">
        <div className="acongm-chat-shell__header">
          <div>
            <h3>AI 阅读助手</h3>
            <p>{context.title || '当前文档'}</p>
          </div>
          <button
            type="button"
            className="acongm-chat-shell__close"
            onClick={closePanel}
          >
            收起
          </button>
        </div>
        <div className="acongm-chat-shell__body">
          <DocChatRuntimeProvider context={context} active={open}>
            <AssistantThread />
          </DocChatRuntimeProvider>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
