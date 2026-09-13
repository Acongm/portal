import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'http://mock-supabase.test';
export const MOCK_ANON_KEY = 'mock-anon-key';
export const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
export const MOCK_ACCESS_TOKEN = 'mock-access-token-quality-gate';
export const MOCK_CHAT_ID = '11111111-1111-4111-8111-111111111111';
export const MOCK_CHAT_ID_GOLANG = '22222222-2222-4222-8222-222222222222';
export const CORE_PAGE_PATH = '/core/README.md';
export const GOLANG_PAGE_PATH = '/golang/daily-golang/lesson-01.md';
export const FIRST_ASSISTANT_REPLY = '你好，这是测试回复';
export const LONG_ASSISTANT_REPLY = Array.from({ length: 48 }, (_, index) => {
  const n = index + 1;
  return [
    `## ${n}. Firefox / Tailwind / GitHub`,
    '',
    `这是第 ${n} 段长回复，用来验证文档助手抽屉只滚动消息区。`,
    '',
    '```ts',
    `export const topic${n} = ${n};`,
    '```',
    '',
  ].join('\n');
}).join('\n');

export type QualityGateMockOptions = {
  longFirstReply?: boolean;
  emptyFirstReply?: boolean;
  authenticatedUser?: boolean;
  failHistoryRestore?: boolean;
  streamHttpError?: {
    status: number;
    message: string;
    code?: string;
  };
};

type StoredMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  client_message_id: string | null;
  parent_message_id: string | null;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text?: string }>;
  metadata: Record<string, unknown>;
  created_at: string;
};

const MOCK_SESSION = {
  access_token: MOCK_ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: '',
    phone: '',
    is_anonymous: true,
    app_metadata: { provider: 'anonymous' },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function chatIdForPagePath(pagePath?: string | null): string {
  if (pagePath?.includes('golang')) return MOCK_CHAT_ID_GOLANG;
  return MOCK_CHAT_ID;
}

function createMockStore(options: QualityGateMockOptions = {}) {
  const messagesByChat = new Map<string, StoredMessage[]>();
  let streamCount = 0;
  let historyGetAttempts = 0;
  let signedOut = false;

  function chatRecord(chatId: string, pagePath = '/core') {
    const stamp = new Date().toISOString();
    return {
      id: chatId,
      userId: MOCK_USER_ID,
      title: 'Quality gate chat',
      pagePath,
      moduleKey: pagePath.split('/').filter(Boolean)[0] || 'core',
      metadata: {},
      createdAt: stamp,
      updatedAt: stamp,
    };
  }

  function fulfillSupabaseAuth(route: Route) {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/v1/logout') && method === 'POST') {
      signedOut = true;
      return route.fulfill({ status: 204, body: '' });
    }

    if (url.includes('/auth/v1/signup') && method === 'POST') {
      return json(route, 200, MOCK_SESSION);
    }

    if (url.includes('/auth/v1/token') && method === 'POST') {
      return json(route, 200, MOCK_SESSION);
    }

    if (url.includes('/auth/v1/user') && method === 'GET') {
      return json(route, 200, MOCK_SESSION.user);
    }

    if (url.includes('/auth/v1/session') && method === 'GET') {
      return json(route, 200, { session: signedOut ? null : MOCK_SESSION });
    }

    return json(route, 200, {});
  }

  function fulfillAuthSession(route: Route) {
    if (signedOut) {
      return json(route, 200, {
        authenticated: false,
        configured: true,
        anonymous: false,
        user: null,
        userInfo: null,
        accessToken: null,
      });
    }

    if (options.authenticatedUser) {
      return json(route, 200, {
        authenticated: true,
        configured: true,
        isAnonymous: false,
        anonymous: false,
        user: {
          id: MOCK_USER_ID,
          email: 'qg-portal@acongm.com',
          name: 'Quality Gate',
          avatarUrl: null,
        },
        userInfo: {
          id: MOCK_USER_ID,
          displayName: 'Quality Gate',
          email: 'qg-portal@acongm.com',
          avatarUrl: null,
          accountLabel: 'qg-portal@acongm.com',
          role: 'user',
          tier: 'user',
          isAnonymous: false,
        },
        accessToken: MOCK_ACCESS_TOKEN,
      });
    }

    return json(route, 200, {
      authenticated: true,
      configured: true,
      anonymous: true,
      user: { id: MOCK_USER_ID, is_anonymous: true },
      userInfo: {
        id: MOCK_USER_ID,
        displayName: '访客',
        avatarUrl: null,
        isAnonymous: true,
      },
      accessToken: MOCK_ACCESS_TOKEN,
    });
  }

  function fulfillChats(route: Route) {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname === '/api/chats' && method === 'GET') {
      return json(route, 200, { chats: [], nextCursor: null });
    }

    if (pathname === '/api/chats' && method === 'POST') {
      let pagePath = '/core';
      try {
        const body = (route.request().postDataJSON() || {}) as Record<string, unknown>;
        if (typeof body.pagePath === 'string') pagePath = body.pagePath;
        else if (typeof body.page_path === 'string') pagePath = body.page_path;
      } catch {
        // keep default page path
      }
      const chatId = chatIdForPagePath(pagePath);
      return json(route, 201, {
        ...chatRecord(chatId, pagePath),
      });
    }

    const chatMatch = pathname.match(/^\/api\/chats\/([^/]+)$/);
    if (chatMatch && method === 'GET') {
      const chatId = chatMatch[1];
      if (options.failHistoryRestore && historyGetAttempts < 2) {
        historyGetAttempts += 1;
        return json(route, 500, {
          message: 'history temporarily unavailable',
          code: 'CHAT_HISTORY_UNAVAILABLE',
        });
      }

      const messages = [...(messagesByChat.get(chatId) ?? [])];
      if (url.searchParams.get('order') === 'desc') {
        messages.reverse();
      }

      const pagePath =
        chatId === MOCK_CHAT_ID_GOLANG ? GOLANG_PAGE_PATH : CORE_PAGE_PATH;
      return json(route, 200, {
        chat: chatRecord(chatId, pagePath),
        messages,
        nextCursor: null,
        prevCursor: null,
      });
    }

    const streamMatch = pathname.match(/^\/api\/chats\/([^/]+)\/messages\/stream$/);
    if (streamMatch && method === 'POST') {
      const chatId = streamMatch[1];
      if (options.streamHttpError) {
        return json(route, options.streamHttpError.status, {
          message: options.streamHttpError.message,
          code: options.streamHttpError.code || 'CHAT_BAD_REQUEST',
        });
      }

      streamCount += 1;
      const userMessageId = `user-msg-${streamCount}`;
      const assistantMessageId = `assistant-msg-${streamCount}`;
      const stamp = new Date().toISOString();
      let content = 'hello quality gate';
      try {
        const body = (route.request().postDataJSON() || {}) as Record<string, unknown>;
        if (typeof body.content === 'string' && body.content.trim()) {
          content = body.content.trim();
        }
      } catch {
        // keep default content
      }
      const reply = options.longFirstReply
        ? LONG_ASSISTANT_REPLY
        : FIRST_ASSISTANT_REPLY;

      if (!options.emptyFirstReply) {
        const rows = messagesByChat.get(chatId) ?? [];
        rows.push(
          {
            id: userMessageId,
            chat_id: chatId,
            user_id: MOCK_USER_ID,
            client_message_id: null,
            parent_message_id: null,
            role: 'user',
            parts: [{ type: 'text', text: content }],
            metadata: {},
            created_at: stamp,
          },
          {
            id: assistantMessageId,
            chat_id: chatId,
            user_id: MOCK_USER_ID,
            client_message_id: null,
            parent_message_id: userMessageId,
            role: 'assistant',
            parts: [{ type: 'text', text: reply }],
            metadata: {},
            created_at: stamp,
          },
        );
        messagesByChat.set(chatId, rows);
      }

      if (options.emptyFirstReply) {
        const emptySse = [
          'event: user-persisted',
          `data: ${JSON.stringify({
            type: 'user-persisted',
            chatId,
            messageId: userMessageId,
            runId: 'run-1',
          })}`,
          '',
          'event: done',
          `data: ${JSON.stringify({ type: 'done', runId: 'run-1', status: 'complete' })}`,
          '',
        ].join('\n');
        return route.fulfill({
          status: 201,
          contentType: 'text/event-stream',
          body: emptySse,
        });
      }

      const sse = [
        'event: user-persisted',
        `data: ${JSON.stringify({
          type: 'user-persisted',
          chatId,
          messageId: userMessageId,
          runId: `run-${streamCount}`,
        })}`,
        '',
        'event: delta',
        `data: ${JSON.stringify({
          type: 'delta',
          content: reply.slice(0, Math.ceil(reply.length / 2)),
        })}`,
        '',
        'event: delta',
        `data: ${JSON.stringify({
          type: 'delta',
          content: reply.slice(Math.ceil(reply.length / 2)),
        })}`,
        '',
        'event: persisted',
        `data: ${JSON.stringify({
          type: 'persisted',
          chatId,
          messageId: assistantMessageId,
          runId: `run-${streamCount}`,
        })}`,
        '',
        'event: done',
        `data: ${JSON.stringify({
          type: 'done',
          runId: `run-${streamCount}`,
          status: 'complete',
        })}`,
        '',
      ].join('\n');

      return route.fulfill({
        status: 201,
        contentType: 'text/event-stream',
        body: sse,
      });
    }

    return json(route, 404, { message: `unmocked chats route: ${method} ${pathname}` });
  }

  function fulfillUser(route: Route) {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname === '/api/user/info') {
      if (options.authenticatedUser && !signedOut) {
        return json(route, 200, {
          id: MOCK_USER_ID,
          email: 'qg-portal@acongm.com',
          name: 'Quality Gate',
          isAnonymous: false,
          role: 'user',
          tier: 'user',
          userInfo: {
            id: MOCK_USER_ID,
            displayName: 'Quality Gate',
            avatarUrl: null,
            email: 'qg-portal@acongm.com',
            accountLabel: 'qg-portal@acongm.com',
            role: 'user',
            tier: 'user',
            isAnonymous: false,
            source: 'auth',
          },
        });
      }
      return json(route, 200, {
        userInfo: {
          id: MOCK_USER_ID,
          displayName: '访客',
          avatarUrl: null,
          email: null,
          accountLabel: '访客',
          role: 'viewer',
          tier: 'user',
          isAnonymous: true,
          source: 'auth',
        },
      });
    }

    return json(route, 404, { message: `unmocked user route: ${pathname}` });
  }

  return {
    fulfillSupabaseAuth,
    fulfillAuthSession,
    fulfillChats,
    fulfillUser,
    seedHistory(
      chatId: string,
      userText: string,
      assistantText: string,
    ) {
      const stamp = new Date().toISOString();
      messagesByChat.set(chatId, [
        {
          id: 'seed-user-msg',
          chat_id: chatId,
          user_id: MOCK_USER_ID,
          client_message_id: null,
          parent_message_id: null,
          role: 'user',
          parts: [{ type: 'text', text: userText }],
          metadata: {},
          created_at: stamp,
        },
        {
          id: 'seed-assistant-msg',
          chat_id: chatId,
          user_id: MOCK_USER_ID,
          client_message_id: null,
          parent_message_id: 'seed-user-msg',
          role: 'assistant',
          parts: [{ type: 'text', text: assistantText }],
          metadata: {},
          created_at: stamp,
        },
      ]);
    },
  };
}

/** Intercept same-origin BFF routes and Supabase auth for local #37 browser smoke. */
export async function installQualityGateMocks(
  page: Page,
  options: QualityGateMockOptions = {},
) {
  const store = createMockStore(options);
  await page.unroute(`${MOCK_SUPABASE_URL}/**`).catch(() => undefined);
  await page.unroute('**/api/auth/session').catch(() => undefined);
  await page.unroute('**/api/chats**').catch(() => undefined);
  await page.unroute('**/api/user/**').catch(() => undefined);
  await page.route(`${MOCK_SUPABASE_URL}/**`, (route) =>
    store.fulfillSupabaseAuth(route),
  );
  await page.route('**/api/auth/session', (route) => store.fulfillAuthSession(route));
  await page.route('**/api/chats**', (route) => store.fulfillChats(route));
  await page.route('**/api/user/**', (route) => store.fulfillUser(route));
  return store;
}
