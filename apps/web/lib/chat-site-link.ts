import {
  buildChatSiteUrl as catalogBuildChatSiteUrl,
} from '@acongm/kb-catalog';
import { getDocModulesRegistry } from '@/lib/modules.registry';

const DEFAULT_CHAT_BASE =
  process.env.NEXT_PUBLIC_CHAT_URL?.trim() || 'https://chat.acongm.com';

/**
 * portal pagePath → chat.acongm.com 深链（query：/?module=&slug=）
 */
export function buildChatSiteUrl(options: {
  pagePath: string;
  title?: string;
  base?: string;
}): string {
  return catalogBuildChatSiteUrl(getDocModulesRegistry(), {
    pagePath: options.pagePath,
    title: options.title,
    base: options.base ?? DEFAULT_CHAT_BASE,
    style: 'query',
  });
}
