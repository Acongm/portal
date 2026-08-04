/**
 * 将现有顶层模块迁入 content/docs/<domain>/（按 doc-modules.json）
 * 用法: node scripts/migrate-to-domains.mjs
 */
import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registry = JSON.parse(
  readFileSync(join(ROOT, 'apps/web/config/doc-modules.json'), 'utf8'),
);

for (const domain of registry.domains) {
  const domainDir = join(DOCS, domain.id);
  mkdirSync(domainDir, { recursive: true });

  const modules = [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ];

  for (const mod of modules) {
    const from = join(DOCS, mod.folder);
    const to = join(domainDir, mod.folder);
    if (!existsSync(from)) {
      if (existsSync(to)) {
        console.log(`already moved: ${domain.id}/${mod.folder}`);
        continue;
      }
      console.warn(`missing: ${mod.folder}`);
      continue;
    }
    if (existsSync(to)) {
      console.warn(`target exists, skip: ${domain.id}/${mod.folder}`);
      continue;
    }
    renameSync(from, to);
    console.log(`moved ${mod.folder} -> ${domain.id}/${mod.folder}`);
  }

  // domain index
  const indexPath = join(domainDir, 'index.mdx');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      `---\ntitle: "${domain.title}"\ndescription: "${domain.description ?? ''}"\n---\n\n本领域收录 **${domain.title}** 相关文档，请从左侧目录选择模块。\n`,
      'utf8',
    );
  }
}

console.log('Done. Run: node scripts/sync-doc-modules.mjs');
