import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assistantErrorText } from '../../packages/chat-ui/src/thread/assistant-error.ts';

test('incomplete adapter errors keep their message for the assistant bubble', () => {
  assert.equal(
    assistantErrorText({
      type: 'incomplete',
      reason: 'error',
      error: new Error('模型没有返回内容，请重试。'),
    }),
    '模型没有返回内容，请重试。',
  );
  assert.equal(
    assistantErrorText({
      type: 'incomplete',
      reason: 'error',
      error: '对话请求失败 (400)',
    }),
    '对话请求失败 (400)',
  );
  assert.equal(
    assistantErrorText({
      type: 'incomplete',
      reason: 'error',
      error: { message: '模型没有返回内容，请重试。' },
    }),
    '模型没有返回内容，请重试。',
  );
  assert.equal(
    assistantErrorText({ type: 'incomplete', reason: 'error' }),
    '回复失败，请重试。',
  );
});

test('running, complete, and cancelled statuses do not show an error banner', () => {
  assert.equal(assistantErrorText({ type: 'running' }), null);
  assert.equal(assistantErrorText({ type: 'complete' }), null);
  assert.equal(
    assistantErrorText({ type: 'incomplete', reason: 'cancelled' }),
    null,
  );
  assert.equal(assistantErrorText(undefined), null);
});

test('assistant thread renders incomplete errors instead of an empty bubble', () => {
  const thread = readFileSync(
    'packages/chat-ui/src/thread/AssistantThread.tsx',
    'utf8',
  );
  assert.match(thread, /assistantErrorText/);
  assert.match(thread, /acongm-gpt-msg__error/);
  assert.match(thread, /role="alert"/);
});
