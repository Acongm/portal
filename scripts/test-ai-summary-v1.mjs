import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  buildAnalysisPlan,
  buildModuleIndex,
  computeSourceHash,
  createAnalysisHash,
  createMockSummary,
  discoverDocuments,
  filePathToLegacyPagePath,
  generateSnapshot,
  isMockSummary,
  normalizeMarkdown,
  PROMPT_VERSION,
  EXTRACT_VERSION,
  SNAPSHOT_VERSION,
} from './ai-summary-v1.mjs';

const registry = {
  domains: [
    {
      id: 'news',
      categories: [
        {
          modules: [
            {
              folder: 'daily-news',
              title: '每日资讯',
              description: '技术资讯',
            },
          ],
        },
      ],
    },
    {
      id: 'core',
      hidden: true,
      categories: [],
    },
  ],
};

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ai-summary-v1-'));
  const docsDir = join(root, 'content/docs');
  mkdirSync(join(docsDir, 'news/daily-news'), { recursive: true });
  mkdirSync(join(docsDir, 'core/react'), { recursive: true });
  mkdirSync(join(docsDir, 'yoga'), { recursive: true });

  writeFileSync(
    join(docsDir, 'news/daily-news/2026-08-19.mdx'),
    `---
title: 每日科技动态 - 2026年8月19日
---

# 每日科技动态

${'这是一段足够长的正文内容，用于触发 AI 分析流程。'.repeat(8)}
`,
    'utf8',
  );

  writeFileSync(
    join(docsDir, 'news/daily-news/2026-08-18.mdx'),
    `---
title: 每日科技动态 - 2026年8月18日
---

# 每日科技动态

${'第二篇文章正文，同样足够长以通过最小长度校验。'.repeat(8)}
`,
    'utf8',
  );

  writeFileSync(
    join(docsDir, 'news/index.mdx'),
    '# 资讯\n\n索引页',
    'utf8',
  );

  writeFileSync(
    join(docsDir, 'core/react/react16.mdx'),
    `---
title: React 16
---

# React 16

${'隐藏领域内容不应进入分析计划。'.repeat(10)}
`,
    'utf8',
  );

  writeFileSync(
    join(docsDir, 'yoga/index.mdx'),
    '# Yoga hidden',
    'utf8',
  );

  return { root, docsDir };
}

test('maps fumadocs paths to legacy summary keys', () => {
  assert.equal(
    filePathToLegacyPagePath('news/daily-news/2026-08-19.mdx', registry),
    '/daily-news/2026-08-19.md',
  );
  assert.equal(
    filePathToLegacyPagePath('news/index.mdx', registry),
    '/news/README.md',
  );
});

test('normalizes markdown and hashes deterministically', () => {
  const raw = `---
title: Test
---

# Title


Body line
`;
  const normalized = normalizeMarkdown(raw);
  assert.match(normalized, /^# Title/);
  const hash = computeSourceHash(normalized);
  assert.match(hash, /^sha256:/);
  const analysisHash = createAnalysisHash({
    sourceHash: hash,
    model: 'deepseek-v4-pro',
    promptVersion: PROMPT_VERSION,
    extractVersion: EXTRACT_VERSION,
  });
  assert.match(analysisHash, /^sha256:/);
});

test('buildAnalysisPlan reuses matching success entries', () => {
  const { docsDir } = fixtureRoot();
  const documents = discoverDocuments({ docsDir, registry });
  const firstDoc = documents.find(
    (doc) => doc.legacyPath === '/daily-news/2026-08-19.md',
  );
  assert.ok(firstDoc);

  const snapshot = {
    version: SNAPSHOT_VERSION,
    files: {
      [firstDoc.legacyPath]: {
        sourceHash: firstDoc.sourceHash,
        analysisHash: createAnalysisHash({
          sourceHash: firstDoc.sourceHash,
          model: 'deepseek-v4-pro',
        }),
        status: 'success',
        summary: createMockSummary(firstDoc.normalizedContent, firstDoc.title),
        processedAt: '2026-06-14T00:00:00.000Z',
      },
    },
  };

  const { plan } = buildAnalysisPlan({
    documents,
    snapshot,
    model: 'deepseek-v4-pro',
  });

  assert.equal(plan.reusedFiles, 1);
  assert.equal(plan.aiCalls, 1);
  assert.equal(plan.pendingFiles, 1);
});

test('generateSnapshot dry-run makes zero provider calls', async () => {
  const { docsDir } = fixtureRoot();
  const { stats, plan } = await generateSnapshot({
    docsDir,
    registry,
    snapshot: { version: SNAPSHOT_VERSION, files: {} },
    model: 'deepseek-v4-pro',
    dryRun: true,
    provider: 'mock',
  });

  assert.equal(stats.aiCalls, plan.actions.filter((a) => a.type === 'analyze').length);
  assert.ok(stats.pendingFiles >= 1);
});

test('generateSnapshot mock provider fills success entries', async () => {
  const { docsDir } = fixtureRoot();
  const { snapshot } = await generateSnapshot({
    docsDir,
    registry,
    snapshot: { version: SNAPSHOT_VERSION, files: {} },
    model: 'deepseek-v4-pro',
    provider: 'mock',
  });

  const entry = snapshot.files['/daily-news/2026-08-19.md'];
  assert.equal(entry.status, 'success');
  assert.ok(entry.summary?.summary);
});

test('preserves existing success summaries when preserveExistingSuccess is enabled', () => {
  const { docsDir } = fixtureRoot();
  const documents = discoverDocuments({ docsDir, registry });
  const firstDoc = documents.find(
    (doc) => doc.legacyPath === '/daily-news/2026-08-19.md',
  );
  assert.ok(firstDoc);

  const snapshot = {
    version: SNAPSHOT_VERSION,
    files: {
      [firstDoc.legacyPath]: {
        sourceHash: 'sha256:old-hash',
        analysisHash: 'sha256:old-analysis',
        status: 'success',
        summary: {
          summary: '保留的真实摘要',
          keyPoints: ['a'],
          keywords: ['b'],
          techStack: [],
          difficulty: '中级',
          contentType: 'daily-news',
        },
        processedAt: '2026-06-14T00:00:00.000Z',
      },
    },
  };

  const { plan } = buildAnalysisPlan({
    documents,
    snapshot,
    model: 'deepseek-v4-pro',
  });

  assert.equal(
    plan.actions.filter((action) => action.type === 'preserve').length,
    1,
  );
  assert.equal(plan.aiCalls, 1);
});

test('with API key only mock placeholders are scheduled for analysis', () => {
  const { docsDir } = fixtureRoot();
  const documents = discoverDocuments({ docsDir, registry });
  const realDoc = documents.find(
    (doc) => doc.legacyPath === '/daily-news/2026-08-19.md',
  );
  const mockDoc = documents.find(
    (doc) => doc.legacyPath === '/daily-news/2026-08-18.md',
  );
  assert.ok(realDoc && mockDoc);

  const snapshot = {
    version: SNAPSHOT_VERSION,
    files: {
      [realDoc.legacyPath]: {
        sourceHash: 'sha256:old-hash',
        analysisHash: 'sha256:old-analysis',
        status: 'success',
        summary: {
          summary: '保留的真实摘要',
          keyPoints: [],
          keywords: [],
          techStack: [],
          difficulty: '中级',
          contentType: 'daily-news',
        },
        processedAt: '2026-06-14T00:00:00.000Z',
      },
      [mockDoc.legacyPath]: {
        sourceHash: mockDoc.sourceHash,
        analysisHash: 'sha256:mock',
        status: 'success',
        summary: createMockSummary(mockDoc.normalizedContent, mockDoc.title),
        processedAt: '2026-06-14T00:00:00.000Z',
      },
    },
  };

  const { plan } = buildAnalysisPlan({
    documents,
    snapshot,
    model: 'deepseek-v4-pro',
  });

  assert.equal(
    plan.actions.filter((action) => action.type === 'preserve').length,
    1,
  );
  assert.equal(
    plan.actions.filter((action) => action.type === 'analyze').length,
    1,
  );
  assert.equal(plan.aiCalls, 1);
});

test('buildModuleIndex groups success summaries by module folder', () => {
  const snapshot = {
    files: {
      '/daily-news/2026-08-19.md': {
        status: 'success',
        summary: {
          summary: '摘要',
          keywords: ['AI'],
        },
      },
      '/daily-news/2026-08-18.md': {
        status: 'error',
        error: 'failed',
      },
    },
  };

  const moduleIndex = buildModuleIndex(snapshot, registry);
  assert.equal(moduleIndex._meta.moduleCount, 1);
  assert.equal(moduleIndex.modules['daily-news'].files.length, 1);
  assert.equal(moduleIndex.modules['daily-news'].files[0].path, '/daily-news/2026-08-19.md');
});
