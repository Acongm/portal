'use client';

import { MessageSquareText } from 'lucide-react';
import { useChatUi } from './ChatUiProvider';

export type ChatTriggerProps = {
  label?: string;
  title?: string;
};

export function ChatTrigger({
  label = 'AI 助手',
  title = 'AI 阅读助手',
}: ChatTriggerProps) {
  const { open, openPanel } = useChatUi();
  if (open) return null;

  return (
    <button
      type="button"
      className="acongm-chat-fab"
      title={title}
      aria-label={`打开 ${title}`}
      onClick={openPanel}
    >
      <MessageSquareText className="acongm-chat-fab__icon" aria-hidden />
      <span className="acongm-chat-fab__text">{label}</span>
    </button>
  );
}
