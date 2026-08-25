import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const embed = read('apps/web/components/doc-chat-embed.tsx');
const hook = read('packages/chat-ui/src/integration/use-page-bound-chat.ts');
const bff = read('apps/web/app/api/chats/[[...path]]/route.ts');
const userBff = read('apps/web/app/api/user/[[...path]]/route.ts');
const authClient = read('packages/auth-client/src/client.ts');
const authHooks = read('packages/auth-client/src/hooks.tsx');
const adapter = read('packages/chat-ui/src/runtime/createDocChatModelAdapter.ts');
const runtime = read('packages/chat-ui/src/runtime/DocChatRuntimeProvider.tsx');
const restore = read('packages/agent-session-sdk/src/chat-v2-restore.ts');

test('Portal guests keep a Client ID and create anonymous auth only on first send', () => {
  assert.match(authClient, /client\.auth\.signInAnonymously\(/);
  assert.match(authClient, /user_metadata\?\.cid/);
  assert.match(authHooks, /getOrCreateClientId\(\)/);
  assert.match(authHooks, /ensureGuestAuth/);
  assert.doesNotMatch(authHooks, /ensureAnonymousSession\(nextClient\)/);
  assert.match(embed, /ensureGuestAuth/);
  assert.match(embed, /prepareAuth/);
  assert.match(embed, /composerDisabled/);
  assert.match(
    embed,
    /const composerDisabled = status === 'restoring' \|\| status === 'error'/,
  );
  assert.doesNotMatch(embed, /请先登录后再发送/);
  assert.doesNotMatch(
    embed,
    /if \(authLoading \|\| !session \|\| !chatReady\) return null/,
  );
});

test('Portal stores only a user/page chat pointer and restores via shared hook', () => {
  assert.match(embed, /acongm\.portal\.chat\.v2:\$\{userId\}:\$\{pagePath\}/);
  assert.match(embed, /usePageBoundChat/);
  assert.match(hook, /getChatV2/);
  assert.match(hook, /detail\.chat\.userId !== userId/);
  assert.match(hook, /mapDurableBranchToUiMessages/);
  assert.doesNotMatch(embed, /saveChatHistory\(/);
});

test('Portal restores durable history tail-first instead of paging the full transcript first', () => {
  assert.match(restore, /export async function loadChatV2History/);
  assert.match(restore, /paginateOlderTailMessages/);
  assert.match(hook, /getChatV2\(stored, requestOptions\)/);
  assert.match(hook, /loadOlderMessages/);
  assert.match(embed, /hasOlderMessages/);
  assert.match(embed, /onLoadOlderMessages/);
});

test('history restore failures only discard a confirmed stale pointer and otherwise fail closed', () => {
  assert.match(hook, /error instanceof ChatStreamError && error.status === 404/);
  assert.match(hook, /localStorage\.removeItem\(resolvePointerKey\(userId\)\)/);
  assert.match(hook, /setRestoreError\(/);
  assert.match(hook, /if \(restoreError\)/);
  assert.match(hook, /无法恢复已有会话：/);
  assert.doesNotMatch(hook, /setSeedMessages\(\[\]\)/);
});

test('Portal lazy-creates a durable chat and never supplies a ChatV1 stream URL', () => {
  assert.match(hook, /createChatV2\(/);
  assert.match(embed, /ensureChat,/);
  assert.match(embed, /chatsBaseUrl: CHAT_BASE/);
  assert.match(embed, /accessToken,/);
  assert.match(embed, /surface: 'portal'/);
  assert.doesNotMatch(embed, /streamUrl:/);
  assert.doesNotMatch(embed, /ensureThread|threadsBaseUrl|threadId:/);
});

test('runtime identity stays stable through draft-to-chat promotion but changes across auth uid/page', () => {
  assert.match(embed, /function resolvePortalRuntimeKey/);
  assert.match(embed, /portal:\$\{input\.clientId \|\| 'guest'\}:\$\{input\.pagePath\}/);
  assert.match(embed, /portal:\$\{input\.userId\}:\$\{input\.pagePath\}/);
  assert.match(runtime, /function seedFingerprint\(/);
  assert.match(runtime, /const seedKey = seedFingerprint\(seedMessages\)/);
});

test('Chat v2 adapter sends canonical durable message/run identities when a chat exists', () => {
  assert.match(adapter, /streamChatMessageV2\(/);
  assert.match(adapter, /clientMessageId: currentUser\.message\.id/);
  assert.match(adapter, /parentMessageId: parentOfCurrentUser\(messages, currentUser\.index\)/);
  assert.match(adapter, /assistantMessageId: unstable_assistantMessageId/);
  assert.match(adapter, /runId: createRunId\(\)/);
  assert.match(adapter, /crypto\.randomUUID\(\)/);
  assert.doesNotMatch(adapter, /streamThreadMessage|ensureThread|threadsBaseUrl/);
});

test('same-origin chats BFF forwards authorization to the API upstream', () => {
  assert.match(bff, /https:\/\/api\.acongm\.com\/api\/chats/);
  assert.match(bff, /'authorization'/);
  assert.match(bff, /'cookie'/);
  assert.match(bff, /request\.headers\.get\(name\)/);
  assert.match(bff, /CHAT_UPSTREAM_UNREACHABLE/);
  assert.match(bff, /function responseHeaders/);
  assert.doesNotMatch(bff, /headers: upstream\.headers/);
});

test('chats BFF stamps a portal call source and request id without a service key', () => {
  const stream = read('apps/web/app/api/ai/v1/chat/stream/route.ts');
  assert.match(bff, /applyUpstreamCallerHeaders\(headers, 'portal:bff:chats'\)/);
  assert.match(bff, /echoRequestId/);
  assert.doesNotMatch(bff, /x-service-key/);
  assert.doesNotMatch(bff, /['"]x-client-id['"]/i);
  assert.match(stream, /applyUpstreamCallerHeaders\(headers, 'portal:doc-chat'\)/);
  assert.match(stream, /echoRequestId/);
  assert.doesNotMatch(stream, /x-service-key/);
});

test('User BFF proxies /api/user so getUserInfo works after login', () => {
  assert.match(userBff, /https:\/\/api\.acongm\.com\/api\/user/);
  assert.match(userBff, /'authorization'/);
  assert.match(userBff, /USER_UPSTREAM_UNREACHABLE/);
});

test('docs drawer keeps an inner scroll pane and a relative composer', () => {
  const thread = read('packages/chat-ui/src/thread/AssistantThread.tsx');
  const css = read('packages/chat-ui/src/styles/chatgpt.css');
  const drawer = read('packages/chat-ui/src/styles/chat-ui.css');
  assert.match(
    thread,
    /ThreadPrimitive\.Viewport[\s\S]*<\/ThreadPrimitive\.Viewport>\s*<ConversationFooter/,
  );
  assert.doesNotMatch(thread, /ThreadPrimitive\.ViewportFooter/);
  assert.match(css, /\.acongm-gpt-thread__footer\s*\{[\s\S]*position:\s*fixed/);
  assert.doesNotMatch(
    css,
    /\.acongm-gpt-thread__footer\s*\{[^}]*position:\s*sticky/,
  );
  assert.match(
    drawer,
    /\.acongm-chat-rd \.acongm-gpt-thread\s*\{[\s\S]*overflow:\s*hidden/,
  );
  assert.match(
    drawer,
    /\.acongm-chat-rd \.acongm-gpt-thread__viewport\s*\{[\s\S]*overflow-y:\s*auto/,
  );
  assert.match(
    drawer,
    /\.acongm-chat-rd \.acongm-gpt-thread__footer\s*\{[\s\S]*position:\s*relative/,
  );
  assert.match(
    drawer,
    /\.acongm-chat-rd\.is-desktop[\s\S]*max-height:\s*calc\(100dvh/,
  );
  assert.doesNotMatch(
    drawer,
    /\.acongm-chat-fullscreen\s*\{[^}]*min-height:\s*100dvh/,
  );
  assert.doesNotMatch(
    drawer,
    /\.acongm-chat-shell\.is-fullscreen\s*\{[^}]*max-height:\s*none/,
  );
});
