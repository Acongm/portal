/**
 * MDX 内容清洗（VuePress → Fumadocs）
 */
const KNOWN_CODE_LANGS = new Set([
  'js', 'javascript', 'ts', 'typescript', 'tsx', 'jsx', 'json', 'css', 'scss',
  'html', 'xml', 'svg', 'bash', 'sh', 'shell', 'zsh', 'yaml', 'yml', 'md',
  'markdown', 'sql', 'vue', 'diff', 'text', 'plaintext', 'go', 'rust', 'java',
  'python', 'php', 'ruby', 'swift', 'kotlin', 'c', 'cpp', 'csharp', 'docker',
  'dockerfile', 'nginx', 'http', 'graphql', 'wasm', 'ini', 'toml',
]);

const LANG_ALIASES = {
  code: 'text',
  gcode: 'text',
  '': 'text',
};

export function escapeYaml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return fallback;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

export function buildFrontmatter(fields) {
  const lines = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    lines.push(`${key}: "${escapeYaml(String(value))}"`);
  }
  return `---\n${lines.join('\n')}\n---\n\n`;
}

export function sanitizeMdxBody(body) {
  let result = body;

  // VuePress 自定义块 → 引用块
  result = result.replace(
    /^:::\s*(\w+)?\s*(.*?)\r?\n([\s\S]*?)^:::\s*$/gm,
    (_, type, title, content) => {
      const label = title?.trim() || type || '提示';
      const lines = content.trim().split('\n').map((line) => `> ${line}`);
      return `> **${label}**\n${lines.join('\n')}\n`;
    },
  );

  // Jekyll / Liquid 提示块
  result = result.replace(/\{%\s*hint[\s\S]*?%\}[\s\S]*?\{%\s*endhint\s*%\}/gi, '');
  result = result.replace(/\{%[^%]*%\}/g, '');

  // Git 合并冲突标记
  result = result.replace(/^<<<<<<<.*$/gm, '');
  result = result.replace(/^=======.*$/gm, '');
  result = result.replace(/^>>>>>>>.*$/gm, '');

  // HTML 注释
  result = result.replace(/<!--([\s\S]*?)-->/g, (_, comment) => {
    const text = comment.trim();
    return text ? `{/* ${text} */}` : '';
  });

  // 修复 `word`<T>` 断开的反引号
  result = result.replace(/`([^`\n]+)`<([^>]+)>`/g, '$1<$2>');

  // 图片路径
  result = result.replace(
    /\.\.\/\.vuepress\/alias\/images\//g,
    '/images/',
  );
  result = result.replace(
    /\.\.\/\.vuepress\/public\//g,
    '/',
  );

  // 不规范 HTML（VuePress 首页备案行）
  result = result.replace(
    /<div\s+align\s*=\s*center\s*>[\s\S]*?<\/div>/gi,
    '',
  );

  result = normalizeCodeFenceLangs(result);
  result = escapeAngleBracketsOutsideCode(result);

  return result;
}

function normalizeCodeFenceLangs(body) {
  return body.replace(/```(\w*)([^\n]*)\n/g, (match, lang, rest) => {
    const normalized = LANG_ALIASES[lang] ?? lang;
    if (!normalized || !KNOWN_CODE_LANGS.has(normalized.toLowerCase())) {
      return '```text' + rest + '\n';
    }
    return match;
  });
}

function escapeAngleBracketsOutsideCode(body) {
  const lines = body.split('\n');
  let inFence = false;
  const out = [];

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // 跳过 markdown 链接与图片
    if (/^\s*[!]?\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
      out.push(line);
      continue;
    }

    let processed = line;

    // 转义所有剩余尖括号（避免 MDX 将 <1.5s、<script> 等解析为 JSX）
    processed = processed.replace(/&lt;/g, '<').replace(/</g, '&lt;');

    // 转义花括号表达式（保留 MDX 注释 {/* */}）
    processed = processed.replace(/\{(?!\s*\/\*)/g, '\\{');

    out.push(processed);
  }

  return out.join('\n');
}

export function transformMarkdown(content, titleFallback) {
  const trimmed = content.replace(/^\uFEFF/, '').trimStart();
  const { frontmatter, body } = parseFrontmatter(trimmed);

  const fields = {};

  if (frontmatter) {
    const titleMatch = frontmatter.match(/^title\s*:\s*(.+)$/m);
    if (titleMatch) {
      fields.title = titleMatch[1].replace(/^["']|["']$/g, '').trim();
    }
    const descMatch = frontmatter.match(/^description\s*:\s*(.+)$/m);
    if (descMatch) {
      fields.description = descMatch[1].replace(/^["']|["']$/g, '').trim();
    }
  }

  if (!fields.title) {
    fields.title = extractTitle(body, titleFallback);
  }

  const sanitizedBody = sanitizeMdxBody(body);
  return buildFrontmatter(fields) + sanitizedBody;
}
