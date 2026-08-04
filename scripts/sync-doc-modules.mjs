/**
 * 根据 config/doc-modules.json 同步根 meta.json 与各模块 meta.json 的 title / root。
 *
 * 用法: node scripts/sync-doc-modules.mjs
 *
 * 新增品类/模块：编辑 config/doc-modules.json 后运行本脚本。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registryPath = join(ROOT, 'apps/web/config/doc-modules.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

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

    const metaPath = join(folderPath, 'meta.json');
    if (existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      meta.title = mod.title;
      meta.root = true;
      writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    } else {
      console.warn(`no meta.json in ${mod.folder}, create pages manually`);
    }
  }
}

const rootMeta = {
  title: 'acongm',
  pages: rootPages,
};
writeFileSync(join(DOCS, 'meta.json'), JSON.stringify(rootMeta, null, 2) + '\n', 'utf8');
console.log(`Synced root meta (${rootPages.length} entries) from ${registryPath}`);
