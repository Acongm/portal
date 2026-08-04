#!/usr/bin/env node
/**
 * 将文档内链中的旧路径改写为当前 domain/module 路由可解析形式：
 * - ./foo.md → ./foo.mdx（与磁盘一致，供 fumadocs resolveHref）
 * - README.md → index.mdx
 * - /git/command.md → /docs/engineering/git/command
 * - ../interview-prep/...（错误领域）→ /docs/career/interview-prep/...
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../content/docs');
const require = createRequire(import.meta.url);
const registry = require('../apps/web/config/doc-modules.json');

const folderDomain = new Map();
for (const domain of registry.domains) {
  for (const mod of [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ]) {
    folderDomain.set(mod.folder, domain.id);
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

function posixJoin(baseRel, hrefPath) {
  const parts = baseRel.split('/').filter(Boolean);
  for (const seg of hrefPath.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join('/');
}

function pageExists(contentRelNoExt) {
  const candidates = [
    `${contentRelNoExt}.mdx`,
    `${contentRelNoExt}.md`,
    `${contentRelNoExt}/index.mdx`,
  ];
  return candidates.some((c) => {
    try {
      return statSync(join(ROOT, c)).isFile();
    } catch {
      return false;
    }
  });
}

function rewriteHref(href, fileRelDir) {
  const hashIdx = href.indexOf('#');
  const path = hashIdx === -1 ? href : href.slice(0, hashIdx);
  const hash = hashIdx === -1 ? '' : href.slice(hashIdx);
  if (!path) return href;
  if (/^(https?:|mailto:|tel:)/i.test(path)) return href;

  // absolute legacy /module/...
  if (path.startsWith('/') && !path.startsWith('/docs/')) {
    if (path.startsWith('/images/') || path.startsWith('/api/')) return href;
    const cleaned = path.replace(/\/+$/, '').replace(/\.(md|mdx|html)$/i, '');
    const segments = cleaned.split('/').filter(Boolean);
    if (!segments.length) return href;
    const domain = folderDomain.get(segments[0]);
    if (!domain) return href;
    const rest = segments.slice(1);
    const url =
      rest.length === 0
        ? `/docs/${domain}/${segments[0]}`
        : `/docs/${domain}/${segments[0]}/${rest.join('/')}`;
    return `${url}${hash}`;
  }

  // relative .md / README.md / .html
  if (path.startsWith('./') || path.startsWith('../') || !path.startsWith('/')) {
    let next = path;

    if (/\.html$/i.test(next)) {
      next = next.replace(/\.html$/i, '.mdx');
    } else if (/(^|\/)README\.md$/i.test(next)) {
      next = next.replace(/README\.md$/i, 'index.mdx');
    } else if (/\.md$/i.test(next) && !/\.mdx$/i.test(next)) {
      next = `${next.slice(0, -3)}.mdx`;
    }

    // cross-domain: if joined path's module lives elsewhere, use absolute docs url
    const joined = posixJoin(fileRelDir, next);
    const parts = joined.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const maybeDomain = parts[0];
      const moduleFolder = parts[1];
      const correct = folderDomain.get(moduleFolder);
      if (correct && correct !== maybeDomain) {
        const stem = parts
          .slice(1)
          .join('/')
          .replace(/\.(md|mdx)$/i, '')
          .replace(/\/index$/i, '');
        const abs = `/docs/${correct}/${stem}`;
        if (pageExists(`${correct}/${stem}`) || pageExists(`${correct}/${stem}/index`)) {
          return `${abs}${hash}`;
        }
      }
    }

    return `${next}${hash}`;
  }

  // /docs/... with .md suffix
  if (path.startsWith('/docs/') && /\.(md|mdx|html)$/i.test(path)) {
    return `${path.replace(/\.(md|mdx|html)$/i, '')}${hash}`;
  }

  return href;
}

const linkRe = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
let changedFiles = 0;
let changedLinks = 0;

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const fileRelDir = dirname(rel).replace(/\\/g, '/');
  const original = readFileSync(file, 'utf8');
  let count = 0;
  const updated = original.replace(linkRe, (full, text, href) => {
    // skip fake links in regexp docs etc.
    if (/[\[\]|?]/.test(href) && !href.includes('/')) return full;
    const next = rewriteHref(href, fileRelDir === '.' ? '' : fileRelDir);
    if (next === href) return full;
    count += 1;
    // 只替换 href，避免 label 与 href 相同时被误改
    const open = full.indexOf('(');
    const close = full.lastIndexOf(')');
    if (open === -1 || close === -1) return full;
    return `${full.slice(0, open + 1)}${next}${full.slice(close)}`;
  });
  if (updated !== original) {
    writeFileSync(file, updated);
    changedFiles += 1;
    changedLinks += count;
    console.log(`updated ${rel} (${count})`);
  }
}

console.log(`done: ${changedFiles} files, ${changedLinks} links`);
