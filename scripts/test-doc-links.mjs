import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const registry = require('../apps/web/config/doc-modules.json');

const folderDomain = new Map();
for (const domain of registry.domains) {
  for (const mod of [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ]) {
    folderDomain.set(mod.folder, domain.id);
  }
}

function relativeHrefVariants(path) {
  const variants = new Set([path]);
  if (path.endsWith('.md')) {
    variants.add(`${path.slice(0, -3)}.mdx`);
    if (/(^|\/)README\.md$/i.test(path)) {
      variants.add(path.replace(/README\.md$/i, 'index.mdx'));
    }
  }
  return [...variants];
}

function remapLegacyAbsolutePath(pathname) {
  const [path, hash] = pathname.split('#');
  if (!path.startsWith('/') || path.startsWith('/docs/')) return null;
  const cleaned = path.replace(/\/+$/, '').replace(/\.(md|mdx|html)$/i, '');
  const segments = cleaned.split('/').filter(Boolean);
  const domain = folderDomain.get(segments[0]);
  if (!domain) return null;
  const rest = segments.slice(1);
  const url =
    rest.length === 0
      ? `/docs/${domain}/${segments[0]}`
      : `/docs/${domain}/${segments[0]}/${rest.join('/')}`;
  return hash ? `${url}#${hash}` : url;
}

assert.ok(relativeHrefVariants('./class-hooks.md').includes('./class-hooks.mdx'));
assert.ok(
  relativeHrefVariants('./ServiceRequest/README.md').includes(
    './ServiceRequest/index.mdx',
  ),
);
assert.equal(
  remapLegacyAbsolutePath('/git/command.md'),
  '/docs/engineering/git/command',
);
assert.equal(remapLegacyAbsolutePath('/react'), '/docs/core/react');
assert.equal(
  remapLegacyAbsolutePath('/interview-prep/tech__react.md#x'),
  '/docs/career/interview-prep/tech__react#x',
);

console.log('doc-links unit checks passed');
