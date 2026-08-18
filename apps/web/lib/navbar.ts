import type { LinkItemType, MainItemType } from 'fumadocs-ui/layouts/shared';
import { getDomainIdForLegacyFolder } from './modules.registry';

/** VuePress 路径 → Portal `/docs/<domain>/...` 路径 */
export function vuepressPathToPortalUrl(path: string): string {
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  let p = trimmed.replace(/^\//, '').replace(/\.md$/, '');
  if (p.endsWith('/README')) {
    p = p.slice(0, -'/README'.length);
  }
  if (p.endsWith('/')) {
    p = p.slice(0, -1);
  }

  if (!p) return '/docs';

  // 已带领域前缀
  if (
    p.startsWith('frontend/') ||
    p.startsWith('yoga/') ||
    p.startsWith('education/') ||
    p === 'frontend' ||
    p === 'yoga' ||
    p === 'education'
  ) {
    return `/docs/${p}`;
  }

  const first = p.split('/')[0];
  const domain = getDomainIdForLegacyFolder(first);
  if (domain) return `/docs/${domain}/${p}`;

  return `/docs/${p}`;
}

function docLink(text: string, vuePath: string): MainItemType {
  const url = vuepressPathToPortalUrl(vuePath);
  const external = url.startsWith('http');
  return {
    type: 'main',
    text,
    url,
    external,
  };
}

function menu(text: string, items: MainItemType[]): LinkItemType {
  return {
    type: 'menu',
    text,
    on: 'nav',
    items,
  };
}

/**
 * 与 vuepress `themeConfig.navbar` 对齐的顶栏菜单（路径已映射到领域前缀）
 */
export const vuepressNavbarLinks: LinkItemType[] = [
  menu('基础语言', [
    docLink('JavaScript', '/JavaScript/'),
    docLink('经典闭包处理', '/JavaScript/经典闭包处理.md'),
    docLink('TypeScript', '/TypeScript/'),
    docLink('CSS', '/css/'),
  ]),
  menu('框架生态', [
    docLink('React', '/react/class-hooks.md'),
    docLink('Vue', '/vue/'),
    docLink('设计模式', '/Pattern/'),
  ]),
  menu('工程化', [
    docLink('Webpack 知识梳理', '/webpack/知识梳理.md'),
    docLink('Node.js', '/node/'),
    docLink('Git', '/git/'),
    docLink('性能优化', '/performance/'),
  ]),
  menu('进阶专题', [
    docLink('技能提炼', '/mark/'),
    docLink('AI 开发', '/ai/'),
    docLink('每日资讯', '/daily-news/2026-08-18.md'),
    docLink('踩坑记录', '/issue/h5.md'),
  ]),
  menu('工具箱', [
    docLink('工具函数', '/utils/regexp.md'),
    docLink('在线工具', '/online-tools/'),
    docLink('软件推荐', '/software/cross-platform.md'),
  ]),
  menu('面试', [
    docLink('知识列表', '/interview-prep/'),
    docLink('面试题库', '/theory/'),
    docLink('面试记录', '/interview/2025-04-28.md'),
    docLink('问答大纲', '/job-description/ASK_LIST.md'),
    docLink('简历', '/job-description/web前端开发工程师-彭聪.md'),
  ]),
  menu('主页', [
    { type: 'main', text: 'Blog', url: 'https://www.acongm.com', external: true },
    { type: 'main', text: 'Github', url: 'https://github.com/Acongm', external: true },
    docLink('简历', '/job-description/web前端开发工程师-彭聪.md'),
  ]),
];
