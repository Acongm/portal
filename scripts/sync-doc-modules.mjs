/**
 * 根据 apps/web/config/doc-modules.json 同步领域 / 模块 meta.json
 * 用法: node scripts/sync-doc-modules.mjs
 *
 * - hidden 领域：不进入根 meta / Layout Tabs，但仍保留本地内容目录
 * - 缺失的模块 index.mdx 会自动创建（避免 /docs/<domain>/<module> 404）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DOCS = join(ROOT, 'content/docs');
const registryPath = join(ROOT, 'apps/web/config/doc-modules.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

const rootPages = ['index'];

function ensureModuleIndex(domainId, mod) {
  const folderPath = join(DOCS, domainId, mod.folder);
  if (!existsSync(folderPath)) return false;

  const indexPath = join(folderPath, 'index.mdx');
  if (!existsSync(indexPath)) {
    const description = mod.description ?? '';
    writeFileSync(
      indexPath,
      `---\ntitle: "${mod.title}"\ndescription: "${description}"\n---\n\n本模块收录 **${mod.title}** 相关笔记与实战记录，请从左侧目录选择具体章节。\n`,
      'utf8',
    );
    console.log(`created index: ${domainId}/${mod.folder}`);
  }

  const metaPath = join(folderPath, 'meta.json');
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    meta.title = mod.title;
    delete meta.root;
    if (Array.isArray(meta.pages) && !meta.pages.includes('index')) {
      meta.pages = ['index', ...meta.pages.filter((p) => p !== 'index')];
    }
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  } else {
    // 仅有散页、无 meta 时，按文件名生成 pages（含 index）
    const pages = ['index'];
    for (const name of readdirSync(folderPath)) {
      if (!name.endsWith('.mdx') || name === 'index.mdx' || name === 'INDEX.mdx') continue;
      pages.push(name.replace(/\.mdx$/, ''));
    }
    writeFileSync(
      metaPath,
      JSON.stringify({ title: mod.title, pages }, null, 2) + '\n',
      'utf8',
    );
    console.log(`created meta: ${domainId}/${mod.folder}`);
  }

  return true;
}

for (const domain of registry.domains) {
  const domainDir = join(DOCS, domain.id);
  mkdirSync(domainDir, { recursive: true });

  const domainPages = ['index'];
  const modules = domain.categories ?? [];
  const nested = domain.nestedModules ?? [];

  for (const category of modules) {
    domainPages.push(`---${category.title}---`);
    for (const mod of category.modules) {
      if (!ensureModuleIndex(domain.id, mod)) {
        console.warn(`skip missing: ${domain.id}/${mod.folder}`);
        continue;
      }
      domainPages.push(mod.folder);
    }
  }

  for (const mod of nested) {
    const folderPath = join(domainDir, mod.folder);
    if (!existsSync(folderPath)) {
      console.warn(`skip missing nested: ${domain.id}/${mod.folder}`);
      continue;
    }
    ensureModuleIndex(domain.id, mod);

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

  const isHidden = Boolean(domain.hidden);

  writeFileSync(
    join(domainDir, 'meta.json'),
    JSON.stringify(
      {
        title: domain.title,
        description: domain.description,
        // hidden 领域不作为 Layout Tab root，避免侧栏露出入口
        ...(isHidden ? {} : { root: true }),
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

  if (!isHidden) {
    rootPages.push(domain.id);
  } else {
    console.log(`hidden domain (kept on disk): ${domain.id}`);
  }
}

writeFileSync(
  join(DOCS, 'meta.json'),
  JSON.stringify({ title: 'acongm', pages: rootPages }, null, 2) + '\n',
  'utf8',
);

console.log(`Synced domains → ${rootPages.join(', ')}`);
