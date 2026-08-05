import type { ChatModelAdapter, ThreadMessage } from '@assistant-ui/react';
import {
  deriveTagOptions,
  modelHistory,
  resolveCallSource,
  streamChatV1,
} from '@acongm/agent-session-sdk';
import type { ChatUiMessage } from '@acongm/kb-types';
import type { DocChatContext } from '../types';

function textFromMessage(message: ThreadMessage | undefined): string {
  if (!message) return '';
  return message.content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function toUiMessages(messages: readonly ThreadMessage[]): ChatUiMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: textFromMessage(message),
      isSummary: Boolean(message.metadata?.custom?.isSummary),
      isError: message.status?.type === 'incomplete',
    }));
}

/**
 * 薄 ChatModelAdapter：只负责 ChatV1 SSE → yield 累计 text。
 * 消息 / 停止 / 重试由 LocalRuntime 管理（官方推荐自定义 API 路径）。
 */
export function createDocChatModelAdapter(
  getContext: () => DocChatContext,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const {
        pagePath,
        moduleKey = '',
        title = '当前文档',
        tags = [],
        content = '',
        streamUrl,
      } = getContext();

      const lastUser = [...messages]
        .reverse()
        .find((message) => message.role === 'user');
      const question = textFromMessage(lastUser).trim();
      if (!question) {
        yield { content: [{ type: 'text', text: '' }] };
        return;
      }

      const tagOptions = deriveTagOptions(question);
      const callSource = resolveCallSource(
        tagOptions.scope,
        tagOptions.enableWebSearch,
      );

      const events = await streamChatV1(
        {
          messages: modelHistory(toUiMessages(messages)),
          context: {
            scope: tagOptions.scope,
            pagePath,
            moduleKey,
            title,
            tags,
            content,
          },
          enableWebSearch: tagOptions.enableWebSearch,
        },
        { signal: abortSignal, callSource, url: streamUrl },
      );

      let text = '';
      for await (const event of events) {
        if (event.type === 'delta') {
          text += event.content || '';
          yield { content: [{ type: 'text', text }] };
        }
        if (event.type === 'error') {
          throw new Error(event.message || '回答失败');
        }
      }
    },
  };
}
