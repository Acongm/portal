import type { ChatModelAdapter, ThreadMessage } from '@assistant-ui/react';
import {
  deriveTagOptions,
  modelHistory,
  resolveCallSource,
  streamChatMessageV2,
  streamChatV1,
  streamThreadMessage,
} from '@acongm/agent-session-sdk';
import type { ChatUiMessage, ChatV1Context } from '@acongm/kb-types';
import type { DocChatContext } from '../types';
import { resolveChatV2RunIdentity } from './chat-v2-identities';

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

function yieldParts(thinking: string, text: string) {
  return {
    content: [
      ...(thinking ? [{ type: 'reasoning' as const, text: thinking }] : []),
      ...(text ? [{ type: 'text' as const, text }] : []),
    ],
  };
}

function buildRequestContext(
  scope: ChatV1Context['scope'],
  pagePath: string,
  moduleKey: string | undefined,
  title: string | undefined,
  tags: string[] | undefined,
  content: string | undefined,
): ChatV1Context {
  const context: ChatV1Context = {
    scope,
    pagePath: pagePath || '/',
    moduleKey: moduleKey?.trim() || '_general',
    title: title?.trim() || '通用对话',
    tags: tags ?? [],
  };
  const trimmed = content?.trim();
  if (trimmed) context.content = trimmed;
  return context;
}

function newRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  throw new Error('当前浏览器不支持安全的 Chat run UUID。');
}

export function createDocChatModelAdapter(
  getContext: () => DocChatContext,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal, unstable_assistantMessageId }) {
      const ctx = getContext();
      const {
        pagePath,
        moduleKey,
        title,
        tags = [],
        content,
        streamUrl,
        enableThinking = true,
        maxTokens,
        historyMode = 'short',
        chatsBaseUrl,
        accessToken,
        ensureChat,
        onChatPersisted,
        threadsBaseUrl,
        ensureThread,
        onThreadPersisted,
      } = ctx;

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
      const requestContext = buildRequestContext(
        tagOptions.scope,
        pagePath,
        moduleKey,
        title,
        tags,
        content,
      );

      let chatId = ctx.chatId?.trim() || '';
      if (!chatId && ensureChat) {
        chatId = (
          await ensureChat({
            title: question.replace(/\s+/g, ' ').trim().slice(0, 80) || undefined,
          })
        ).trim();
      }

      let events;
      if (chatId) {
        const ids = resolveChatV2RunIdentity(
          messages.map((message) => ({ id: message.id, role: message.role })),
          unstable_assistantMessageId,
          newRunId,
        );
        if (!ids) throw new Error('无法确定当前用户消息的稳定 id。');
        events = await streamChatMessageV2(
          chatId,
          {
            content: question,
            ...ids,
            enableWebSearch: tagOptions.enableWebSearch,
            enableThinking,
            maxTokens,
            context: requestContext,
          },
          {
            signal: abortSignal,
            accessToken: accessToken ?? undefined,
            baseUrl: chatsBaseUrl,
          },
        );
      } else {
        let threadId = ctx.threadId?.trim() || '';
        if (!threadId && ensureThread) {
          threadId = (
            await ensureThread({
              title: question.replace(/\s+/g, ' ').trim().slice(0, 80) || undefined,
            })
          ).trim();
        }
        events = threadId
          ? await streamThreadMessage(
              threadId,
              {
                content: question,
                enableWebSearch: tagOptions.enableWebSearch,
                enableThinking,
                maxTokens,
                context: requestContext,
              },
              {
                signal: abortSignal,
                accessToken: accessToken ?? undefined,
                baseUrl: threadsBaseUrl,
              },
            )
          : await streamChatV1(
              {
                messages: modelHistory(toUiMessages(messages)),
                context: requestContext,
                enableWebSearch: tagOptions.enableWebSearch,
                enableThinking,
                maxTokens,
                historyMode,
              },
              { signal: abortSignal, callSource, url: streamUrl },
            );
      }

      let thinking = '';
      let text = '';
      for await (const event of events) {
        if (event.type === 'thinking') {
          thinking += event.content || '';
          yield yieldParts(thinking, text);
        }
        if (event.type === 'delta') {
          text += event.content || '';
          yield yieldParts(thinking, text);
        }
        if (event.type === 'persisted') {
          if ('chatId' in event && event.chatId) onChatPersisted?.(event.chatId);
          if ('threadId' in event && event.threadId) onThreadPersisted?.(event.threadId);
        }
        if (event.type === 'error') {
          throw new Error(event.message || '回答失败');
        }
      }

      if (!text && thinking) yield yieldParts(thinking, '');
    },
  };
}
