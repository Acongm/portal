'use client';

import { ChatPanel, type DocChatContext } from './ChatPanel';
import { useChatUi } from './ChatUiProvider';

export type ChatDrawerProps = {
  context: DocChatContext;
};

/** 文档页嵌入抽屉：PC 分栏 / 平板侧栏 / 手机底栏 */
export function ChatDrawer({ context }: ChatDrawerProps) {
  const { open, closePanel, mode } = useChatUi();
  if (!open || mode !== 'drawer') return null;

  return (
    <div className="acongm-chat-drawer acongm-chat-root">
      <button
        className="acongm-chat-backdrop"
        type="button"
        aria-label="关闭 AI 阅读助手"
        onClick={closePanel}
      />
      <aside className="acongm-chat-shell" aria-label="AI 阅读助手">
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
        <ChatPanel
          className="acongm-chat-shell__body"
          active={open}
          context={context}
        />
      </aside>
    </div>
  );
}
