#!/usr/bin/env node
/*
 * Parallel RSS collector with optional recency filter.
 * Usage: node task/_shared/scripts/collect-rss-hints.mjs <sources.json> <out.md>
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const sourcesPath = process.argv[2];
const outPath = process.argv[3];
const maxPerSource = Number(process.env.DAILY_SOURCE_MAX_ITEMS || 3);
const timeoutMs = Number(process.env.DAILY_FETCH_TIMEOUT_MS || 12000);
const maxAgeHours = Number(process.env.DAILY_SOURCE_MAX_AGE_HOURS || 72);

function stripXml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return stripXml(match?.[1] || '');
}

function parseRss(xml) {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return blocks.map((block) => ({
    title: tag(block, 'title'),
    link: tag(block, 'link') || tag(block, 'guid'),
    date: tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'published'),
    summary: tag(block, 'description').slice(0, 260),
  })).filter((item) => item.title || item.link);
}

function parseRssDate(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecent(entry) {
  const parsed = parseRssDate(entry.date);
  if (!parsed) return true;
  const ageMs = Date.now() - parsed;
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 portal-daily-source-hints' },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

async function collectSource(source) {
  const lines = [];
  lines.push(`### ${source.name}`);
  lines.push(`- URL: ${source.url}`);
  lines.push(`- Kind: ${source.kind}`);
  if (source.notes) lines.push(`- Notes: ${source.notes}`);

  if (source.kind !== 'rss') {
    lines.push('- Discovery: use web_search/browser per task skill.');
    lines.push('');
    return lines;
  }

  try {
    const got = await fetchWithTimeout(source.url);
    if (!got.ok) {
      lines.push(`- Fetch: HTTP ${got.status}; use web_search/browser fallback.`);
      lines.push('');
      return lines;
    }

    const recent = parseRss(got.text).filter(isRecent).slice(0, maxPerSource);
    if (!recent.length) {
      lines.push(`- Recent RSS items: none within ${maxAgeHours}h; use web_search/browser fallback.`);
    } else {
      lines.push('- Recent RSS items:');
      for (const entry of recent) {
        lines.push(`  - ${entry.title}${entry.date ? ` (${entry.date})` : ''}`);
        if (entry.link) lines.push(`    ${entry.link}`);
        if (entry.summary) lines.push(`    ${entry.summary}`);
      }
    }
  } catch (error) {
    lines.push(`- Fetch error: ${error.name || 'Error'}: ${error.message}; use web_search/browser fallback.`);
  }

  lines.push('');
  return lines;
}

if (!sourcesPath || !outPath) {
  console.error('Usage: collect-rss-hints.mjs <sources.json> <out.md>');
  process.exit(2);
}

const sources = JSON.parse(await fs.readFile(sourcesPath, 'utf8'));
const lines = [
  '# Source hints',
  `Generated at: ${new Date().toISOString()}`,
  `Recency window: ${maxAgeHours}h`,
  '',
];

for (const [category, items] of Object.entries(sources)) {
  lines.push(`## ${category}`);
  const chunks = await Promise.all(items.map((source) => collectSource(source)));
  for (const chunk of chunks) lines.push(...chunk);
}

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${lines.join('\n')}\n`);
console.log(outPath);
