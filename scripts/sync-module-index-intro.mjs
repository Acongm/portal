/**
 * 为各模块 index.mdx 写入 description，并移除与 DocsTitle 重复的 H1
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registry = JSON.parse(
  readFileSync(join(ROOT, 'apps/web/config/doc-modules.json'), 'utf8'),
);

for (const domain of registry.domains) {
  const modules = [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ];

  for (const mod of modules) {
    const indexPath = join(DOCS, domain.id, mod.folder, 'index.mdx');
    if (!existsSync(indexPath)) continue;

    let content = readFileSync(indexPath, 'utf8');
    if (!content.startsWith('---')) continue;

    const end = content.indexOf('---', 3);
    const fm = content.slice(0, end + 3);
    let body = content.slice(end + 3).trimStart();

    let newFm = fm;
    if (mod.description) {
      if (/^description:/m.test(fm)) {
        newFm = fm.replace(/^description:.*$/m, `description: "${mod.description}"`);
      } else {
        newFm = fm.replace(/---\s*$/, `description: "${mod.description}"\n---`);
      }
    }

    body = body.replace(/^#\s+.+\n+/, '');
    if (!body.startsWith('本模块')) {
      body = `本模块收录 **${mod.title}** 相关笔记与实战记录，请从左侧目录选择具体章节。\n\n${body}`;
    }

    writeFileSync(indexPath, `${newFm}\n\n${body}`, 'utf8');
    console.log(`updated: ${domain.id}/${mod.folder}`);
  }
}
