#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNewsDate, todayInTimeZone } from '../lib/date.mjs';
import {
  extractBoldTitles,
  extractSourceUrls,
  formatPreviousHints,
  pickPreviousDate,
} from '../lib/previous.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const newsDir = path.join(repoRoot, 'content/docs/news/daily-news');
const newsDate = assertNewsDate(process.env.NEWS_DATE || todayInTimeZone());
const outPath = process.argv[2];

if (!outPath) throw new Error('output path argv[2] is required');

const names = await fs.readdir(newsDir);
const previousDate = pickPreviousDate(names, newsDate);
let urls = [];
let titles = [];

if (previousDate) {
  const mdx = await fs.readFile(path.join(newsDir, `${previousDate}.mdx`), 'utf8');
  urls = extractSourceUrls(mdx);
  titles = extractBoldTitles(mdx);
}

const hints = formatPreviousHints({ date: previousDate, urls, titles });
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${hints}\n`);
console.log(outPath);
