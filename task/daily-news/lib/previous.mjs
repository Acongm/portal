export function extractSourceUrls(mdx) {
  return [...mdx.matchAll(/\[来源\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1]);
}

export function extractBoldTitles(mdx) {
  return [...mdx.matchAll(/^\*\*(.+?)\*\*/gm)].map((match) =>
    match[1].replace(/[。．.]$/, ''),
  );
}

export function pickPreviousDate(fileNames, newsDate) {
  return fileNames
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.mdx$/.test(name))
    .map((name) => name.replace(/\.mdx$/, ''))
    .filter((date) => date !== newsDate)
    .sort()
    .at(-1) ?? null;
}

export function formatPreviousHints({ date, urls, titles }) {
  if (!date) return '仓库中尚无更早的日报，无需去重。';

  const urlLines = urls.length
    ? urls.map((url) => `- ${url}`).join('\n')
    : '- （未解析到来源链接）';
  const titleLines = titles.length
    ? titles.map((title) => `- ${title}`).join('\n')
    : '- （未解析到标题）';

  return [
    `最近一篇日报：${date}`,
    '',
    '已用过来源（不要再作为主力条目）：',
    urlLines,
    '',
    '已用过标题（不要再写同题）：',
    titleLines,
  ].join('\n');
}
