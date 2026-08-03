import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_ROOT = join(process.cwd(), '../../content/docs');

/** 读取文档源文件（迁移后的 MDX 原文） */
export function readDocSourceFile(pagePath: string): string {
  return readFileSync(join(CONTENT_ROOT, pagePath), 'utf8');
}

export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (match) return content.slice(match[0].length).trimStart();
  return content;
}

/**
 * 迁移脚本为兼容 MDX 写入了 HTML 实体（如 &lt;1.5s），
 * Markdown 预览/导出时还原为可读字符。
 */
export function decodeMarkdownEntities(content: string): string {
  return content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\\{/g, '{');
}

export function toDisplayMarkdown(pagePath: string, title: string, url: string): string {
  const raw = stripFrontmatter(readDocSourceFile(pagePath));
  const body = decodeMarkdownEntities(raw);
  return `# ${title}\n\n> 来源: ${url}\n\n${body}`;
}
