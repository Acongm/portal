import type { ChatV1Request, ChatV1StreamEvent } from '@acongm/kb-types';
import { buildChatHeaders } from './chat-client';

/** 同源代理路径（Next.js route 或其它 BFF） */
export const DEFAULT_CHAT_STREAM_PROXY = '/api/ai/v1/chat/stream';
export const DEFAULT_CHAT_STREAM_UPSTREAM =
  'https://api.acongm.com/api/ai/v1/chat/stream';

export type StreamChatOptions = {
  url?: string;
  signal?: AbortSignal;
  callSource?: string;
};

export function resolveChatStreamUrl(configured?: string): string {
  const value = (configured ?? '').trim();
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]';
    const isPreview = hostname.endsWith('.vercel.app');
    if (isLocal || isPreview) return DEFAULT_CHAT_STREAM_PROXY;
    if (hostname === 'www.acongm.com' || hostname === 'acongm.com') {
      return value || DEFAULT_CHAT_STREAM_UPSTREAM;
    }
  }
  if (!value) return DEFAULT_CHAT_STREAM_PROXY;
  if (value.startsWith('/')) return value;
  if (/\/api\/ai\/v1\/chat\/stream\/?$/.test(value)) return value;
  return value.replace(/\/api\/ai\/chat\/?$/, '/api/ai/v1/chat/stream');
}

export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatV1StreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || '';
    for (const frame of frames) {
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (!data) continue;
      try {
        yield JSON.parse(data) as ChatV1StreamEvent;
      } catch {
        // ignore malformed frames
      }
    }
    if (done) break;
  }
}

export async function streamChatV1(
  payload: ChatV1Request,
  options: StreamChatOptions = {},
): Promise<AsyncGenerator<ChatV1StreamEvent>> {
  const pagePath = payload.context.pagePath ?? '/';
  const callSource = options.callSource || 'portal:reading-assistant';
  const response = await fetch(
    options.url || resolveChatStreamUrl(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...buildChatHeaders({ pagePath, callSource }),
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    },
  );
  if (!response.ok || !response.body) {
    throw new Error(`对话请求失败 (${response.status})`);
  }
  return parseSseStream(response.body);
}
