#!/usr/bin/env node
/*
 * Collect lightweight source hints for the daily news prompt.
 * No dependencies; uses Node 22 global fetch and simple RSS extraction.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(new URL('../../..', import.meta.url).pathname);
const taskDir = path.join(repoRoot, 'task/news');
const sourcesPath = path.join(taskDir, 'sources.json');
const outPath = process.argv[2] || path.join(taskDir, 'tmp/source-hints.md');
const maxPerSource = Number(process.env.NEWS_SOURCE_MAX_ITEMS || 3);
const timeoutMs = Number(process.env.NEWS_FETCH_TIMEOUT_MS || 12000);

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
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return stripXml(m?.[1] || '');
}

function parseRss(xml) {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return blocks.slice(0, maxPerSource).map((block) => ({
    title: tag(block, 'title'),
    link: tag(block, 'link') || tag(block, 'guid'),
    date: tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'published'),
    summary: tag(block, 'description').slice(0, 260),
  })).filter((x) => x.title || x.link);
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 daily-news-source-hints' },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

const sources = JSON.parse(await fs.readFile(sourcesPath, 'utf8'));
const lines = [];
lines.push(`# Daily news source hints`);
lines.push(`Generated at: ${new Date().toISOString()}`);
lines.push('');

for (const [category, items] of Object.entries(sources)) {
  lines.push(`## ${category}`);
  for (const source of items) {
    lines.push(`### ${source.name}`);
    lines.push(`- URL: ${source.url}`);
    lines.push(`- Kind: ${source.kind}`);
    if (source.notes) lines.push(`- Notes: ${source.notes}`);

    if (source.kind === 'rss') {
      try {
        const got = await fetchWithTimeout(source.url);
        if (!got.ok) {
          lines.push(`- Fetch: HTTP ${got.status}; use web_search/browser fallback.`);
        } else {
          const entries = parseRss(got.text);
          if (!entries.length) {
            lines.push('- Recent RSS items: none parsed; use web_search/browser fallback.');
          } else {
            lines.push('- Recent RSS items:');
            for (const entry of entries) {
              lines.push(`  - ${entry.title}${entry.date ? ` (${entry.date})` : ''}`);
              if (entry.link) lines.push(`    ${entry.link}`);
              if (entry.summary) lines.push(`    ${entry.summary}`);
            }
          }
        }
      } catch (error) {
        lines.push(`- Fetch error: ${error.name || 'Error'}: ${error.message}; use web_search/browser fallback.`);
      }
    } else {
      lines.push('- Discovery: use web_search/browser according to the daily-tech-news-vuepress skill.');
    }
    lines.push('');
  }
}

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${lines.join('\n')}\n`);
console.log(outPath);
