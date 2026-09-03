import assert from 'node:assert/strict';
import test from 'node:test';
import { placeFixedMenu } from '../../packages/auth-client/src/placeFixedMenu.ts';

const viewport = { width: 1280, height: 720 };
const panel = { width: 220, height: 200 };

test('sidebar-footer trigger near the bottom opens the panel above', () => {
  const placed = placeFixedMenu({
    trigger: { top: 660, left: 40, width: 32, height: 32 },
    panel,
    viewport,
    align: 'end',
    prefer: 'auto',
  });

  assert.equal(placed.placement, 'above');
  assert.ok(placed.top + panel.height <= 660);
  assert.ok(placed.top >= 8);
  assert.ok(placed.left + panel.width <= viewport.width - 8);
  assert.ok(placed.left >= 8);
});

test('header trigger near the top opens the panel below', () => {
  const placed = placeFixedMenu({
    trigger: { top: 12, left: 1200, width: 32, height: 32 },
    panel,
    viewport,
    align: 'end',
    prefer: 'auto',
  });

  assert.equal(placed.placement, 'below');
  assert.ok(placed.top >= 12 + 32);
  assert.ok(placed.top + panel.height <= viewport.height - 8);
  assert.ok(placed.left + panel.width <= viewport.width - 8);
});

test('right-edge trigger keeps the panel inside the viewport', () => {
  const placed = placeFixedMenu({
    trigger: { top: 40, left: 1260, width: 16, height: 16 },
    panel,
    viewport,
    align: 'end',
    prefer: 'below',
  });

  assert.equal(placed.placement, 'below');
  assert.ok(placed.left >= 8);
  assert.ok(placed.left + panel.width <= viewport.width - 8);
});

test('mention picker prefers above the composer and flips when there is no room', () => {
  const above = placeFixedMenu({
    trigger: { top: 520, left: 860, width: 400, height: 56 },
    panel: { width: 360, height: 240 },
    viewport,
    align: 'start',
    prefer: 'above',
  });
  assert.equal(above.placement, 'above');
  assert.ok(above.top + 240 <= 520);

  const flipped = placeFixedMenu({
    trigger: { top: 16, left: 860, width: 400, height: 56 },
    panel: { width: 360, height: 240 },
    viewport,
    align: 'start',
    prefer: 'above',
  });
  assert.equal(flipped.placement, 'below');
  assert.ok(flipped.top >= 16 + 56);
});
