/**
 * 根据 apps/web/config/doc-modules.json 同步导航与 meta.json
 * 用法: node scripts/sync-doc-modules.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registryPath = join(ROOT, 'apps/web/config/doc-modules.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

const nested = registry.nestedModules ?? [];
const nestedFolders = new Set(nested.map((m) => m.folder));
const rootModuleFolders = new Set();

const rootPages = ['index'];

for (const category of registry.categories) {
  rootPages.push(`---${category.title}---`);
  for (const mod of category.modules) {
    const folderPath = join(DOCS, mod.folder);
    if (!existsSync(folderPath)) {
      console.warn(`skip missing folder: ${mod.folder}`);
      continue;
    }
    rootPages.push(mod.folder);
    rootModuleFolders.add(mod.folder);

    const metaPath = join(folderPath, 'meta.json');
    if (existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      meta.title = mod.title;
      meta.root = true;
      writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    }
  }
}

for (const mod of nested) {
  const folderPath = join(DOCS, mod.folder);
  if (!existsSync(folderPath)) {
    console.warn(`skip missing nested folder: ${mod.folder}`);
    continue;
  }
  const metaPath = join(folderPath, 'meta.json');
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    meta.title = mod.title;
    meta.root = false;
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  }

  const parentMetaPath = join(DOCS, mod.parent, 'meta.json');
  if (existsSync(parentMetaPath)) {
    const parentMeta = JSON.parse(readFileSync(parentMetaPath, 'utf8'));
    const extract = `...${mod.folder}`;
    if (!parentMeta.pages.includes(extract)) {
      parentMeta.pages.push(extract);
      writeFileSync(parentMetaPath, JSON.stringify(parentMeta, null, 2) + '\n', 'utf8');
      console.log(`nested ${mod.folder} under ${mod.parent}`);
    }
  }
}

writeFileSync(
  join(DOCS, 'meta.json'),
  JSON.stringify({ title: 'acongm', pages: rootPages }, null, 2) + '\n',
  'utf8',
);

console.log(
  `Synced ${rootModuleFolders.size} root modules + ${nested.length} nested folders`,
);
