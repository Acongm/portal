import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('browser quality gate smoke spec exists for #37', () => {
  const spec = join(process.cwd(), 'e2e/quality-gate-smoke.spec.ts');
  const config = join(process.cwd(), 'playwright.config.ts');
  const fixture = join(process.cwd(), 'e2e/fixtures/mock-quality-gate.ts');
  assert.equal(existsSync(spec), true, 'missing e2e/quality-gate-smoke.spec.ts');
  assert.equal(existsSync(config), true, 'missing playwright.config.ts');
  assert.equal(existsSync(fixture), true, 'missing e2e/fixtures/mock-quality-gate.ts');
  const body = readFileSync(spec, 'utf8');
  assert.match(body, /Platform v2 quality gate browser smoke/);
  assert.match(body, /installQualityGateMocks/);
  assert.match(body, /\/docs\/core/);
  assert.match(body, /AI 助手/);
  assert.match(body, /正在准备安全会话|有什么可以帮忙的/);
  assert.match(body, /restores the durable transcript/);
  assert.match(body, /重新生成/);
});
