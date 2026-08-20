#!/usr/bin/env node
/*
 * Collect lightweight source hints for the daily news prompt.
 * No dependencies; uses Node 22 global fetch and simple RSS/Atom extraction.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeed } from '../lib/feed.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const taskDir = path.join(repoRoot, 'task/daily-news');
const sourcesPath = path.join(taskDir, 'sources.json');
const outPath = process.argv[2] || path.join(taskDir, 'tmp/source-hints.md');
const maxPerSource = Number(process.env.NEWS_SOURCE_MAX_ITEMS || 3);
const timeoutMs = Number(process.env.NEWS_FETCH_TIMEOUT_MS || 12000);

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 daily-news-source-hints',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

function formatEntries(entries) {
  if (!entries.length) {
    return ['- Recent feed items: none parsed; use web_search/browser fallback.'];
  }
  const lines = ['- Recent feed items:'];
  for (const entry of entries) {
    lines.push(`  - ${entry.title}${entry.date ? ` (${entry.date})` : ''}`);
    if (entry.link) lines.push(`    ${entry.link}`);
    if (entry.summary) lines.push(`    ${entry.summary}`);
  }
  return lines;
}

async function hintLinesForSource(source) {
  const lines = [
    `### ${source.name}`,
    `- URL: ${source.url}`,
    `- Kind: ${source.kind}`,
  ];
  if (source.notes) lines.push(`- Notes: ${source.notes}`);

  if (source.kind !== 'rss') {
    lines.push('- Discovery: use web_search/browser according to the daily-tech-news-vuepress skill.');
    return lines;
  }

  try {
    const got = await fetchWithTimeout(source.url);
    if (!got.ok) {
      lines.push(`- Fetch: HTTP ${got.status}; use web_search/browser fallback.`);
      return lines;
    }
    lines.push(...formatEntries(parseFeed(got.text, maxPerSource)));
    return lines;
  } catch (error) {
    lines.push(`- Fetch error: ${error.name || 'Error'}: ${error.message}; use web_search/browser fallback.`);
    return lines;
  }
}

const sources = JSON.parse(await fs.readFile(sourcesPath, 'utf8'));
const jobs = Object.entries(sources).flatMap(([category, items]) =>
  items.map((source) => ({ category, source })),
);
const hinted = await Promise.all(
  jobs.map(async (job) => ({
    category: job.category,
    lines: await hintLinesForSource(job.source),
  })),
);

const lines = [
  '# Daily news source hints',
  `Generated at: ${new Date().toISOString()}`,
  '',
];
let currentCategory = '';
for (const item of hinted) {
  if (item.category !== currentCategory) {
    currentCategory = item.category;
    lines.push(`## ${currentCategory}`);
  }
  lines.push(...item.lines, '');
}

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${lines.join('\n')}\n`);
console.log(outPath);
