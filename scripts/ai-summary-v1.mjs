/**
 * summaries-v1 构建期快照核心逻辑（从 VuePress tools/ai-summary-v1.mjs 迁移至 Fumadocs portal）
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const SNAPSHOT_VERSION = 1;
export const PROMPT_VERSION = 'summary-v1';
export const EXTRACT_VERSION = 'markdown-v1';
export const MIN_ANALYZABLE_CHARS = 120;
export const MAX_SUMMARY_CONTENT_CHARS = 12000;

export const SUMMARY_SYSTEM_PROMPT = `你是一个技术文档分析专家。请对技术文档进行全面的内容提炼和分析。

输出要求：
1. 返回 JSON 格式
2. summary: 详细摘要（150-200字），包含核心概念、关键特性和应用场景
3. keyPoints: 3-5个核心要点，每个要点简洁明了
4. keywords: 3-5个关键技术词
5. techStack: 相关技术栈（如：React、TypeScript、Node.js等）
6. difficulty: 难度等级（入门/进阶/高级）
7. contentType: 内容类型（概念/实践/原理/工具）

返回格式示例：
{
  "summary": "React 16 引入了革命性的 Fiber 架构...",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "keywords": ["React", "Fiber", "Hooks"],
  "techStack": ["React", "JavaScript"],
  "difficulty": "进阶",
  "contentType": "原理 + 实践"
}`;

export const DEFAULT_PATHS = {
  cacheFile: '.cache/ai-summaries-v1.json',
  publicFile: 'apps/web/public/summaries-v1.json',
  moduleIndexFile: 'apps/web/public/module-index.json',
  docsDir: 'content/docs',
  registryFile: 'apps/web/config/doc-modules.json',
};

function sha256Hex(input) {
  return `sha256:${createHash('sha256').update(input).digest('hex')}`;
}

export function createAnalysisHash({
  sourceHash,
  model,
  promptVersion = PROMPT_VERSION,
  extractVersion = EXTRACT_VERSION,
}) {
  return sha256Hex(
    `${sourceHash}|${model}|${promptVersion}|${extractVersion}`,
  );
}

export function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\s+/, '');
}

export function extractFrontmatterTitle(raw) {
  if (!raw.startsWith('---')) return '';
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return '';
  const fm = raw.slice(3, end);
  const match = fm.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))\s*$/m);
  return (match?.[1] || match?.[2] || match?.[3] || '').trim();
}

export function normalizeMarkdown(raw) {
  let text = stripFrontmatter(raw);
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

export function computeSourceHash(normalizedContent) {
  return sha256Hex(normalizedContent);
}

function listKnownModuleFolders(registry) {
  const folders = new Set();
  for (const domain of registry.domains ?? []) {
    if (domain.hidden) continue;
    for (const category of domain.categories ?? []) {
      for (const mod of category.modules ?? []) {
        folders.add(mod.folder);
      }
    }
    for (const mod of domain.nestedModules ?? []) {
      folders.add(mod.folder);
    }
  }
  return folders;
}

function hiddenDomainIds(registry) {
  return new Set(
    (registry.domains ?? [])
      .filter((domain) => domain.hidden)
      .map((domain) => domain.id),
  );
}

function domainIds(registry) {
  return new Set((registry.domains ?? []).map((domain) => domain.id));
}

export function filePathToLegacyPagePath(relPath, registry) {
  const parts = relPath.replace(/\.(mdx?)$/i, '').split('/');
  const knownFolders = listKnownModuleFolders(registry);
  const domains = domainIds(registry);

  let folder = '';
  let folderIndex = -1;
  for (let i = 1; i < parts.length; i += 1) {
    if (knownFolders.has(parts[i])) {
      folder = parts[i];
      folderIndex = i;
    }
  }

  if (!folder) {
    if (domains.has(parts[0]) || parts.length >= 2) {
      folder = parts[0];
      folderIndex = 0;
    } else {
      folder = parts[0];
      folderIndex = 0;
    }
  }

  const slugParts = parts.slice(folderIndex + 1);
  if (slugParts.length === 0) {
    return `/${folder}/README.md`;
  }

  const last = slugParts[slugParts.length - 1];
  if (/^(index|readme)$/i.test(last)) {
    return `/${folder}/README.md`;
  }

  return `/${folder}/${slugParts.join('/')}.md`.replace(/\/+/g, '/');
}

function classifyDocument({ relPath, normalizedContent, registry }) {
  const parts = relPath.split('/');
  const domainId = parts[0];
  const hidden = hiddenDomainIds(registry);

  if (hidden.has(domainId)) {
    return { status: 'excluded', reason: 'hidden-domain' };
  }

  if (parts.length === 2 && /^index\.mdx?$/i.test(parts[1])) {
    return { status: 'excluded', reason: 'section-index' };
  }

  if (normalizedContent.length < MIN_ANALYZABLE_CHARS) {
    return { status: 'short', reason: 'content-too-short' };
  }

  return { status: 'pending' };
}

export function discoverDocuments({
  docsDir = DEFAULT_PATHS.docsDir,
  registry,
}) {
  const documents = [];
  const seen = new Set();

  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const fullPath = join(dir, name);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!/\.(md|mdx)$/i.test(name)) continue;

      const relPath = relative(docsDir, fullPath).split(/[/\\]/).join('/');
      const legacyPath = filePathToLegacyPagePath(relPath, registry);
      if (seen.has(legacyPath)) continue;
      seen.add(legacyPath);

      const raw = readFileSync(fullPath, 'utf8');
      const normalizedContent = normalizeMarkdown(raw);
      const title = extractFrontmatterTitle(raw) || legacyPath;
      const classification = classifyDocument({
        relPath,
        normalizedContent,
        registry,
      });

      documents.push({
        relPath,
        legacyPath,
        title,
        normalizedContent,
        sourceHash: computeSourceHash(normalizedContent),
        classification,
      });
    }
  }

  walk(docsDir);
  return documents.sort((a, b) => a.legacyPath.localeCompare(b.legacyPath));
}

export function isMockSummary(summary) {
  const text =
    typeof summary === 'object' && summary !== null
      ? summary.summary
      : String(summary || '');
  return typeof text === 'string' && text.startsWith('Mock 摘要');
}

export function buildAnalysisPlan({
  documents,
  snapshot,
  model,
  promptVersion = PROMPT_VERSION,
  extractVersion = EXTRACT_VERSION,
}) {
  const files = { ...(snapshot?.files ?? {}) };
  const plan = {
    totalFiles: documents.length,
    reusedFiles: 0,
    pendingFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
    aiCalls: 0,
    actions: [],
  };

  const activePaths = new Set(documents.map((doc) => doc.legacyPath));
  for (const legacyPath of Object.keys(files)) {
    if (!activePaths.has(legacyPath)) {
      delete files[legacyPath];
      plan.actions.push({ type: 'delete', legacyPath });
    }
  }

  for (const doc of documents) {
    const analysisHash = createAnalysisHash({
      sourceHash: doc.sourceHash,
      model,
      promptVersion,
      extractVersion,
    });
    const existing = files[doc.legacyPath];

    if (doc.classification.status !== 'pending') {
      files[doc.legacyPath] = {
        sourceHash: doc.sourceHash,
        analysisHash,
        status: doc.classification.status,
        reason: doc.classification.reason,
        processedAt: new Date().toISOString(),
      };
      plan.skippedFiles += 1;
      plan.actions.push({
        type: 'skip',
        legacyPath: doc.legacyPath,
        status: doc.classification.status,
      });
      continue;
    }

    if (
      existing?.status === 'success' &&
      existing.summary &&
      existing.analysisHash === analysisHash &&
      !isMockSummary(existing.summary)
    ) {
      files[doc.legacyPath] = existing;
      plan.reusedFiles += 1;
      plan.actions.push({ type: 'reuse', legacyPath: doc.legacyPath });
      continue;
    }

    if (
      existing?.status === 'success' &&
      existing.summary &&
      !isMockSummary(existing.summary)
    ) {
      files[doc.legacyPath] = {
        ...existing,
        sourceHash: doc.sourceHash,
        reason:
          existing.analysisHash === analysisHash
            ? existing.reason
            : 'preserved-until-reanalysis',
      };
      plan.reusedFiles += 1;
      plan.actions.push({
        type:
          existing.analysisHash === analysisHash ? 'reuse' : 'preserve',
        legacyPath: doc.legacyPath,
      });
      continue;
    }

    plan.pendingFiles += 1;
    plan.aiCalls += 1;
    plan.actions.push({
      type: 'analyze',
      legacyPath: doc.legacyPath,
      title: doc.title,
      content: doc.normalizedContent,
    });
  }

  return { files, plan };
}

function extractJsonString(raw) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) return fenced[1].trim();
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return trimmed;
}

export function parseSummaryResponse(raw) {
  if (!raw?.trim()) {
    throw new Error('Empty AI summary response.');
  }

  const parsed = JSON.parse(extractJsonString(raw));
  if (!parsed.summary || typeof parsed.summary !== 'string') {
    throw new Error('Missing summary field in AI response.');
  }

  const toArray = (value) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : [];

  return {
    summary: parsed.summary.trim(),
    keyPoints: toArray(parsed.keyPoints),
    keywords: toArray(parsed.keywords),
    techStack: toArray(parsed.techStack),
    difficulty: parsed.difficulty || '未分级',
    contentType: parsed.contentType || '综合',
  };
}

export function buildPortalCiIdentity(env = process.env) {
  const serviceId = (env.PORTAL_SERVICE_ID || 'portal-ci').trim() || 'portal-ci';
  const serviceKey = (env.PORTAL_SERVICE_KEY || '').trim();
  const requestId = randomUUID();
  const callSource = 'portal:ci:summaries';
  const headers = {
    'content-type': 'application/json',
    'x-call-source': callSource,
    'x-request-id': requestId,
    'x-client-id': `svc:${serviceId}`,
    'user-agent': 'portal-ci/summaries',
  };
  if (serviceKey) {
    headers['x-service-id'] = serviceId;
    headers['x-service-key'] = serviceKey;
  }
  return {
    headers,
    requestId,
    serviceId,
    callSource,
    caller: `svc:${serviceId}`,
  };
}

function storedSummaryFromProvider(result) {
  return {
    summary: result.summary,
    keyPoints: result.keyPoints,
    keywords: result.keywords,
    techStack: result.techStack,
    difficulty: result.difficulty,
    contentType: result.contentType,
  };
}

function analysisFromProvider(result) {
  if (!result?.caller && !result?.requestId) return undefined;
  return {
    caller: result.caller,
    callSource: result.callSource,
    requestId: result.requestId,
  };
}

function attachProviderTrace(result, identity, response) {
  const requestId =
    response.headers.get('x-request-id')?.trim() || identity.requestId;
  return {
    ...result,
    requestId,
    caller: identity.caller,
    callSource: identity.callSource,
  };
}

export function createMockSummary(content, title) {
  const preview = content.slice(0, 120).replace(/\s+/g, ' ');
  const label = title || '当前文档';
  return {
    summary: `Mock 摘要（${label}）：${preview}${content.length > 120 ? '…' : ''}`,
    keyPoints: ['Mock 要点 1', 'Mock 要点 2'],
    keywords: ['Mock'],
    techStack: [],
    difficulty: '未分级',
    contentType: '综合',
  };
}

export async function callSummaryProvider({
  title,
  content,
  path,
  model,
  apiKey,
  baseUrl,
  endpoint,
  provider = 'openai',
}) {
  const clipped = content.slice(0, MAX_SUMMARY_CONTENT_CHARS);
  if (provider === 'mock') {
    return createMockSummary(clipped, title);
  }

  if (!apiKey) {
    throw new Error('AI_API_KEY is required for summary generation.');
  }

  const identity = buildPortalCiIdentity();

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...identity.headers,
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        title,
        path,
        content: clipped,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      const requestId =
        response.headers.get('x-request-id')?.trim() || identity.requestId;
      throw new Error(
        `Summary API failed (${response.status}) requestId=${requestId}: ${text}`,
      );
    }
    const json = await response.json();
    if (json.summary && typeof json.summary === 'string') {
      return attachProviderTrace(
        {
          summary: json.summary,
          keyPoints: json.keyPoints ?? [],
          keywords: json.keywords ?? [],
          techStack: json.techStack ?? [],
          difficulty: json.difficulty ?? '未分级',
          contentType: json.contentType ?? '综合',
        },
        identity,
        response,
      );
    }
    return attachProviderTrace(
      parseSummaryResponse(JSON.stringify(json)),
      identity,
      response,
    );
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...identity.headers,
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `文档标题：${title}\n文档路径：${path}\n\n请分析以下技术文档并提炼关键信息，以 JSON 格式返回：\n\n${clipped}`,
        },
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const requestId =
      response.headers.get('x-request-id')?.trim() || identity.requestId;
    throw new Error(
      `AI provider failed (${response.status}) requestId=${requestId}: ${text}`,
    );
  }

  const json = await response.json();
  const message = json.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error('AI provider returned empty message.');
  }
  return attachProviderTrace(parseSummaryResponse(message), identity, response);
}

export async function generateSnapshot({
  docsDir = DEFAULT_PATHS.docsDir,
  registry,
  snapshot = { version: SNAPSHOT_VERSION, files: {} },
  model,
  dryRun = false,
  provider,
  apiKey,
  baseUrl,
  endpoint,
}) {
  const started = Date.now();
  const documents = discoverDocuments({ docsDir, registry });
  const { files, plan } = buildAnalysisPlan({
    documents,
    snapshot,
    model,
  });

  const pending = plan.actions.filter((action) => action.type === 'analyze');
  const canAnalyze = !dryRun && (provider === 'mock' || Boolean(apiKey));
  if (canAnalyze) {
    for (const action of pending) {
      try {
        const summary = await callSummaryProvider({
          title: action.title,
          content: action.content,
          path: action.legacyPath,
          model,
          apiKey,
          baseUrl,
          endpoint,
          provider,
        });
        const doc = documents.find((item) => item.legacyPath === action.legacyPath);
        const sourceHash = doc?.sourceHash ?? '';
        const analysis = analysisFromProvider(summary);
        files[action.legacyPath] = {
          sourceHash,
          analysisHash: createAnalysisHash({ sourceHash, model }),
          status: 'success',
          summary: storedSummaryFromProvider(summary),
          ...(analysis ? { analysis } : {}),
          processedAt: new Date().toISOString(),
        };
      } catch (error) {
        plan.failedFiles += 1;
        plan.aiCalls = Math.max(0, plan.aiCalls - 1);
        const doc = documents.find((item) => item.legacyPath === action.legacyPath);
        files[action.legacyPath] = {
          sourceHash: doc?.sourceHash,
          analysisHash: createAnalysisHash({
            sourceHash: doc?.sourceHash ?? '',
            model,
          }),
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          processedAt: new Date().toISOString(),
        };
      }
    }
  }

  const completedFiles = Object.values(files).filter(
    (entry) => entry.status === 'success',
  ).length;
  const stats = {
    totalFiles: plan.totalFiles,
    reusedFiles: plan.reusedFiles,
    pendingFiles: plan.pendingFiles,
    completedFiles,
    skippedFiles: plan.skippedFiles,
    failedFiles: plan.failedFiles,
    aiCalls: dryRun ? plan.aiCalls : pending.length - plan.failedFiles,
    hitRate:
      plan.totalFiles > 0
        ? Number((plan.reusedFiles / plan.totalFiles).toFixed(4))
        : 1,
    durationMs: Date.now() - started,
  };

  return {
    snapshot: {
      version: SNAPSHOT_VERSION,
      generatedAt: new Date().toISOString(),
      analysis: {
        model,
        promptVersion: PROMPT_VERSION,
        extractVersion: EXTRACT_VERSION,
      },
      files,
      stats,
    },
    plan,
    stats,
  };
}

export function buildModuleIndex(snapshot, registry) {
  const modules = {};
  const moduleDescriptions = new Map();

  for (const domain of registry.domains ?? []) {
    if (domain.hidden) continue;
    for (const category of domain.categories ?? []) {
      for (const mod of category.modules ?? []) {
        moduleDescriptions.set(mod.folder, mod.description ?? '');
      }
    }
    for (const mod of domain.nestedModules ?? []) {
      moduleDescriptions.set(mod.folder, mod.description ?? '');
    }
  }

  for (const [pagePath, entry] of Object.entries(snapshot.files ?? {})) {
    if (entry.status !== 'success' || !entry.summary) continue;
    const segments = pagePath.replace(/^\//, '').split('/');
    const moduleKey = segments[0];
    if (!moduleKey) continue;
    const slug = segments.slice(1).join('/');
    if (!slug || /^readme$/i.test(slug.replace(/\.md$/i, ''))) continue;

    if (!modules[moduleKey]) {
      modules[moduleKey] = {
        sidebarKey: `/${moduleKey}/`,
        description: moduleDescriptions.get(moduleKey) ?? '',
        files: [],
      };
    }

    const title =
      slug.replace(/\.md$/i, '').split('/').pop() || moduleKey;
    const summaryData =
      typeof entry.summary === 'object' && entry.summary
        ? entry.summary
        : { summary: String(entry.summary) };

    modules[moduleKey].files.push({
      path: pagePath,
      title,
      summary: summaryData.summary,
      keywords: summaryData.keywords,
    });
  }

  for (const module of Object.values(modules)) {
    module.files.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  }

  return {
    _meta: {
      generatedAt: new Date().toISOString(),
      moduleCount: Object.keys(modules).length,
    },
    modules,
  };
}
