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

export const docModules: DocModuleEntry[] = docDomains.flatMap((domain) =>
  (domain.categories ?? []).flatMap((category) => category.modules),
);

/** @deprecated 兼容：默认取「前端核心」品类 */
export const docModuleCategories: DocModuleCategory[] =
  docDomains.find((d) => d.id === 'core')?.categories ?? [];

export function getDomainById(id: string): DocDomain | undefined {
  return docDomains.find((d) => d.id === id);
}

export function getModuleHref(domainId: string, folder: string): string {
  return `/docs/${domainId}/${folder}`;
}

export function getDomainHref(domainId: string): string {
  return `/docs/${domainId}`;
}

/** 旧路径模块 → 所属领域（redirect / 导航兼容） */
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

export function listAllDomainModuleFolders(): Array<{ domainId: string; folder: string }> {
  const result: Array<{ domainId: string; folder: string }> = [];
  for (const domain of docDomains) {
    for (const mod of [
      ...(domain.categories ?? []).flatMap((c) => c.modules),
      ...(domain.nestedModules ?? []),
    ]) {
      result.push({ domainId: domain.id, folder: mod.folder });
    }
  }
  return result;
}
