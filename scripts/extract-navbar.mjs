/**
 * 从 vuepress/docs/.vuepress/config.ts 提取 navbar，生成 scripts/vuepress-navbar.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const docsRoot = process.argv[2] || '/tmp/vuepress-src/docs';
const configPath = join(docsRoot, '.vuepress/config.ts');
const configText = readFileSync(configPath, 'utf8');

const navbarStart = configText.indexOf('navbar: [');
if (navbarStart === -1) {
  throw new Error('navbar block not found');
}

let depth = 0;
let start = configText.indexOf('[', navbarStart);
let end = start;

for (let i = start; i < configText.length; i++) {
  const ch = configText[i];
  if (ch === '[') depth++;
  if (ch === ']') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

const navbarRaw = configText.slice(start, end);
const jsonLike = navbarRaw
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/,\s*([\]}])/g, '$1')
  .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
  .replace(/'/g, '"');

const navbar = JSON.parse(jsonLike);
const outPath = join(process.cwd(), 'scripts/vuepress-navbar.json');
writeFileSync(outPath, JSON.stringify(navbar, null, 2), 'utf8');
console.log(`Written ${outPath} (${navbar.length} top-level groups)`);
