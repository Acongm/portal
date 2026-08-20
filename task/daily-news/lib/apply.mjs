const REQUIRED_HEADINGS = ['### 前端', '### DevOps', '### AI', '## 简讯'];
const NAV_RE = /docLink\('每日资讯',\s*'\/daily-news\/\d{4}-\d{2}-\d{2}\.md'\)/;

export function validateDraft(draft, newsDate) {
  const errors = [];
  if (!draft.includes('title:')) errors.push('frontmatter title');
  if (!draft.includes(`date: ${newsDate}`)) errors.push(`frontmatter date: ${newsDate}`);
  for (const heading of REQUIRED_HEADINGS) {
    if (!draft.includes(heading)) errors.push(`heading ${heading}`);
  }
  const sourceCount = (draft.match(/\[来源\]\(https?:\/\//g) || []).length;
  if (sourceCount < 3) errors.push(`source links: expected >= 3, got ${sourceCount}`);
  return { ok: errors.length === 0, errors, sourceCount };
}

export function insertNewsDate(pages, newsDate) {
  const next = (Array.isArray(pages) ? pages : ['index']).filter((page) => page !== newsDate);
  if (!next.includes('index')) next.unshift('index');
  next.splice(next.indexOf('index') + 1, 0, newsDate);
  return next;
}

export function updateNavbarLink(navbar, newsDate) {
  if (!NAV_RE.test(navbar)) {
    throw new Error('Cannot find 每日资讯 nav link in apps/web/lib/navbar.ts');
  }
  return navbar.replace(NAV_RE, `docLink('每日资讯', '/daily-news/${newsDate}.md')`);
}
