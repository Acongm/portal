#!/usr/bin/env node
/*
 * Apply a prepared MDX draft for any daily task (date- or lesson-based).
 * Usage:
 *   DAILY_TASK=daily-news DAILY_DATE=2026-08-20 DAILY_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx \
 *     node task/_shared/scripts/apply-daily-content.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  getLessonFromSyllabus,
  loadSyllabus,
  loadTaskConfig,
  nextLessonNumber,
  resolveDate,
  resolveSlug,
} from '../lib/task-config.mjs';

const taskId = process.env.DAILY_TASK || process.argv[2];
const dryRun = process.env.DAILY_APPLY_DRY_RUN === '1';
const force = process.env.DAILY_FORCE === '1';

if (!taskId) {
  throw new Error('DAILY_TASK or argv[2] is required');
}

const { taskDir, config, repoRoot } = await loadTaskConfig(taskId);
const date = resolveDate(process.env.DAILY_DATE);
const inputFile = process.env.DAILY_INPUT_FILE || process.argv[3];
const contentDir = path.join(repoRoot, config.contentDir);
const metaFile = path.join(contentDir, 'meta.json');

if (!inputFile) {
  throw new Error('DAILY_INPUT_FILE or argv[3] is required');
}

const draft = await fs.readFile(path.resolve(repoRoot, inputFile), 'utf8');
const inputBase = path.basename(inputFile, '.mdx');

let lessonNumber;
if (config.filename === 'lesson') {
  const prefix = config.lessonPrefix ?? 'lesson-';
  if (inputBase.startsWith(prefix)) {
    lessonNumber = Number.parseInt(inputBase.slice(prefix.length), 10);
  }
  if (!Number.isFinite(lessonNumber)) {
    lessonNumber = Number(process.env.DAILY_LESSON) || (await nextLessonNumber(contentDir, prefix));
  }
}

const slug = await resolveSlug({ config, contentDir, date, lessonNumber });
const targetFile = path.join(contentDir, `${slug}.mdx`);

function assertIncludes(label, needle) {
  if (!draft.includes(needle)) throw new Error(`Draft missing ${label}: ${needle}`);
}

assertIncludes('frontmatter title', 'title:');
if (config.validation?.requireDate !== false) {
  assertIncludes('frontmatter date', `date: ${date}`);
}

for (const heading of config.validation?.requiredHeadings ?? []) {
  assertIncludes('heading', heading);
}

const sourceCount = (draft.match(/\[来源\]\(https?:\/\//g) || []).length;
const minSourceLinks = config.validation?.minSourceLinks ?? 0;
if (sourceCount < minSourceLinks) {
  throw new Error(`Draft should contain at least ${minSourceLinks} [来源](http...) links, got ${sourceCount}`);
}

const codeBlockCount = (draft.match(/```[\s\S]*?```/g) || []).length;
const minCodeBlocks = config.validation?.minCodeBlocks ?? 0;
if (codeBlockCount < minCodeBlocks) {
  throw new Error(`Draft should contain at least ${minCodeBlocks} code blocks, got ${codeBlockCount}`);
}

const titleMatch = draft.match(/^title:\s*(.+)$/m);
const title = titleMatch?.[1]?.trim().replace(/^["']|["']$/g, '') ?? '';
if (!title) throw new Error('Draft title is empty');

const genericTitles = new Set([
  '每日科技动态',
  '今日科技资讯',
  '今日科技动态',
  '每日资讯',
  '科技资讯',
]);
const forbiddenPatterns = config.validation?.forbiddenTitlePatterns ?? [
  /^每日科技动态\s*[-–—]/,
  /^每日(科技)?动态$/,
  /^今日(科技)?资讯$/,
];

if (genericTitles.has(title)) {
  throw new Error(`Title must be a concise content headline, not generic "${title}"`);
}
for (const pattern of forbiddenPatterns) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  if (re.test(title)) {
    throw new Error(`Title matches forbidden pattern: ${re}`);
  }
}
const minTitleLength = config.validation?.minTitleLength ?? 10;
if (title.length < minTitleLength) {
  throw new Error(`Title too short (${title.length} chars); use a concise content headline (>= ${minTitleLength})`);
}

if (!force && !dryRun) {
  try {
    await fs.access(targetFile);
    throw new Error(`Target already exists: ${path.relative(repoRoot, targetFile)} (set DAILY_FORCE=1 to overwrite)`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'));
const pages = Array.isArray(meta.pages) ? meta.pages.filter((page) => page !== slug) : ['index'];
if (!pages.includes('index')) pages.unshift('index');

if (config.filename === 'lesson') {
  pages.splice(pages.indexOf('index') + 1, 0, slug);
  pages.sort((a, b) => {
    if (a === 'index') return -1;
    if (b === 'index') return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
} else {
  pages.splice(pages.indexOf('index') + 1, 0, slug);
}

meta.pages = pages;

if (!dryRun) {
  await fs.writeFile(targetFile, draft.endsWith('\n') ? draft : `${draft}\n`);
  await fs.writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`);

  if (process.env.DAILY_RUN_SUMMARIES === '1') {
    const result = spawnSync('pnpm', ['build:ai:v1'], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error('pnpm build:ai:v1 failed after applying daily content');
    }
  }
}

const syllabus = await loadSyllabus(taskDir, config);
const lesson = config.filename === 'lesson' ? getLessonFromSyllabus(syllabus, lessonNumber) : null;

console.log(JSON.stringify({
  dryRun,
  taskId,
  date,
  slug,
  lessonNumber,
  lessonTopic: lesson?.topic ?? null,
  title,
  targetFile: path.relative(repoRoot, targetFile),
  metaFile: path.relative(repoRoot, metaFile),
  sourceCount,
  codeBlockCount,
}, null, 2));
