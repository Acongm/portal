import type { Root as PageTreeRoot, Folder, Node } from 'fumadocs-core/page-tree';

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

function folderToRoot(folder: Folder): PageTreeRoot {
  return {
    $id: folder.$id ?? `root:${folderRefParts(folder)?.join('/') ?? 'module'}`,
    name: folder.name,
    description: folder.description,
    children: folder.children,
    $ref: folder.$ref,
  };
}

/**
 * 按路由 slug 选取侧栏 tree，绕开 fumadocs searchPath 对中文 URL 编解码不一致导致的 root 回退。
 *
 * - `/docs/core` → 领域 root（各模块）
 * - `/docs/core/JavaScript/...` → JavaScript 模块 root（仅本模块页面）
 */
export function pickSidebarTree(
  fullTree: PageTreeRoot,
  slug?: string[],
): PageTreeRoot {
  if (!slug || slug.length === 0) return fullTree;

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

  if (!best) return fullTree;
  return folderToRoot(best);
}
