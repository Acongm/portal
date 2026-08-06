import registryJson from '@/config/doc-modules.json';
import {
  getDomainIdForLegacyFolder as catalogGetDomainId,
  listAllDomainModuleFolders as catalogListFolders,
  type DocDomain,
  type DocModuleCategory,
  type DocModuleEntry,
  type DocModulesRegistry,
  type NestedDocModule,
} from '@acongm/kb-catalog';

export type {
  DocModuleEntry,
  DocModuleCategory,
  NestedDocModule,
  DocDomain,
};

const registry = registryJson as DocModulesRegistry;
const allDomains = registry.domains;

/** 领域注册表（含 hidden）— 编辑 config/doc-modules.json 后运行 pnpm sync:modules */
export const allDocDomains: DocDomain[] = allDomains;

/** 对外可见领域（导航、首页卡片、顶栏菜单） */
export const docDomains: DocDomain[] = allDomains.filter((d) => !d.hidden);

export const docModules: DocModuleEntry[] = docDomains.flatMap((domain) =>
  (domain.categories ?? []).flatMap((category) => category.modules),
);

/** @deprecated 兼容：默认取「前端核心」品类 */
export const docModuleCategories: DocModuleCategory[] =
  docDomains.find((d) => d.id === 'core')?.categories ?? [];

export function getDomainById(id: string): DocDomain | undefined {
  return allDocDomains.find((d) => d.id === id);
}

export function getModuleHref(domainId: string, folder: string): string {
  return `/docs/${domainId}/${folder}`;
}

export function getDomainHref(domainId: string): string {
  return `/docs/${domainId}`;
}

/** 旧路径模块 → 所属领域（redirect / 导航兼容） */
export function getDomainIdForLegacyFolder(folder: string): string | undefined {
  return catalogGetDomainId(registry, folder);
}

export function listAllDomainModuleFolders(): Array<{
  domainId: string;
  folder: string;
}> {
  return catalogListFolders(registry);
}

/** 供 chat 深链 / kb-catalog 使用的 registry 单例 */
export function getDocModulesRegistry(): DocModulesRegistry {
  return registry;
}
