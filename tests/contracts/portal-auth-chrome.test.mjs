import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chrome = readFileSync(
  'apps/web/components/portal-theme-switch-with-knowledge.tsx',
  'utf8',
);
const embed = readFileSync('apps/web/components/doc-chat-embed.tsx', 'utf8');

test('Portal chrome reads session without creating anonymous auth users', () => {
  assert.match(chrome, /useSession\(\)/);
  assert.doesNotMatch(chrome, /ensureAnonymous/);
  assert.match(chrome, /status === 'error'/);
  assert.match(chrome, /retry/);
  assert.match(chrome, /AuthAccountButton/);
  assert.match(chrome, /\/account#settings/);
});

test('Portal embed surfaces restore errors and keeps the composer open for guests', () => {
  assert.match(embed, /restoreError/);
  assert.match(embed, /composerDisabled/);
  assert.match(embed, /正在准备安全会话/);
  assert.match(embed, /ensureGuestAuth/);
  assert.doesNotMatch(embed, /请先登录后再发送/);
  assert.match(embed, /status === 'error'/);
  assert.match(embed, /retry/);
});

test('Portal user and session BFFs forward the shared auth cookie', () => {
  const user = readFileSync('apps/web/app/api/user/[[...path]]/route.ts', 'utf8');
  const session = readFileSync('apps/web/app/api/auth/session/route.ts', 'utf8');
  assert.match(user, /'cookie'/);
  assert.match(session, /api\/auth\/session/);
});

test('Portal public-config BFF prefers local env then auth then API', () => {
  const route = readFileSync('apps/web/app/api/auth/public-config/route.ts', 'utf8');
  assert.match(route, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(route, /https:\/\/auth\.acongm\.com\/api\/auth\/public-config/);
  assert.match(route, /https:\/\/api\.acongm\.com\/api\/auth\/public-config/);
  assert.match(route, /public, max-age=300/);
});

test('Portal auth-client routes anonymous login CTA into signup mode', () => {
  const hooks = readFileSync('packages/auth-client/src/hooks.tsx', 'utf8');
  const button = readFileSync('packages/auth-client/src/AuthAccountButton.tsx', 'utf8');
  assert.match(hooks, /resolveOAuthLoginMode\(session\)/);
  assert.match(button, /useAuthActions\(\{ client, session \}\)/);
});
