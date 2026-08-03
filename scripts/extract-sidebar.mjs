/**
 * 从 vuepress/docs/.vuepress/config.ts 提取 sidebar，生成 scripts/vuepress-sidebar.json
 * 用法: node scripts/extract-sidebar.mjs [vuepress-docs-path]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const docsRoot = process.argv[2] || '/tmp/vuepress-src/docs';
const configPath = join(docsRoot, '.vuepress/config.ts');
const configText = readFileSync(configPath, 'utf8');

const sidebarStart = configText.indexOf('sidebar: {');
if (sidebarStart === -1) {
  throw new Error('sidebar block not found in config.ts');
}

let depth = 0;
let start = configText.indexOf('{', sidebarStart);
let end = start;

for (let i = start; i < configText.length; i++) {
  const ch = configText[i];
  if (ch === '{') depth++;
  if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

const sidebarRaw = configText.slice(start, end);

// 将 JS 对象字面量转为 JSON（处理单引号、无引号键、尾部逗号）
const jsonLike = sidebarRaw
  .replace(/\/\/[^\n]*/g, '')
  .replace(/,\s*([\]}])/g, '$1')
  .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
  .replace(/'/g, '"');

let sidebar;
try {
  sidebar = JSON.parse(jsonLike);
} catch (err) {
  console.error('Failed to parse sidebar JSON:', err.message);
  process.exit(1);
}

const outPath = join(process.cwd(), 'scripts/vuepress-sidebar.json');
writeFileSync(outPath, JSON.stringify(sidebar, null, 2), 'utf8');
console.log(`Written ${outPath} (${Object.keys(sidebar).length} sidebar roots)`);
