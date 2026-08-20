#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadTaskConfig } from '../lib/task-config.mjs';

const taskId = process.env.DAILY_TASK;
const slug = process.env.DAILY_SLUG;
const date = process.env.DAILY_DATE;

if (!taskId || !slug) {
  throw new Error('DAILY_TASK and DAILY_SLUG are required');
}

const { config, repoRoot } = await loadTaskConfig(taskId);
const files = [
  path.join(config.contentDir, `${slug}.mdx`),
  path.join(config.contentDir, 'meta.json'),
];

if (process.env.DAILY_RUN_SUMMARIES === '1') {
  files.push('apps/web/public/summaries-v1.json', 'apps/web/public/module-index.json');
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed`);
  }
  return result;
}

run('git', ['add', '--', ...files]);

const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot });
if (diff.status === 0) {
  console.log('No staged changes; skip commit.');
  process.exit(0);
}

const message = config.commitMessage
  ? config.commitMessage.replace('{{slug}}', slug).replace('{{date}}', date ?? slug)
  : `chore(${taskId}): add ${slug}`;

run('git', ['commit', '-m', message]);
run('git', ['push', 'origin', 'main']);

console.log(JSON.stringify({ committed: true, taskId, slug, files }, null, 2));
