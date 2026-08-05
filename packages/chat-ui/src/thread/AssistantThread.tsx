'use client';

import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CHAT_V1_TAGS,
  insertChatTag,
  type ChatTagKey,
} from '@acongm/agent-session-sdk';

function AssistantMarkdown() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="acongm-aui-md"
    />
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="acongm-aui-msg is-user">
      <div className="acongm-aui-msg__meta">你</div>
      <div className="acongm-aui-msg__body">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="acongm-aui-msg is-assistant">
      <div className="acongm-aui-msg__meta">
        <span>AI</span>
        <ActionBarPrimitive.Root hideWhenRunning className="acongm-aui-actions">
          <ActionBarPrimitive.Copy>复制</ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
      </div>
      <div className="acongm-aui-msg__body">
        <MessagePrimitive.Content components={{ Text: AssistantMarkdown }} />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  const aui = useAui();

  const applyTag = (key: ChatTagKey) => {
    const current = aui.composer().getState().text;
    aui.composer().setText(insertChatTag(current, key));
  };

  return (
    <ComposerPrimitive.Root className="acongm-aui-composer">
      <div className="acongm-aui-composer__topline">
        <div className="acongm-chat-quick-tags" aria-label="提问快捷选项">
          {CHAT_V1_TAGS.map((tag) => (
            <button key={tag.key} type="button" onClick={() => applyTag(tag.key)}>
              + {tag.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="acongm-chat-clear"
          onClick={() => window.dispatchEvent(new Event('acongm-chat-clear'))}
        >
          清空
        </button>
      </div>
      <div className="acongm-aui-composer__box">
        <ComposerPrimitive.Input
          rows={2}
          placeholder="结合文档提问，快捷选项可继续编辑…"
          className="acongm-aui-composer__input"
        />
        <ThreadPrimitive.If running={false}>
          <ComposerPrimitive.Send className="acongm-aui-send">
            发送
          </ComposerPrimitive.Send>
        </ThreadPrimitive.If>
        <ThreadPrimitive.If running>
          <ComposerPrimitive.Cancel className="acongm-aui-stop">
            停止
          </ComposerPrimitive.Cancel>
        </ThreadPrimitive.If>
      </div>
      <p className="acongm-chat-composer__hint">
        基于 assistant-ui；仅发送消息时调用 AI 接口。
      </p>
    </ComposerPrimitive.Root>
  );
}

/** assistant-ui Thread：消息列表 + Markdown + Composer */
export function AssistantThread() {
  return (
    <ThreadPrimitive.Root className="acongm-aui-thread">
      <ThreadPrimitive.Viewport className="acongm-aui-thread__viewport">
        <ThreadPrimitive.Empty>
          <p className="acongm-aui-empty">打开助手后将加载构建期摘要。</p>
        </ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}
