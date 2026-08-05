'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareText } from 'lucide-react';
import { useChatUi } from './ChatUiProvider';

export type ChatTriggerProps = {
  label?: string;
  title?: string;
};

/**
 * FAB 同样 portal 到 body，避免 docs layout 裁切 / 低 z-index。
 */
export function ChatTrigger({
  label = 'AI 助手',
  title = 'AI 阅读助手',
}: ChatTriggerProps) {
  const { open, openPanel } = useChatUi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || open) return null;

  return createPortal(
    <button
      type="button"
      className="acongm-chat-fab acongm-chat-root"
      title={title}
      aria-label={`打开 ${title}`}
      onClick={openPanel}
    >
      <MessageSquareText className="acongm-chat-fab__icon" aria-hidden />
      <span className="acongm-chat-fab__text">{label}</span>
    </button>,
    document.body,
  );
}
