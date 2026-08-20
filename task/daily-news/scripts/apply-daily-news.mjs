#!/usr/bin/env node
/*
 * Apply a prepared MDX draft to the Portal daily-news location and update indexes.
 * Usage:
 *   NEWS_DATE=2026-08-20 NEWS_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx node task/daily-news/scripts/apply-daily-news.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { insertNewsDate, updateNavbarLink, validateDraft } from '../lib/apply.mjs';
import { assertNewsDate, todayInTimeZone } from '../lib/date.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const newsDate = assertNewsDate(process.env.NEWS_DATE || todayInTimeZone());
const inputFile = process.env.NEWS_INPUT_FILE || process.argv[2];
const dryRun = process.env.NEWS_APPLY_DRY_RUN === '1';

if (!inputFile) {
  throw new Error('NEWS_INPUT_FILE or argv[2] is required');
}

const newsDir = path.join(repoRoot, 'content/docs/news/daily-news');
const targetFile = path.join(newsDir, `${newsDate}.mdx`);
const metaFile = path.join(newsDir, 'meta.json');
const navbarFile = path.join(repoRoot, 'apps/web/lib/navbar.ts');

const draft = await fs.readFile(path.resolve(repoRoot, inputFile), 'utf8');
const checked = validateDraft(draft, newsDate);
if (!checked.ok) {
  throw new Error(`Draft failed structure checks: ${checked.errors.join('; ')}`);
}

const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'));
meta.pages = insertNewsDate(meta.pages, newsDate);
const navbar = updateNavbarLink(await fs.readFile(navbarFile, 'utf8'), newsDate);

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
  sourceCount: checked.sourceCount,
}, null, 2));
