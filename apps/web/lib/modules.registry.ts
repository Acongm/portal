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
  parent: string;
};

/** 文档模块注册表 — 编辑 config/doc-modules.json 后运行 pnpm sync:modules */
export const docModuleCategories: DocModuleCategory[] = registry.categories;

export const nestedDocModules: NestedDocModule[] = registry.nestedModules ?? [];

export const docModules: DocModuleEntry[] = docModuleCategories.flatMap(
  (category) => category.modules,
);

export function getModuleByFolder(folder: string): DocModuleEntry | undefined {
  return docModules.find((m) => m.folder === folder);
}
