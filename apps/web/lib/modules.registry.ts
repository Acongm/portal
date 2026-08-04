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
  categories: DocModuleCategory[];
  nestedModules?: NestedDocModule[];
};

/** 领域注册表 — 编辑 config/doc-modules.json 后运行 pnpm sync:modules */
export const docDomains: DocDomain[] = registry.domains;

/** @deprecated 兼容旧首页：扁平化「当前主领域」品类 */
export const docModuleCategories: DocModuleCategory[] =
  docDomains.find((d) => d.id === 'frontend')?.categories ?? [];

export const nestedDocModules: NestedDocModule[] =
  docDomains.find((d) => d.id === 'frontend')?.nestedModules ?? [];

export const docModules: DocModuleEntry[] = docModuleCategories.flatMap(
  (category) => category.modules,
);

export function getDomainById(id: string): DocDomain | undefined {
  return docDomains.find((d) => d.id === id);
}

export function getModuleHref(domainId: string, folder: string): string {
  return `/docs/${domainId}/${folder}`;
}

export function getDomainHref(domainId: string): string {
  return `/docs/${domainId}`;
}

/** 旧路径模块 → 所属领域（用于 redirect / 导航兼容） */
export function getDomainIdForLegacyFolder(folder: string): string | undefined {
  for (const domain of docDomains) {
    const modules = [
      ...(domain.categories ?? []).flatMap((c) => c.modules),
      ...(domain.nestedModules ?? []),
    ];
    if (modules.some((m) => m.folder === folder)) return domain.id;
  }
  return undefined;
}
