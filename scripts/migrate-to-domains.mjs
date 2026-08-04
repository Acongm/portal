/**
 * 按 doc-modules.json 将模块目录迁入对应领域。
 * 支持从 content/docs/<folder> 或 content/docs/<旧领域>/<folder> 查找源目录。
 *
 * 用法: node scripts/migrate-to-domains.mjs
 */
import {
  existsSync,
  mkdirSync,
  renameSync,
  readdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registry = JSON.parse(
  readFileSync(join(ROOT, 'apps/web/config/doc-modules.json'), 'utf8'),
);

const domainIds = new Set(registry.domains.map((d) => d.id));
const reserved = new Set(['index.mdx', 'meta.json', ...domainIds]);

function findModuleSource(folder, targetDomain) {
  const direct = join(DOCS, folder);
  if (existsSync(direct) && !domainIds.has(folder)) return direct;

  for (const entry of readdirSync(DOCS)) {
    if (!statSync(join(DOCS, entry)).isDirectory()) continue;
    if (!domainIds.has(entry) && entry !== 'frontend') continue;
    const candidate = join(DOCS, entry, folder);
    if (existsSync(candidate) && entry !== targetDomain) return candidate;
  }
  return null;
}

for (const domain of registry.domains) {
  const domainDir = join(DOCS, domain.id);
  mkdirSync(domainDir, { recursive: true });

  const modules = [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ];

  for (const mod of modules) {
    const to = join(domainDir, mod.folder);
    if (existsSync(to)) {
      console.log(`ok: ${domain.id}/${mod.folder}`);
      continue;
    }
    const from = findModuleSource(mod.folder, domain.id);
    if (!from) {
      console.warn(`missing: ${mod.folder}`);
      continue;
    }
    renameSync(from, to);
    console.log(`moved ${from.replace(DOCS + '/', '')} -> ${domain.id}/${mod.folder}`);
  }

  const indexPath = join(domainDir, 'index.mdx');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      `---\ntitle: "${domain.title}"\ndescription: "${domain.description ?? ''}"\n---\n\n本领域收录 **${domain.title}** 相关文档，请从左侧目录选择模块。\n`,
      'utf8',
    );
  }
}

// 清理已空的旧 frontend 目录
const legacyFrontend = join(DOCS, 'frontend');
if (existsSync(legacyFrontend)) {
  const left = readdirSync(legacyFrontend).filter((name) => !['meta.json', 'index.mdx'].includes(name));
  if (left.length === 0) {
    rmSync(legacyFrontend, { recursive: true, force: true });
    console.log('removed empty frontend/');
  } else {
    console.warn('frontend/ still has:', left.join(', '));
  }
}

console.log('Done. Run: node scripts/sync-doc-modules.mjs');
