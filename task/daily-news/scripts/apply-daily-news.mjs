#!/usr/bin/env node
/*
 * Apply a prepared MDX draft to the Portal daily-news location and update indexes.
 * Usage:
 *   NEWS_DATE=2026-08-20 NEWS_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx node task/daily-news/scripts/apply-daily-news.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(new URL('../../..', import.meta.url).pathname);
const newsDate = process.env.NEWS_DATE || new Date().toISOString().slice(0, 10);
const inputFile = process.env.NEWS_INPUT_FILE || process.argv[2];
const dryRun = process.env.NEWS_APPLY_DRY_RUN === '1';

if (!/^\d{4}-\d{2}-\d{2}$/.test(newsDate)) {
  throw new Error(`NEWS_DATE must be YYYY-MM-DD, got: ${newsDate}`);
}
if (!inputFile) {
  throw new Error('NEWS_INPUT_FILE or argv[2] is required');
}

const newsDir = path.join(repoRoot, 'content/docs/news/daily-news');
const targetFile = path.join(newsDir, `${newsDate}.mdx`);
const metaFile = path.join(newsDir, 'meta.json');
const navbarFile = path.join(repoRoot, 'apps/web/lib/navbar.ts');

const draft = await fs.readFile(path.resolve(repoRoot, inputFile), 'utf8');

function assertIncludes(label, needle) {
  if (!draft.includes(needle)) throw new Error(`Draft missing ${label}: ${needle}`);
}
assertIncludes('frontmatter title', 'title:');
assertIncludes('frontmatter date', `date: ${newsDate}`);
for (const heading of ['### 前端', '### DevOps', '### AI', '## 简讯']) assertIncludes('heading', heading);
const sourceCount = (draft.match(/\[来源\]\(https?:\/\//g) || []).length;
if (sourceCount < 3) throw new Error(`Draft should contain at least 3 [来源](http...) links, got ${sourceCount}`);

const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'));
const pages = Array.isArray(meta.pages) ? meta.pages.filter((p) => p !== newsDate) : ['index'];
const indexPos = pages.indexOf('index');
if (indexPos === -1) pages.unshift('index');
pages.splice(pages.indexOf('index') + 1, 0, newsDate);
meta.pages = pages;

let navbar = await fs.readFile(navbarFile, 'utf8');
const navRe = /docLink\('每日资讯',\s*'\/daily-news\/\d{4}-\d{2}-\d{2}\.md'\)/;
if (!navRe.test(navbar)) throw new Error('Cannot find 每日资讯 nav link in apps/web/lib/navbar.ts');
navbar = navbar.replace(navRe, `docLink('每日资讯', '/daily-news/${newsDate}.md')`);

if (!dryRun) {
  await fs.writeFile(targetFile, draft.endsWith('\n') ? draft : `${draft}\n`);
  await fs.writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  await fs.writeFile(navbarFile, navbar);

  if (process.env.NEWS_RUN_SUMMARIES === '1') {
    const result = spawnSync('pnpm', ['build:ai:v1'], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error('pnpm build:ai:v1 failed after applying daily news');
    }
  }
}

console.log(JSON.stringify({
  dryRun,
  date: newsDate,
  targetFile: path.relative(repoRoot, targetFile),
  metaFile: path.relative(repoRoot, metaFile),
  navbarFile: path.relative(repoRoot, navbarFile),
  sourceCount,
}, null, 2));
