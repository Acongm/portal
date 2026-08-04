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

/** folder.$ref.folder 形如 `core/JavaScript` */
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
 * - 去掉 root，避免 TreeContext 在深层路径上再次把 sidebar root 收窄到子目录
 * - defaultOpen: true + collapsible: false，保证模块树始终完整展开可见
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
  const ref = folderRefParts(folder)?.join('/') ?? 'module';
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
 * 按路由 slug 选取侧栏 tree，绕开 fumadocs searchPath 对中文 URL 编解码不一致导致的 root 回退。
 *
 * - `/docs/core` → 领域 root（各模块，强制展开）
 * - `/docs/core/JavaScript/...` → JavaScript 模块 root（完整模块树，强制展开）
 */
export function pickSidebarTree(
  fullTree: PageTreeRoot,
  slug?: string[],
): PageTreeRoot {
  if (!slug || slug.length === 0) return normalizeRoot(fullTree);

  const parts = normalizeSlug(slug);
  const roots = collectRootFolders(fullTree.children);

  // 取与 slug 前缀匹配的、最长的 root folder（模块优先于领域）
  let best: Folder | null = null;
  let bestLen = -1;
  for (const folder of roots) {
    const ref = folderRefParts(folder);
    if (!ref || ref.length === 0) continue;
    if (ref.length > parts.length) continue;
    const matched = ref.every((seg, i) => seg === parts[i]);
    if (!matched) continue;
    if (ref.length > bestLen) {
      best = folder;
      bestLen = ref.length;
    }
  }

  if (!best) return normalizeRoot(fullTree);
  return folderToRoot(best);
}
