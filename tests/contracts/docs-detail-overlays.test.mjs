import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('account menu portals a fixed panel instead of opening inside the sidebar', () => {
  const menu = read('packages/auth-client/src/AuthAccountMenu.tsx');
  const css = read('packages/ui-theme/src/auth.css');
  assert.match(menu, /createPortal/);
  assert.match(menu, /placeFixedMenu/);
  assert.match(menu, /document\.body/);
  assert.match(css, /\.acongm-auth-menu__panel\.is-fixed/);
});

test('knowledge picker portals above the composer with a z-index above the drawer', () => {
  const mention = read('packages/chat-ui/src/knowledge/KnowledgeMentionMenu.tsx');
  const css = read('packages/chat-ui/src/styles/chat-ui.css');
  assert.match(mention, /createPortal/);
  assert.match(mention, /placeFixedMenu/);
  assert.match(mention, /prefer:\s*'above'/);
  assert.match(css, /z-index:\s*calc\(var\(--acongm-chat-z,\s*1200\) \+ 80\)/);
});

test('knowledge picker remeasures when query or hit titles change, not only list length', () => {
  const mention = read('packages/chat-ui/src/knowledge/KnowledgeMentionMenu.tsx');
  assert.match(mention, /mentionPanelMeasureKey/);
  assert.match(mention, /ResizeObserver/);
  assert.doesNotMatch(
    mention,
    /\[open, updatePlacement, visible\.length\]/,
  );
});

test('portal article chat does not force model thinking on by default', () => {
  const embed = read('apps/web/components/doc-chat-embed.tsx');
  const adapter = read(
    'packages/chat-ui/src/runtime/createDocChatModelAdapter.ts',
  );
  assert.match(embed, /enableThinking:\s*false/);
  assert.doesNotMatch(embed, /enableThinking:\s*true/);
  assert.match(adapter, /enableThinking\s*=\s*false/);
});
