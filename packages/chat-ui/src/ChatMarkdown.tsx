'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type ChatMarkdownProps = {
  content: string;
  /** 流式未完成时补全未闭合代码围栏，避免渲染抖动 */
  streaming?: boolean;
  className?: string;
};

function prepareContent(content: string, streaming?: boolean): string {
  if (!streaming) return content;
  const fences = content.match(/```/g)?.length ?? 0;
  if (fences % 2 === 1) return `${content}\n\`\`\``;
  return content;
}

function ChatMarkdownInner({ content, streaming, className }: ChatMarkdownProps) {
  const source = prepareContent(content, streaming);
  if (!source) return null;

  return (
    <div
      className={['acongm-chat-md', className].filter(Boolean).join(' ')}
      data-streaming={streaming ? 'true' : undefined}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}

export const ChatMarkdown = memo(ChatMarkdownInner);
