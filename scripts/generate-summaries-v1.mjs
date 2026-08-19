/**
 * 构建 summaries-v1.json 快照（增量：仅对新/变更 Markdown 调用 AI）
 *
 * 环境变量：
 * - AI_API_KEY：OpenAI 兼容 API Key
 * - AI_BASE_URL：默认 https://api.openai.com/v1
 * - AI_MODEL：默认 deepseek-v4-pro（与历史快照一致）
 * - AI_PROVIDER：mock 时使用本地 Mock 摘要
 * - AI_SUMMARY_ENDPOINT：可选，直连 /api/ai/summary 类 HTTP 接口
 * - AI_SUMMARY_DRY_RUN=1：只打印计划，不调用 AI
 * - AI_SUMMARY_STRICT=1：无 Key 且无可用快照时失败
 * - SUMMARIES_FALLBACK_URL：远程恢复地址（默认 https://www.acongm.com）
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFAULT_PATHS, generateSnapshot } from './ai-summary-v1.mjs';
import { restoreSummariesV1 } from './restore-summaries-v1.mjs';

const root = process.cwd();
const dryRun =
  process.env.AI_SUMMARY_DRY_RUN === '1' || process.argv.includes('--dry-run');
const strict = process.env.AI_SUMMARY_STRICT === '1';

const model = process.env.AI_MODEL || 'deepseek-v4-pro';
const provider = process.env.AI_PROVIDER || 'openai';
const apiKey = process.env.AI_API_KEY || '';
const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const endpoint = process.env.AI_SUMMARY_ENDPOINT || '';

const registry = JSON.parse(
  readFileSync(join(root, DEFAULT_PATHS.registryFile), 'utf8'),
);

const restored = await restoreSummariesV1({ root });
const snapshot = restored.snapshot;

console.log(
  `[generate-summaries-v1] env model=${model} baseUrl=${baseUrl} apiKey=${apiKey ? 'set' : 'missing'} restore=${restored.source}`,
);

if (!apiKey && provider !== 'mock' && !dryRun) {
  const hasUsable = Object.values(snapshot.files ?? {}).some(
    (entry) => entry.status === 'success',
  );
  if (!hasUsable && strict) {
    console.error(
      '[generate-summaries-v1] No AI_API_KEY and no usable snapshot to preserve.',
    );
    process.exit(1);
  }
  if (!hasUsable) {
    console.warn(
      '[generate-summaries-v1] No AI_API_KEY; preserving restored snapshot only.',
    );
  } else {
    console.warn(
      '[generate-summaries-v1] No AI_API_KEY; reusing cache without new AI calls.',
    );
  }
}

const { snapshot: result, plan, stats } = await generateSnapshot({
  docsDir: join(root, DEFAULT_PATHS.docsDir),
  registry,
  snapshot,
  model,
  dryRun,
  provider,
  apiKey,
  baseUrl,
  endpoint,
});

const cachePath = join(root, DEFAULT_PATHS.cacheFile);
const publicPath = join(root, DEFAULT_PATHS.publicFile);

function writeSnapshot(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

if (!dryRun) {
  writeSnapshot(cachePath, result);
  writeSnapshot(publicPath, result);
}

console.log(`[ai-v1-stats] ${JSON.stringify(stats)}`);

if (dryRun) {
  const pending = plan.actions.filter((action) => action.type === 'analyze');
  console.log(
    `[generate-summaries-v1] dry-run pending=${pending.length} reused=${stats.reusedFiles}`,
  );
  if (pending.length > 0) {
    console.log(
      pending
        .slice(0, 20)
        .map((item) => item.legacyPath)
        .join('\n'),
    );
    if (pending.length > 20) {
      console.log(`... and ${pending.length - 20} more`);
    }
  }
} else {
  console.log(
    `[generate-summaries-v1] wrote ${Object.keys(result.files).length} entries -> ${DEFAULT_PATHS.publicFile}`,
  );
}
