/**
 * 为模块 index.mdx 写入 description 并移除与 title 重复的 H1
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registry = JSON.parse(
  readFileSync(join(ROOT, 'apps/web/config/doc-modules.json'), 'utf8'),
);

const modules = registry.categories.flatMap((c) => c.modules);
const nested = registry.nestedModules ?? [];
const all = [...modules, ...nested];

for (const mod of all) {
  const folderPath = join(DOCS, mod.folder);
  const indexPath = join(folderPath, 'index.mdx');
  if (!existsSync(indexPath)) continue;

  let content = readFileSync(indexPath, 'utf8');
  const desc = mod.description ?? `${mod.title} 相关文档`;

  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    const fm = content.slice(0, end + 3);
    let body = content.slice(end + 3).trimStart();

    let newFm = fm;
    if (/^description:/m.test(fm) && mod.description) {
      newFm = fm.replace(/^description:.*$/m, `description: "${mod.description}"`);
    } else if (mod.description && !/^description:/m.test(fm)) {
      newFm = fm.replace(/---\s*$/, `description: "${mod.description}"\n---`);
    }

  // Remove first markdown H1 line
    body = body.replace(/^#\s+.+\n+/, '');

    if (!body.startsWith('本模块')) {
      body = `本模块收录 **${mod.title}** 相关笔记与实战记录，请从左侧目录选择具体章节。\n\n${body}`;
    }

    writeFileSync(indexPath, `${newFm}\n\n${body}`, 'utf8');
    console.log(`updated index: ${mod.folder}`);
  }
}
