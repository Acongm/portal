'use client';

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import type { ChatUiMessage } from '@acongm/kb-types';
import {
  clearChatHistory,
  loadChatHistory,
  modelHistory,
  resolveCallSource,
  saveChatHistory,
} from './runtime/chat-client';
import { streamChatV1 } from './runtime/chat-stream';
import {
  CHAT_V1_TAGS,
  deriveTagOptions,
  insertChatTag,
  type ChatTagKey,
} from './runtime/chat-tags';
import {
  buildSummaryCardContent,
  loadSummaryV1,
} from './runtime/summary-v1';
import { ChatMarkdown } from './ChatMarkdown';

export type DocChatContext = {
  /** summaries / API 使用的文档路径键，如 /react/react16.md */
  pagePath: string;
  moduleKey?: string;
  title?: string;
  tags?: string[];
  /** 当前页正文（调用方可从 DOM 提取后传入） */
  content?: string;
  /** 覆盖默认流式 URL */
  streamUrl?: string;
  /** 覆盖 summaries JSON 地址 */
  summariesUrl?: string;
};

export type ChatPanelProps = {
  active: boolean;
  context: DocChatContext;
  className?: string;
};

export function ChatPanel({ active, context, className }: ChatPanelProps) {
  const {
    pagePath,
    moduleKey = '',
    title = '当前文档',
    tags = [],
    content = '',
    streamUrl,
    summariesUrl,
  } = context;

  const messagesEl = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pathRef = useRef(pagePath);

  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pageContent, setPageContent] = useState(content);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState('');
  const [lastCompletedQuestion, setLastCompletedQuestion] = useState('');

  const scrollToBottom = useCallback(() => {
    const el = messagesEl.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const persist = useCallback((next: ChatUiMessage[], path = pathRef.current) => {
    if (typeof sessionStorage !== 'undefined') {
      saveChatHistory(sessionStorage, path, next);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const bootstrap = useEffectEvent(async (path: string, body: string) => {
    setPageContent(body);
    let initial: ChatUiMessage[] = [];
    if (typeof sessionStorage !== 'undefined') {
      initial = loadChatHistory(sessionStorage, path);
    }

    if (!initial.some((m) => m.isSummary)) {
      setSummaryLoading(true);
      try {
        const result = await loadSummaryV1(path, { url: summariesUrl });
        initial = [
          {
            id: `summary-${path}`,
            role: 'assistant',
            content: buildSummaryCardContent(result),
            isSummary: true,
          },
          ...initial,
        ];
      } catch {
        initial = [
          {
            id: `summary-${path}`,
            role: 'assistant',
            content: buildSummaryCardContent(null, { snapshotMissing: true }),
            isSummary: true,
          },
          ...initial,
        ];
      } finally {
        setSummaryLoading(false);
      }
    }

    setMessages(initial);
    persist(initial, path);
    requestAnimationFrame(scrollToBottom);
  });

  useEffect(() => {
    pathRef.current = pagePath;
    stopGeneration();
    setMessages([]);
    setInputText('');
    setLastFailedQuestion('');
    setLastCompletedQuestion('');
    if (active) void bootstrap(pagePath, content);
  }, [active, pagePath, content, stopGeneration]);

  useEffect(() => () => stopGeneration(), [stopGeneration]);

  const applyQuickTag = (key: ChatTagKey) => {
    setInputText((prev) => insertChatTag(prev, key));
    inputEl.current?.focus();
  };

  const sendMessage = async (
    questionOverride = '',
    options: {
      reuseUserMessage?: boolean;
      baseMessages?: ChatUiMessage[];
    } = {},
  ) => {
    const question = String(questionOverride || inputText).trim();
    if (!question || chatLoading) return;

    let nextMessages = [...(options.baseMessages ?? messages)];
    if (!options.reuseUserMessage) {
      nextMessages.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
      });
    }
    setInputText('');
    setLastFailedQuestion('');

    const answer: ChatUiMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      streaming: true,
    };
    nextMessages = [...nextMessages, answer];
    setMessages(nextMessages);
    setChatLoading(true);
    requestAnimationFrame(scrollToBottom);

    const controller = new AbortController();
    abortRef.current = controller;
    const tagOptions = deriveTagOptions(question);
    const callSource = resolveCallSource(
      tagOptions.scope,
      tagOptions.enableWebSearch,
    );

    try {
      const events = await streamChatV1(
        {
          messages: modelHistory(nextMessages.filter((item) => item !== answer)),
          context: {
            scope: tagOptions.scope,
            pagePath,
            moduleKey,
            title,
            tags,
            content: pageContent || content,
          },
          enableWebSearch: tagOptions.enableWebSearch,
        },
        { signal: controller.signal, callSource, url: streamUrl },
      );

      for await (const event of events) {
        if (event.type === 'delta') {
          answer.content += event.content || '';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === answer.id ? { ...m, content: answer.content } : m,
            ),
          );
          requestAnimationFrame(scrollToBottom);
        }
        if (event.type === 'error') {
          throw new Error(event.message || '回答失败');
        }
      }

      answer.streaming = false;
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === answer.id ? { ...m, streaming: false } : m,
        );
        persist(updated);
        return updated;
      });
      setLastCompletedQuestion(question);
    } catch (error) {
      const err = error as { name?: string; message?: string };
      answer.streaming = false;
      if (!answer.content) {
        answer.content =
          err?.name === 'AbortError'
            ? '已停止生成。'
            : err?.message || '回答失败，请重试。';
      }
      answer.isError = err?.name !== 'AbortError';
      if (answer.isError) setLastFailedQuestion(question);
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === answer.id
            ? {
                ...m,
                content: answer.content,
                streaming: false,
                isError: answer.isError,
              }
            : m,
        );
        persist(updated);
        return updated;
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setChatLoading(false);
    }
  };

  const retryLast = () => {
    const question = lastFailedQuestion;
    const last = messages[messages.length - 1];
    const base = last?.isError ? messages.slice(0, -1) : messages;
    setMessages(base);
    void sendMessage(question, { reuseUserMessage: true, baseMessages: base });
  };

  const regenerateLast = () => {
    const question = lastCompletedQuestion;
    const last = messages[messages.length - 1];
    const base =
      last?.role === 'assistant' && !last.isSummary
        ? messages.slice(0, -1)
        : messages;
    setMessages(base);
    void sendMessage(question, { reuseUserMessage: true, baseMessages: base });
  };

  const clearConversation = () => {
    stopGeneration();
    setMessages((prev) => {
      const kept = prev.filter((m) => m.isSummary);
      if (typeof sessionStorage !== 'undefined') {
        clearChatHistory(sessionStorage, pagePath);
      }
      persist(kept);
      return kept;
    });
    setLastFailedQuestion('');
    setLastCompletedQuestion('');
  };

  const copyMessage = async (text: string) => {
    await navigator.clipboard?.writeText(text);
  };

  return (
    <section
      className={['acongm-chat-panel', className].filter(Boolean).join(' ')}
    >
      <div
        ref={messagesEl}
        className="acongm-chat-panel__messages"
        aria-live="polite"
      >
        {summaryLoading ? (
          <article className="acongm-summary-card is-loading">
            <span className="acongm-summary-card__eyebrow">构建期 AI 提炼</span>
            <p>正在读取静态摘要…</p>
          </article>
        ) : null}

        {messages.map((message) =>
          message.isSummary ? (
            <article key={message.id} className="acongm-summary-card">
              <span className="acongm-summary-card__eyebrow">构建期 AI 提炼</span>
              <p className="acongm-summary-card__content">{message.content}</p>
            </article>
          ) : (
            <article
              key={message.id}
              className={`acongm-chat-message is-${message.role}${
                message.isError ? ' is-error' : ''
              }`}
            >
              <div className="acongm-chat-message__meta">
                <span>{message.role === 'user' ? '你' : 'AI'}</span>
                {message.role === 'assistant' && message.content ? (
                  <button
                    type="button"
                    onClick={() => void copyMessage(message.content)}
                  >
                    复制
                  </button>
                ) : null}
              </div>
              <div className="acongm-chat-message__body">
                {message.role === 'assistant' ? (
                  <>
                    <ChatMarkdown
                      content={message.content}
                      streaming={message.streaming}
                    />
                    {message.streaming ? (
                      <span className="acongm-chat-cursor" aria-hidden />
                    ) : null}
                  </>
                ) : (
                  message.content
                )}
              </div>
            </article>
          ),
        )}
      </div>

      <footer className="acongm-chat-composer">
        <div className="acongm-chat-composer__topline">
          <div className="acongm-chat-quick-tags" aria-label="提问快捷选项">
            {CHAT_V1_TAGS.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => applyQuickTag(tag.key)}
              >
                + {tag.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="acongm-chat-clear"
            onClick={clearConversation}
          >
            清空
          </button>
        </div>

        <div className="acongm-chat-composer__box">
          <textarea
            ref={inputEl}
            rows={2}
            value={inputText}
            placeholder="结合文档提问，快捷选项可继续编辑…"
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          {chatLoading ? (
            <button
              type="button"
              className="is-stop"
              onClick={stopGeneration}
            >
              停止
            </button>
          ) : (
            <button
              type="button"
              disabled={!inputText.trim()}
              onClick={() => void sendMessage()}
            >
              发送
            </button>
          )}
        </div>

        {lastFailedQuestion || lastCompletedQuestion ? (
          <div className="acongm-chat-composer__actions">
            {lastFailedQuestion ? (
              <button type="button" onClick={retryLast}>
                重试
              </button>
            ) : null}
            {lastCompletedQuestion ? (
              <button type="button" onClick={regenerateLast}>
                重新生成
              </button>
            ) : null}
          </div>
        ) : null}

        <p className="acongm-chat-composer__hint">
          仅发送消息时调用 AI 接口；页面摘要来自构建缓存。
        </p>
      </footer>
    </section>
  );
}
