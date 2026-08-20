import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { insertNewsDate, updateNavbarLink, validateDraft } from '../../task/daily-news/lib/apply.mjs';
import { todayInTimeZone } from '../../task/daily-news/lib/date.mjs';
import { parseFeed } from '../../task/daily-news/lib/feed.mjs';
import {
  extractBoldTitles,
  extractSourceUrls,
  formatPreviousHints,
  pickPreviousDate,
} from '../../task/daily-news/lib/previous.mjs';

const validDraft = `---
title: 每日科技动态 - 2026年8月21日
date: 2026-08-21
tags:
  - 每日资讯
---

# 每日科技动态

观察。

## 今日概览

### 前端

**Firefox 补了一项布局能力。** 说明。[来源](https://example.com/fe)

### DevOps

**GitHub 更新了 changelog。** 说明。[来源](https://example.com/devops)

### AI

**OpenAI 发布了一则公告。** 说明。[来源](https://example.com/ai)

## 简讯

- **前端**：一句话
`;

test('parseFeed reads RSS items and Atom entries', () => {
  const rss = parseFeed(`
    <rss><channel>
      <item>
        <title><![CDATA[RSS Title]]></title>
        <link>https://example.com/rss</link>
        <pubDate>Thu, 20 Aug 2026 00:00:00 GMT</pubDate>
        <description>RSS summary</description>
      </item>
    </channel></rss>
  `, 3);
  assert.equal(rss[0]?.title, 'RSS Title');
  assert.equal(rss[0]?.link, 'https://example.com/rss');

  const atom = parseFeed(`
    <feed>
      <entry>
        <title>Atom Title</title>
        <link rel="alternate" href="https://example.com/atom"/>
        <updated>2026-08-20T00:00:00Z</updated>
        <summary>Atom summary</summary>
      </entry>
    </feed>
  `, 3);
  assert.equal(atom[0]?.title, 'Atom Title');
  assert.equal(atom[0]?.link, 'https://example.com/atom');
});

test('validateDraft accepts a balanced article and rejects missing sources', () => {
  const ok = validateDraft(validDraft, '2026-08-21');
  assert.equal(ok.ok, true);
  assert.equal(ok.sourceCount, 3);

  const bad = validateDraft(validDraft.replaceAll('[来源](', '[link]('), '2026-08-21');
  assert.equal(bad.ok, false);
  assert.match(bad.errors.join('; '), /source links/);
});

test('insertNewsDate keeps index first and the newest date second', () => {
  assert.deepEqual(
    insertNewsDate(['index', '2026-08-20', '2026-08-19'], '2026-08-21'),
    ['index', '2026-08-21', '2026-08-20', '2026-08-19'],
  );
  assert.deepEqual(
    insertNewsDate(['index', '2026-08-21', '2026-08-20'], '2026-08-21'),
    ['index', '2026-08-21', '2026-08-20'],
  );
});

test('updateNavbarLink rewrites only the daily-news entry', () => {
  const next = updateNavbarLink(
    "docLink('每日资讯', '/daily-news/2026-08-20.md')",
    '2026-08-21',
  );
  assert.equal(next, "docLink('每日资讯', '/daily-news/2026-08-21.md')");
});

test('previous helpers extract the latest issue sources and titles', () => {
  assert.equal(
    pickPreviousDate(['index.mdx', '2026-08-20.mdx', '2026-08-19.mdx'], '2026-08-21'),
    '2026-08-20',
  );
  assert.deepEqual(extractSourceUrls(validDraft), [
    'https://example.com/fe',
    'https://example.com/devops',
    'https://example.com/ai',
  ]);
  assert.deepEqual(extractBoldTitles(validDraft), [
    'Firefox 补了一项布局能力',
    'GitHub 更新了 changelog',
    'OpenAI 发布了一则公告',
  ]);
  assert.match(
    formatPreviousHints({
      date: '2026-08-20',
      urls: ['https://example.com/fe'],
      titles: ['Firefox 补了一项布局能力'],
    }),
    /2026-08-20/,
  );
});

test('todayInTimeZone uses the calendar date in Asia/Shanghai', () => {
  const utcLate = new Date('2026-08-20T16:30:00.000Z');
  assert.equal(todayInTimeZone(utcLate, 'UTC'), '2026-08-20');
  assert.equal(todayInTimeZone(utcLate, 'Asia/Shanghai'), '2026-08-21');
});

test('collect-previous-urls.mjs writes the latest published issue for a new date', () => {
  const outPath = join(mkdtempSync(join(tmpdir(), 'daily-news-')), 'previous.md');
  const result = spawnSync('node', ['task/daily-news/scripts/collect-previous-urls.mjs', outPath], {
    env: { ...process.env, NEWS_DATE: '2026-08-21' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const hints = readFileSync(outPath, 'utf8');
  assert.match(hints, /最近一篇日报：2026-08-20/);
  assert.match(hints, /https:\/\/www\.firefox\.com\/en-US\/firefox\/154\.0\/releasenotes/);
});

test('apply-daily-news.mjs dry-run accepts the latest published article', () => {
  const result = spawnSync('node', ['task/daily-news/scripts/apply-daily-news.mjs'], {
    env: {
      ...process.env,
      NEWS_DATE: '2026-08-20',
      NEWS_INPUT_FILE: 'content/docs/news/daily-news/2026-08-20.mdx',
      NEWS_APPLY_DRY_RUN: '1',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.dryRun, true);
  assert.equal(payload.date, '2026-08-20');
  assert.ok(payload.sourceCount >= 3);
});

test('generate-daily-news.sh rejects a bad date and skips an already published day', () => {
  const bad = spawnSync('bash', ['task/daily-news/scripts/generate-daily-news.sh'], {
    env: { ...process.env, NEWS_DATE: 'not-a-date', NEWS_DRY_RUN: '1' },
    encoding: 'utf8',
  });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /NEWS_DATE must be YYYY-MM-DD/);

  const skip = spawnSync('bash', ['task/daily-news/scripts/generate-daily-news.sh'], {
    env: { ...process.env, NEWS_DATE: '2026-08-20', NEWS_DRY_RUN: '1', NEWS_FORCE: '0' },
    encoding: 'utf8',
  });
  assert.equal(skip.status, 0);
  assert.match(skip.stdout, /Already published 2026-08-20/);
  assert.doesNotMatch(skip.stdout, /need Hermes: 1/);
});
