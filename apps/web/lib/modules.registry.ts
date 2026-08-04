import registry from '@/config/doc-modules.json';

export type DocModuleEntry = {
  folder: string;
  title: string;
};

export type DocModuleCategory = {
  title: string;
  modules: DocModuleEntry[];
};

/** 文档模块注册表 — 新增品类时编辑 config/doc-modules.json 并运行 sync-doc-modules */
export const docModuleCategories: DocModuleCategory[] = registry.categories;

export const docModules: DocModuleEntry[] = docModuleCategories.flatMap(
  (category) => category.modules,
);

export function getModuleByFolder(folder: string): DocModuleEntry | undefined {
  return docModules.find((m) => m.folder === folder);
}
