/**
 * 根据 apps/web/config/doc-modules.json 同步领域 / 模块 meta.json
 * 用法: node scripts/sync-doc-modules.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registryPath = join(ROOT, 'apps/web/config/doc-modules.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

const rootPages = ['index'];

for (const domain of registry.domains) {
  rootPages.push(domain.id);
  const domainDir = join(DOCS, domain.id);
  mkdirSync(domainDir, { recursive: true });

  const domainPages = ['index'];
  const modules = domain.categories ?? [];
  const nested = domain.nestedModules ?? [];

  for (const category of modules) {
    domainPages.push(`---${category.title}---`);
    for (const mod of category.modules) {
      const folderPath = join(domainDir, mod.folder);
      if (!existsSync(folderPath)) {
        console.warn(`skip missing: ${domain.id}/${mod.folder}`);
        continue;
      }
      domainPages.push(mod.folder);

      const metaPath = join(folderPath, 'meta.json');
      if (existsSync(metaPath)) {
        const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
        meta.title = mod.title;
        // 模块不再作为 Layout Tab root，由领域层隔离
        delete meta.root;
        writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
      }
    }
  }

  for (const mod of nested) {
    const folderPath = join(domainDir, mod.folder);
    if (!existsSync(folderPath)) {
      console.warn(`skip missing nested: ${domain.id}/${mod.folder}`);
      continue;
    }
    const metaPath = join(folderPath, 'meta.json');
    if (existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      meta.title = mod.title;
      delete meta.root;
      writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    }

    const parentMetaPath = join(domainDir, mod.parent, 'meta.json');
    if (existsSync(parentMetaPath)) {
      const parentMeta = JSON.parse(readFileSync(parentMetaPath, 'utf8'));
      const extract = `...${mod.folder}`;
      if (!parentMeta.pages.includes(extract)) {
        parentMeta.pages.push(extract);
        writeFileSync(parentMetaPath, JSON.stringify(parentMeta, null, 2) + '\n', 'utf8');
        console.log(`nested ${domain.id}/${mod.folder} under ${mod.parent}`);
      }
    }
  }

  writeFileSync(
    join(domainDir, 'meta.json'),
    JSON.stringify(
      {
        title: domain.title,
        description: domain.description,
        root: true,
        pages: domainPages,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  const indexPath = join(domainDir, 'index.mdx');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      `---\ntitle: "${domain.title}"\ndescription: "${domain.description ?? ''}"\n---\n\n本领域收录 **${domain.title}** 相关文档，请从左侧目录选择模块。\n`,
      'utf8',
    );
  }
}

writeFileSync(
  join(DOCS, 'meta.json'),
  JSON.stringify({ title: 'acongm', pages: rootPages }, null, 2) + '\n',
  'utf8',
);

console.log(`Synced ${registry.domains.length} domains → ${rootPages.join(', ')}`);
