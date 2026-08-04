'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatPanel, type DocChatContext } from './ChatPanel';
import { useChatUi } from './ChatUiProvider';

export type ChatDrawerProps = {
  context: DocChatContext;
};

/** 文档页嵌入抽屉：PC 分栏 / 平板侧栏 / 手机底栏 */
export function ChatDrawer({ context }: ChatDrawerProps) {
  const { open, closePanel, mode, notifyClosed } = useChatUi();
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const finishClose = useCallback(() => {
    if (!closingRef.current) return;
    closingRef.current = false;
    setRendered(false);
    setClosing(false);
    notifyClosed();
  }, [notifyClosed]);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setRendered(true);
      setClosing(false);
      return;
    }
    if (rendered && !closingRef.current) {
      closingRef.current = true;
      setClosing(true);
    }
  }, [open, rendered]);

  useEffect(() => {
    if (!closing) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(finishClose, reduced ? 20 : 420);
    return () => window.clearTimeout(timer);
  }, [closing, finishClose]);

  if (!rendered || mode !== 'drawer') return null;

  return (
    <div
      className={[
        'acongm-chat-drawer',
        'acongm-chat-root',
        closing ? 'is-closing' : 'is-open',
      ].join(' ')}
      data-state={closing ? 'closed' : 'open'}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (closing) finishClose();
      }}
    >
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
          active={rendered}
          context={context}
        />      </aside>
    </div>
  );
}
