'use client';

import { ChatPanel, type DocChatContext } from './ChatPanel';
import { useChatUi } from './ChatUiProvider';

export type ChatFullscreenProps = {
  context: DocChatContext;
  /** 全页模式下默认保持打开 */
  forceOpen?: boolean;
};

/** 独立 Chat 全页（后续 chat.acongm.com /apps/chat 可复用） */
export function ChatFullscreen({
  context,
  forceOpen = true,
}: ChatFullscreenProps) {
  const { open, mode } = useChatUi();
  const active = forceOpen || open;
  if (!active || (mode !== 'fullscreen' && !forceOpen)) return null;

  return (
    <div className="acongm-chat-fullscreen acongm-chat-root">
      <aside className="acongm-chat-shell is-fullscreen" aria-label="AI 对话">
        <div className="acongm-chat-shell__header">
          <div>
            <h3>AI 对话</h3>
            <p>{context.title || '知识库助手'}</p>
          </div>
        </div>
        <ChatPanel
          className="acongm-chat-shell__body"
          active={active}
          context={context}
        />
      </aside>
    </div>
  );
}
