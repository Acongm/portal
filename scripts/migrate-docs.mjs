/**
 * 批量迁移 vuepress/docs → portal/content/docs
 * - 复制 Markdown（跳过 .vuepress）
 * - README.md → index.mdx，补充 frontmatter
 * - sidebar → meta.json
 *
 * 用法:
 *   node scripts/migrate-docs.mjs [vuepress-docs-path]
 *   pnpm migrate:docs
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { transformMarkdown } from './mdx-sanitize.mjs';

const ROOT = process.cwd();
const VUEPRESS_DOCS = process.argv[2] || process.env.VUEPRESS_DOCS || '/tmp/vuepress-src/docs';
const PORTAL_DOCS = join(ROOT, 'content/docs');
const SIDEBAR_PATH = join(ROOT, 'scripts/vuepress-sidebar.json');

if (!existsSync(SIDEBAR_PATH)) {
  console.error('Missing scripts/vuepress-sidebar.json — run: node scripts/extract-sidebar.mjs');
  process.exit(1);
}

const sidebar = JSON.parse(readFileSync(SIDEBAR_PATH, 'utf8'));

/** vuepress 路径 → fumadocs page id */
function vuepressPathToPageId(vuePath) {
  if (typeof vuePath !== 'string') return null;

  let p = vuePath.trim();
  if (!p.startsWith('/')) p = `/${p}`;

  // 外链跳过
  if (p.startsWith('http')) return null;

  p = p.replace(/^\//, '').replace(/\.md$/, '');

  if (p.endsWith('/README')) {
    p = p.slice(0, -'/README'.length);
  }

  if (p.endsWith('/')) {
    p = p.slice(0, -1);
  }

  if (!p) return 'index';

  const parts = p.split('/');
  const last = parts[parts.length - 1];

  // 纯目录路径视为 index
  if (!vuePath.includes('.md') && vuePath.endsWith('/')) {
    if (parts.length === 1) return 'index';
    return parts.slice(1).join('/') || 'index';
  }

  if (parts.length === 1) return last;
  return parts.slice(1).join('/');
}

function copyAndTransformMd(srcPath, destPath, titleFallback) {
  const content = readFileSync(srcPath, 'utf8');
  const transformed = transformMarkdown(content, titleFallback);
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, transformed, 'utf8');
}

function walkCopyDocs(srcDir, destDir) {
  if (!existsSync(srcDir)) return;

  const relFromRoot = relative(VUEPRESS_DOCS, srcDir);

  for (const entry of readdirSync(srcDir)) {
    if (entry === '.vuepress') continue;

    const src = join(srcDir, entry);
    const dest = join(destDir, entry);

    if (statSync(src).isDirectory()) {
      walkCopyDocs(src, dest);
      continue;
    }

    if (!entry.endsWith('.md')) {
      cpSync(src, dest);
      continue;
    }

    // 跳过 VuePress 首页 README，使用 Fumadocs 专用 index
    if (entry === 'README.md' && relFromRoot === '') continue;

    const baseName = entry === 'README.md' ? 'index.mdx' : entry.replace(/\.md$/, '.mdx');
    const titleFallback = entry === 'README.md'
      ? relative(VUEPRESS_DOCS, dirname(src)).split('/').pop() || 'index'
      : entry.replace(/\.md$/, '');

    copyAndTransformMd(src, join(destDir, baseName), titleFallback);
  }
}

function sidebarChildrenToPages(children, folderPrefix) {
  const pages = [];

  for (const item of children) {
    if (typeof item === 'string') {
      const pageId = vuepressPathToPageId(item);
      if (!pageId) continue;

      if (pageId === 'index') {
        pages.push('index');
      } else if (pageId.includes('/')) {
        pages.push(pageId);
      } else {
        pages.push(pageId);
      }
      continue;
    }

    if (item && typeof item === 'object') {
      if (item.link) {
        const pageId = vuepressPathToPageId(item.link);
        if (pageId) pages.push(pageId);
        continue;
      }

      if (Array.isArray(item.children)) {
        if (item.text) {
          pages.push(`---${item.text}---`);
        }
        pages.push(...sidebarChildrenToPages(item.children, folderPrefix));
      }
    }
  }

  return pages;
}

function writeMetaJson(folderPath, title, pages) {
  const uniquePages = [...new Set(pages.filter(Boolean))];
  if (uniquePages.length === 0) return;

  const meta = { title, pages: uniquePages };
  const metaPath = join(folderPath, 'meta.json');
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
}

function generateMetaFromSidebar() {
  for (const [key, groups] of Object.entries(sidebar)) {
    const folderName = key.replace(/^\//, '').replace(/\/$/, '');
    const folderPath = join(PORTAL_DOCS, folderName);

    if (!existsSync(folderPath)) continue;

    const allPages = [];
    let title = folderName;

    for (const group of groups) {
      if (group.text) title = group.text;
      if (Array.isArray(group.children)) {
        allPages.push(...sidebarChildrenToPages(group.children, folderName));
      }
    }

    writeMetaJson(folderPath, title, allPages);
  }
}

function generateRootMeta() {
  const rootGroups = [
    { title: '基础语言', folders: ['JavaScript', 'TypeScript', 'css'] },
    { title: '框架生态', folders: ['react', 'vue', 'Pattern'] },
    { title: '工程化', folders: ['webpack', 'node', 'git', 'performance'] },
    { title: '进阶专题', folders: ['mark', 'ai', 'daily-news', 'issue'] },
    { title: '工具箱', folders: ['utils', 'online-tools', 'software'] },
    { title: '面试', folders: ['interview-prep', 'theory', 'interview', 'job-description'] },
  ];

  const pages = ['index'];

  for (const group of rootGroups) {
    pages.push(`---${group.title}---`);
    for (const folder of group.folders) {
      if (existsSync(join(PORTAL_DOCS, folder))) {
        pages.push(folder);
      }
    }
  }

  writeMetaJson(PORTAL_DOCS, 'acongm', pages);
}

function ensureIndexPage() {
  const indexPath = join(PORTAL_DOCS, 'index.mdx');
  if (existsSync(indexPath)) return;

  writeFileSync(
    indexPath,
    `---\ntitle: "acongm 文档"\ndescription: "前端常用知识、踩坑记录、软件推荐等"\n---\n\n# acongm 文档\n\n欢迎查阅 Platform v2 文档站。\n`,
    'utf8',
  );
}

function main() {
  console.log(`Source: ${VUEPRESS_DOCS}`);
  console.log(`Target: ${PORTAL_DOCS}`);

  if (!existsSync(VUEPRESS_DOCS)) {
    console.error(`VuePress docs not found: ${VUEPRESS_DOCS}`);
    process.exit(1);
  }

  mkdirSync(PORTAL_DOCS, { recursive: true });
  copyStaticAssets();
  walkCopyDocs(VUEPRESS_DOCS, PORTAL_DOCS);
  ensureIndexPage();
  generateMetaFromSidebar();
  generateRootMeta();

  const fileCount = countMdxFiles(PORTAL_DOCS);
  console.log(`Migration complete: ${fileCount} MDX files in content/docs`);
}

function copyStaticAssets() {
  const publicDir = join(ROOT, 'apps/web/public');
  const vuepressPublic = join(VUEPRESS_DOCS, '.vuepress/public');
  const vuepressAliasImages = join(VUEPRESS_DOCS, '.vuepress/alias/images');

  mkdirSync(join(publicDir, 'images'), { recursive: true });

  if (existsSync(vuepressPublic)) {
    cpSync(vuepressPublic, publicDir, { recursive: true });
  }

  if (existsSync(vuepressAliasImages)) {
    cpSync(vuepressAliasImages, join(publicDir, 'images'), { recursive: true });
  }
}

function countMdxFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      count += countMdxFiles(p);
    } else if (entry.endsWith('.mdx')) {
      count++;
    }
  }
  return count;
}

main();
