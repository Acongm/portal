import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const DOMAIN_IDS = [
  'core',
  'engineering',
  'tools',
  'career',
  'news',
  'yoga',
  'education',
];

function toLegacyDocPath(pathname) {
  let path = String(pathname || '/').split(/[?#]/)[0];
  if (!path.startsWith('/')) path = `/${path}`;
  const domainMatch = path.match(/^\/docs\/([^/]+)(\/.*)?$/);
  if (domainMatch && DOMAIN_IDS.includes(domainMatch[1])) {
    path = domainMatch[2] || '/';
  } else if (path.startsWith('/docs/')) {
    path = path.slice('/docs'.length) || '/';
  }
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.endsWith('.html')) path = path.replace(/\.html$/, '.md');
  if (path.endsWith('/')) {
    path = `${path}README.md`;
  } else if (!/\.(md|mdx)$/i.test(path)) {
    const segments = path.replace(/^\//, '').split('/').filter(Boolean);
    if (segments.length === 1) {
      path = `/${segments[0]}/README.md`;
    } else {
      path = `${path}.md`;
    }
  }
  if (path.endsWith('.mdx')) path = path.replace(/\.mdx$/, '.md');
  return path;
}

assert.equal(toLegacyDocPath('/docs/core/react/react16'), '/react/react16.md');
assert.equal(toLegacyDocPath('/docs/core/ai'), '/ai/README.md');
assert.equal(
  toLegacyDocPath('/docs/news/daily-news/2026-06-14'),
  '/daily-news/2026-06-14.md',
);

const require = createRequire(import.meta.url);
const summaries = require('../apps/web/public/summaries-v1.json');
const key = toLegacyDocPath('/docs/core/react/react16');
assert.ok(summaries.files[key], `expected summary for ${key}`);
assert.equal(summaries.files[key].status, 'success');

console.log('ai path/summary smoke tests passed');
