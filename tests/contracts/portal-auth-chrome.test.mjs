import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chrome = readFileSync(
  'apps/web/components/portal-theme-switch-with-knowledge.tsx',
  'utf8',
);
const embed = readFileSync('apps/web/components/doc-chat-embed.tsx', 'utf8');

test('Portal chrome bootstraps anonymous session and retries failed auth', () => {
  assert.match(chrome, /ensureAnonymous/);
  assert.match(chrome, /status === 'error'/);
  assert.match(chrome, /retry/);
  assert.match(chrome, /AuthAccountButton/);
  assert.match(chrome, /\/account#settings/);
});

test('Portal embed surfaces restore errors and keeps the composer gated only while preparing', () => {
  assert.match(embed, /restoreError/);
  assert.match(embed, /composerDisabled/);
  assert.match(embed, /正在准备安全会话/);
  assert.match(embed, /status === 'error'/);
  assert.match(embed, /retry/);
});
