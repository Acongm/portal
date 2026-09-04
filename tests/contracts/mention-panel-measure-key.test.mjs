import assert from 'node:assert/strict';
import test from 'node:test';
import { mentionPanelMeasureKey } from '../../packages/chat-ui/src/knowledge/mention-panel-measure-key.ts';

test('same hit count with different titles or query produces a new measure key', () => {
  const short = [{ title: '工具', subtitle: 'module' }];
  const wrapped = [
    { title: '一篇特别长的知识标题用来撑高菜单', subtitle: 'module · 工程实践' },
  ];
  assert.notEqual(
    mentionPanelMeasureKey('a', short),
    mentionPanelMeasureKey('a', wrapped),
  );
  assert.notEqual(
    mentionPanelMeasureKey('go', short),
    mentionPanelMeasureKey('golang', short),
  );
});
