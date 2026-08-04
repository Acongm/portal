import assert from 'node:assert/strict';

function decodeSeg(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function folderRefParts(folder) {
  const ref = folder.$ref?.folder;
  if (!ref) return null;
  return ref.split('/').filter(Boolean).map(decodeSeg);
}

function collectRootFolders(nodes, out = []) {
  for (const node of nodes) {
    if (node.type !== 'folder') continue;
    if (node.root) out.push(node);
    collectRootFolders(node.children, out);
  }
  return out;
}

function normalizeNodes(nodes) {
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

function childrenWithIndex(folder) {
  const children = [...folder.children];
  const index = folder.index;
  if (!index?.url) return children;
  const exists = children.some(
    (child) => child.type === 'page' && child.url === index.url,
  );
  if (!exists) children.unshift(index);
  return children;
}

function folderToRoot(folder) {
  const ref = folderRefParts(folder)?.join('/') ?? 'module';
  return {
    $id: folder.$id ?? `root:${ref}`,
    name: folder.name,
    description: folder.description,
    children: normalizeNodes(childrenWithIndex(folder)),
    $ref: folder.$ref,
  };
}

function normalizeRoot(tree) {
  return {
    ...tree,
    children: normalizeNodes(tree.children),
  };
}

function pickSidebarTree(fullTree, slug) {
  if (!slug || slug.length === 0) return normalizeRoot(fullTree);
  const parts = slug.map(decodeSeg);
  const roots = collectRootFolders(fullTree.children);
  let best = null;
  let bestLen = -1;
  for (const folder of roots) {
    const ref = folderRefParts(folder);
    if (!ref || ref.length === 0) continue;
    if (ref.length > parts.length) continue;
    if (!ref.every((seg, i) => seg === parts[i])) continue;
    if (ref.length > bestLen) {
      best = folder;
      bestLen = ref.length;
    }
  }
  if (!best) return normalizeRoot(fullTree);
  return folderToRoot(best);
}

const fullTree = {
  name: 'docs',
  children: [
    {
      type: 'folder',
      name: '前端核心',
      root: true,
      $ref: { folder: 'core' },
      children: [
        {
          type: 'folder',
          name: 'JavaScript',
          root: true,
          $ref: { folder: 'core/JavaScript' },
          index: {
            type: 'page',
            name: 'js 基础知识',
            url: '/docs/core/JavaScript',
          },
          children: [
            {
              type: 'page',
              name: '闭包',
              url: '/docs/core/JavaScript/经典闭包处理',
            },
            {
              type: 'folder',
              name: '进阶',
              root: true, // 故意带 root，验证会被剥掉
              defaultOpen: false,
              collapsible: true,
              children: [
                {
                  type: 'page',
                  name: '深层页',
                  url: '/docs/core/JavaScript/进阶/深层页',
                },
              ],
            },
          ],
        },
        {
          type: 'folder',
          name: 'React',
          root: true,
          $ref: { folder: 'core/react' },
          children: [
            { type: 'page', name: 'hooks', url: '/docs/core/react/class-hooks' },
          ],
        },
      ],
    },
  ],
};

const domain = pickSidebarTree(fullTree, ['core']);
assert.equal(domain.name, '前端核心');
assert.equal(domain.children.length, 2);
assert.equal(domain.children[0].root, false);
assert.equal(domain.children[0].defaultOpen, true);
assert.equal(domain.children[0].collapsible, false);

const js = pickSidebarTree(fullTree, [
  'core',
  'JavaScript',
  encodeURIComponent('经典闭包处理'),
]);
assert.equal(js.name, 'JavaScript');
// index 被补进 children
assert.equal(js.children[0].url, '/docs/core/JavaScript');
assert.equal(js.children.length, 3);
const nested = js.children.find((n) => n.type === 'folder' && n.name === '进阶');
assert.ok(nested);
assert.equal(nested.root, false);
assert.equal(nested.defaultOpen, true);
assert.equal(nested.collapsible, false);

const deep = pickSidebarTree(fullTree, [
  'core',
  'JavaScript',
  '进阶',
  '深层页',
]);
assert.equal(deep.name, 'JavaScript');
assert.equal(deep.children.length, 3);
const deepNested = deep.children.find((n) => n.name === '进阶');
assert.equal(deepNested.collapsible, false);
assert.equal(deepNested.defaultOpen, true);

const react = pickSidebarTree(fullTree, ['core', 'react', 'class-hooks']);
assert.equal(react.name, 'React');
assert.equal(react.children.length, 1);

console.log('sidebar-tree unit checks passed');
