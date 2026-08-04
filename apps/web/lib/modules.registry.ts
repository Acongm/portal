import registry from '@/config/doc-modules.json';

export type DocModuleEntry = {
  folder: string;
  title: string;
  description?: string;
  icon?: string;
  accent?: string;
};

export type DocModuleCategory = {
  title: string;
  description?: string;
  modules: DocModuleEntry[];
};

export type NestedDocModule = {
  folder: string;
  title: string;
  description?: string;
  parent: string;
};

export type DocDomain = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  accent?: string;
  /** 隐藏入口：不出现在导航 / 首页 / 侧栏领域 Tab */
  hidden?: boolean;
  categories: DocModuleCategory[];
  nestedModules?: NestedDocModule[];
};

const allDomains = registry.domains as DocDomain[];

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
  for (const domain of allDocDomains) {
    const modules = [
      ...(domain.categories ?? []).flatMap((c) => c.modules),
      ...(domain.nestedModules ?? []),
    ];
    if (modules.some((m) => m.folder === folder)) return domain.id;
  }
  return undefined;
}

export function listAllDomainModuleFolders(): Array<{ domainId: string; folder: string }> {
  const result: Array<{ domainId: string; folder: string }> = [];
  for (const domain of allDocDomains) {
    for (const mod of [
      ...(domain.categories ?? []).flatMap((c) => c.modules),
      ...(domain.nestedModules ?? []),
    ]) {
      result.push({ domainId: domain.id, folder: mod.folder });
    }
  }
  return result;
}
