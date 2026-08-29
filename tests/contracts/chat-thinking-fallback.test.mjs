import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  createThinkSplitState,
  extractThinkFromText,
  flushThinkSplit,
  splitThinkDelta,
} from '../../packages/agent-session-sdk/src/think-text.ts';

const read = (path) => readFileSync(path, 'utf8');
const adapter = read('packages/chat-ui/src/runtime/createDocChatModelAdapter.ts');
const thread = read('packages/chat-ui/src/thread/AssistantThread.tsx');

test('adapter only emits reasoning parts when thinking text is non-empty', () => {
  assert.match(adapter, /if \(thinking\.trim\(\)\)/);
  assert.doesNotMatch(adapter, /if \(enableThinking \|\| thinking\)/);
  assert.doesNotMatch(adapter, /yield yieldParts\('', '', enableThinking\)/);
  assert.match(adapter, /yield yieldParts\(thinking, text\);/);
});

test('reasoning UI hides when there is no thinking content and stream is idle', () => {
  assert.match(thread, /if \(!text\.trim\(\) && !running\) return null;/);
  assert.doesNotMatch(
    thread,
    /模型未返回推理内容/,
  );
  assert.match(
    thread,
    /state\.message\.status\?\.type === 'running'/,
  );
});

test('think-text splits redacted_thinking tags from answer text', () => {
  const input =
    '前缀<think>分析 fmt 包</think>fmt 用于格式化输出。';
  const parsed = extractThinkFromText(input);
  assert.equal(parsed.thinking, '分析 fmt 包');
  assert.equal(parsed.text, '前缀fmt 用于格式化输出。');
});

test('think-text streams redacted_thinking tags across deltas', () => {
  const state = createThinkSplitState();
  const first = splitThinkDelta('<think>步', state);
  const second = splitThinkDelta('骤一</think>答案', state);
  const tail = flushThinkSplit(state);

  assert.equal(first.thinking, '步');
  assert.equal(first.text, '');
  assert.equal(second.thinking, '骤一');
  assert.equal(second.text, '答案');
  assert.equal(tail.thinking, '');
  assert.equal(tail.text, '');
});
