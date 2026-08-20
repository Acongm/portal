export function stripXml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return stripXml(m?.[1] || '');
}

function atomLink(block) {
  const alternate =
    block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
    block.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*>/i);
  if (alternate?.[1]) return alternate[1].trim();

  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (href?.[1]) return href[1].trim();

  return tag(block, 'link');
}

export function parseRssItems(xml, maxItems) {
  const blocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return blocks.slice(0, maxItems).map((block) => ({
    title: tag(block, 'title'),
    link: tag(block, 'link') || tag(block, 'guid'),
    date: tag(block, 'pubDate') || tag(block, 'updated') || tag(block, 'published'),
    summary: tag(block, 'description').slice(0, 260),
  })).filter((item) => item.title || item.link);
}

export function parseAtomEntries(xml, maxItems) {
  const blocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  return blocks.slice(0, maxItems).map((block) => ({
    title: tag(block, 'title'),
    link: atomLink(block) || tag(block, 'id'),
    date: tag(block, 'updated') || tag(block, 'published'),
    summary: (tag(block, 'summary') || tag(block, 'content')).slice(0, 260),
  })).filter((item) => item.title || item.link);
}

export function parseFeed(xml, maxItems) {
  const rss = parseRssItems(xml, maxItems);
  if (rss.length) return rss;
  return parseAtomEntries(xml, maxItems);
}
