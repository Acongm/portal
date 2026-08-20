#!/usr/bin/env node
/** @deprecated Use task/_shared/scripts/collect-rss-hints.mjs */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const taskDir = path.resolve(here, '..');
const shared = path.resolve(here, '../../_shared/scripts/collect-rss-hints.mjs');
const outPath = process.argv[2] || path.join(taskDir, 'tmp/source-hints.md');
const sources = path.join(taskDir, 'sources.json');

const result = spawnSync('node', [shared, sources, outPath], { stdio: 'inherit' });
process.exit(result.status ?? 1);
