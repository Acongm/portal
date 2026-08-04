import type { Root as PageTreeRoot, Folder, Node, Item } from 'fumadocs-core/page-tree';

function decodeSeg(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSlug(slug: string[]): string[] {
  return slug.map(decodeSeg);
}

/** folder.$ref.folder 形如 `core` 或 `core/JavaScript` */
function folderRefParts(folder: Folder): string[] | null {
  const ref = folder.$ref?.folder;
  if (!ref) return null;
  return ref.split('/').filter(Boolean).map(decodeSeg);
}

function collectRootFolders(nodes: Node[], out: Folder[] = []): Folder[] {
  for (const node of nodes) {
    if (node.type !== 'folder') continue;
    if (node.root) out.push(node);
    collectRootFolders(node.children, out);
  }
  return out;
}

/**
 * 深拷贝并固定侧栏文件夹行为：
 * - 去掉 root，避免 TreeContext 按路径把 sidebar 收窄到单个模块
 * - defaultOpen: true + collapsible: false，保证领域模块树始终完整展开
 */
function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    if (node.type !== 'folder') return node;
    return {
      ...node,
      root: false,
      defaultOpen: true,
      collapsible: false,
      children: normalizeNodes(node.children),
    };
  });
}

function childrenWithIndex(folder: Folder): Node[] {
  const children = [...folder.children];
  const index = folder.index as Item | undefined;
  if (!index?.url) return children;
  const exists = children.some(
    (child) => child.type === 'page' && child.url === index.url,
  );
  if (!exists) children.unshift(index);
  return children;
}

function folderToRoot(folder: Folder): PageTreeRoot {
  const ref = folderRefParts(folder)?.join('/') ?? 'domain';
  return {
    $id: folder.$id ?? `root:${ref}`,
    name: folder.name,
    description: folder.description,
    children: normalizeNodes(childrenWithIndex(folder)),
    $ref: folder.$ref,
  };
}

function normalizeRoot(tree: PageTreeRoot): PageTreeRoot {
  return {
    ...tree,
    children: normalizeNodes(tree.children),
  };
}

/**
 * 按路由 slug 选取侧栏 tree：始终使用**领域级** root。
 *
 * 例如 `/docs/engineering` 与 `/docs/engineering/webpack/知识梳理`
 * 应显示同一棵工程实践领域树（webpack / node / git / …），而不是只剩当前模块。
 *
 * 同时去掉子文件夹的 `root`，避免 fumadocs TreeContext 在深层路径上再次收窄。
 */
export function pickSidebarTree(
  fullTree: PageTreeRoot,
  slug?: string[],
): PageTreeRoot {
  if (!slug || slug.length === 0) return normalizeRoot(fullTree);

  const parts = normalizeSlug(slug);
  const roots = collectRootFolders(fullTree.children);

  // 取与 slug 前缀匹配的、最短的 root folder（领域优先于模块）
  let best: Folder | null = null;
  let bestLen = Number.POSITIVE_INFINITY;
  for (const folder of roots) {
    const ref = folderRefParts(folder);
    if (!ref || ref.length === 0) continue;
    if (ref.length > parts.length) continue;
    const matched = ref.every((seg, i) => seg === parts[i]);
    if (!matched) continue;
    if (ref.length < bestLen) {
      best = folder;
      bestLen = ref.length;
    }
  }

  if (!best) return normalizeRoot(fullTree);
  return folderToRoot(best);
}
