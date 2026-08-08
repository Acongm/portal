import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const embed = read('apps/web/components/doc-chat-embed.tsx');
const bff = read('apps/web/app/api/chats/[[...path]]/route.ts');
const authClient = read('packages/auth-client/src/client.ts');
const authHooks = read('packages/auth-client/src/hooks.tsx');
const adapter = read('packages/chat-ui/src/runtime/createDocChatModelAdapter.ts');
const identities = read('packages/chat-ui/src/runtime/chat-v2-identities.ts');
const runtime = read('packages/chat-ui/src/runtime/DocChatRuntimeProvider.tsx');

test('Portal guests receive a real Supabase anonymous identity before Chat renders', () => {
  assert.match(authClient, /client\.auth\.signInAnonymously\(\)/);
  assert.match(authHooks, /ensureAnonymousSession\(client\)/);
  assert.match(embed, /if \(authLoading \|\| !session \|\| !chatReady\) return null/);
});

test('Portal stores only a user/page chat pointer and restores transcript from Chat v2', () => {
  assert.match(embed, /acongm\.portal\.chat\.v2:\$\{userId\}:\$\{pagePath\}/);
  assert.match(embed, /getChatV2\(stored/);
  assert.match(embed, /selectActiveChatBranch\(detail\.messages\)/);
  assert.match(embed, /setSeedMessages\(/);
  assert.match(embed, /detail\.chat\.userId !== userId/);
  assert.doesNotMatch(embed, /saveChatHistory\(/);
});

test('Portal lazy-creates a durable chat and never supplies a ChatV1 stream URL', () => {
  assert.match(embed, /createChatV2\(/);
  assert.match(embed, /ensureChat,/);
  assert.match(embed, /chatsBaseUrl: CHAT_BASE/);
  assert.match(embed, /accessToken,/);
  assert.match(embed, /surface: 'portal'/);
  assert.doesNotMatch(embed, /streamUrl:/);
  assert.doesNotMatch(embed, /ensureThread|threadsBaseUrl|threadId:/);
});

test('runtime identity stays stable through draft-to-chat promotion but changes across auth uid/page', () => {
  assert.match(embed, /runtimeKey: userId \? `portal:\$\{userId\}:\$\{pagePath\}`/);
  assert.match(runtime, /function seedFingerprint\(/);
  assert.match(runtime, /const seedKey = seedFingerprint\(seedMessages\)/);
  assert.match(runtime, /if \(context\.chatId\?\.trim\(\)\) return `chat:/);
});

test('Chat v2 adapter sends durable message/run identities when a chat exists', () => {
  assert.match(adapter, /streamChatMessageV2\(/);
  assert.match(adapter, /resolveChatV2RunIdentity\(/);
  assert.match(adapter, /unstable_assistantMessageId/);
  assert.match(identities, /clientMessageId: currentUser\.id/);
  assert.match(identities, /parentMessageId:/);
  assert.match(identities, /assistantMessageId: assistantMessageId \|\| undefined/);
  assert.match(identities, /runId: createRunId\(\)/);
});

test('same-origin chats BFF forwards authorization to the API upstream', () => {
  assert.match(bff, /https:\/\/api\.acongm\.com\/api\/chats/);
  assert.match(bff, /'authorization'/);
  assert.match(bff, /request\.headers\.get\(name\)/);
  assert.match(bff, /CHAT_UPSTREAM_UNREACHABLE/);
});
