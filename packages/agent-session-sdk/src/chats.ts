import type {
  ChatV2Detail,
  ChatV2Message,
  ChatV2Page,
  ChatV2Record,
  ChatV2StreamEvent,
  CreateChatV2MessageRequest,
  CreateChatV2Request,
  UpdateChatV2Request,
} from '@acongm/kb-types';
import { ChatStreamError, parseSseStream } from './chat-stream';

export const DEFAULT_CHATS_PROXY = '/api/chats';

export type ChatV2RequestOptions = {
  baseUrl?: string;
  accessToken?: string;
  signal?: AbortSignal;
};

type RawChat = {
  id: string;
  user_id: string;
  title: string | null;
  page_path: string | null;
  module_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type RawMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  client_message_id: string | null;
  parent_message_id: string | null;
  role: ChatV2Message['role'];
  parts: ChatV2Message['parts'];
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function base(value?: string): string {
  return value?.trim() || DEFAULT_CHATS_PROXY;
}

function headers(
  accessToken?: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  };
}

async function readBody(response: Response): Promise<unknown> {
  try {
    if ((response.headers.get('content-type') || '').includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return text ? { message: text } : undefined;
  } catch {
    return undefined;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const responseBody = await readBody(response);
    const record =
      responseBody && typeof responseBody === 'object'
        ? (responseBody as Record<string, unknown>)
        : {};
    throw new ChatStreamError(
      typeof record.message === 'string'
        ? record.message
        : `Chat 请求失败 (${response.status})`,
      {
        status: response.status,
        code: typeof record.code === 'string' ? record.code : undefined,
        body: responseBody,
      },
    );
  }
  return (await response.json()) as T;
}

function normalizeChat(raw: RawChat): ChatV2Record {
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title || undefined,
    pagePath: raw.page_path || undefined,
    moduleKey: raw.module_key || undefined,
    metadata: raw.metadata || {},
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeMessage(raw: RawMessage): ChatV2Message {
  return {
    id: raw.id,
    chatId: raw.chat_id,
    userId: raw.user_id,
    clientMessageId: raw.client_message_id || undefined,
    parentMessageId: raw.parent_message_id || undefined,
    role: raw.role,
    parts: Array.isArray(raw.parts) ? raw.parts : [],
    metadata: raw.metadata || {},
    createdAt: raw.created_at,
  };
}

function pageUrl(
  baseUrl: string,
  page: { limit?: number; after?: string },
): string {
  const params = new URLSearchParams();
  if (page.limit !== undefined) params.set('limit', String(page.limit));
  if (page.after) params.set('after', page.after);
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

export async function createChatV2(
  input: CreateChatV2Request = {},
  options: ChatV2RequestOptions = {},
): Promise<ChatV2Record> {
  return normalizeChat(
    await readJson<RawChat>(
      await fetch(base(options.baseUrl), {
        method: 'POST',
        headers: headers(options.accessToken),
        body: JSON.stringify(input),
        signal: options.signal,
      }),
    ),
  );
}

export async function getChatV2(
  id: string,
  options: ChatV2RequestOptions = {},
): Promise<ChatV2Detail> {
  const raw = await readJson<{
    chat: RawChat;
    messages?: RawMessage[];
    nextCursor?: string | null;
  }>(
    await fetch(`${base(options.baseUrl)}/${encodeURIComponent(id)}`, {
      headers: headers(options.accessToken),
      signal: options.signal,
    }),
  );
  return {
    chat: normalizeChat(raw.chat),
    messages: (raw.messages || []).map(normalizeMessage),
    nextCursor: raw.nextCursor || undefined,
  };
}

export async function listChatMessagesV2(
  id: string,
  page: { limit?: number; after?: string } = {},
  options: ChatV2RequestOptions = {},
): Promise<ChatV2Page<ChatV2Message>> {
  const raw = await readJson<{
    messages?: RawMessage[];
    nextCursor?: string | null;
  }>(
    await fetch(
      pageUrl(`${base(options.baseUrl)}/${encodeURIComponent(id)}/messages`, page),
      {
        headers: headers(options.accessToken),
        signal: options.signal,
      },
    ),
  );
  return {
    items: (raw.messages || []).map(normalizeMessage),
    nextCursor: raw.nextCursor || undefined,
  };
}

export async function streamChatMessageV2(
  id: string,
  input: CreateChatV2MessageRequest,
  options: ChatV2RequestOptions = {},
): Promise<AsyncGenerator<ChatV2StreamEvent>> {
  const response = await fetch(
    `${base(options.baseUrl)}/${encodeURIComponent(id)}/messages/stream`,
    {
      method: 'POST',
      headers: headers(options.accessToken, { Accept: 'text/event-stream' }),
      body: JSON.stringify(input),
      signal: options.signal,
    },
  );
  if (!response.ok || !response.body) {
    const responseBody = await readBody(response);
    const record =
      responseBody && typeof responseBody === 'object'
        ? (responseBody as Record<string, unknown>)
        : {};
    throw new ChatStreamError(
      typeof record.message === 'string'
        ? record.message
        : `Chat 请求失败 (${response.status})`,
      {
        status: response.status,
        code: typeof record.code === 'string' ? record.code : undefined,
        body: responseBody,
      },
    );
  }
  return parseSseStream<ChatV2StreamEvent>(response.body);
}

export async function listChatsV2(
  page: { limit?: number; after?: string } = {},
  options: ChatV2RequestOptions = {},
): Promise<ChatV2Page<ChatV2Record>> {
  const raw = await readJson<{
    chats?: RawChat[];
    nextCursor?: string | null;
  }>(
    await fetch(pageUrl(base(options.baseUrl), page), {
      headers: headers(options.accessToken),
      signal: options.signal,
    }),
  );
  return {
    items: (raw.chats || []).map(normalizeChat),
    nextCursor: raw.nextCursor || undefined,
  };
}

export async function updateChatV2(
  id: string,
  patch: UpdateChatV2Request,
  options: ChatV2RequestOptions = {},
): Promise<ChatV2Record> {
  return normalizeChat(
    await readJson<RawChat>(
      await fetch(`${base(options.baseUrl)}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: headers(options.accessToken),
        body: JSON.stringify(patch),
        signal: options.signal,
      }),
    ),
  );
}
