/**
 * 恢复 summaries-v1 快照：本地 cache → 远程 fallback → 空快照
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFAULT_PATHS, SNAPSHOT_VERSION } from './ai-summary-v1.mjs';

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function restoreSummariesV1({
  root = process.cwd(),
  cacheFile = DEFAULT_PATHS.cacheFile,
  publicFile = DEFAULT_PATHS.publicFile,
  fallbackUrl = process.env.SUMMARIES_FALLBACK_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.acongm.com',
} = {}) {
  const cachePath = join(root, cacheFile);
  const publicPath = join(root, publicFile);
  const destinations = [cachePath, publicPath];

  const local = readJson(cachePath) || readJson(publicPath);
  if (local?.files) {
    return { source: 'local', snapshot: local, destinations };
  }

  const remoteUrl = `${fallbackUrl.replace(/\/+$/, '')}/summaries-v1.json`;
  try {
    const response = await fetch(remoteUrl);
    if (response.ok) {
      const snapshot = await response.json();
      if (snapshot?.files) {
        for (const dest of destinations) writeJson(dest, snapshot);
        return { source: 'remote', snapshot, destinations, remoteUrl };
      }
    }
  } catch {
    // fall through to empty snapshot
  }

  const empty = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    files: {},
    stats: {},
  };
  return { source: 'empty', snapshot: empty, destinations };
}

const isCli = process.argv[1]?.endsWith('restore-summaries-v1.mjs');
if (isCli) {
  const result = await restoreSummariesV1();
  console.log(
    `[restore-summaries-v1] source=${result.source} files=${Object.keys(result.snapshot.files ?? {}).length}`,
  );
}
