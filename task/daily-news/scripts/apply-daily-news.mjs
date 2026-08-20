#!/usr/bin/env node
/**
 * @deprecated Use task/_shared/scripts/apply-daily-content.mjs
 *   DAILY_TASK=daily-news DAILY_DATE=... DAILY_INPUT_FILE=... node task/_shared/scripts/apply-daily-content.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(here, '../../_shared/scripts/apply-daily-content.mjs');

const env = {
  ...process.env,
  DAILY_TASK: 'daily-news',
  DAILY_DATE: process.env.DAILY_DATE || process.env.NEWS_DATE,
  DAILY_INPUT_FILE: process.env.DAILY_INPUT_FILE || process.env.NEWS_INPUT_FILE,
  DAILY_APPLY_DRY_RUN: process.env.DAILY_APPLY_DRY_RUN || process.env.NEWS_APPLY_DRY_RUN,
  DAILY_RUN_SUMMARIES: process.env.DAILY_RUN_SUMMARIES || process.env.NEWS_RUN_SUMMARIES,
  DAILY_FORCE: process.env.DAILY_FORCE,
};

const result = spawnSync('node', [shared], { stdio: 'inherit', env });
process.exit(result.status ?? 1);
