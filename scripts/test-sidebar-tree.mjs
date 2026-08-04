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

function pickSidebarTree(fullTree, slug) {
  if (!slug || slug.length === 0) return fullTree;
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
  if (!best) return fullTree;
  return {
    $id: best.$id,
    name: best.name,
    children: best.children,
  };
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
          children: [
            { type: 'page', name: 'index', url: '/docs/core/JavaScript' },
            {
              type: 'page',
              name: '闭包',
              url: '/docs/core/JavaScript/经典闭包处理',
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

const js = pickSidebarTree(fullTree, [
  'core',
  'JavaScript',
  encodeURIComponent('经典闭包处理'),
]);
assert.equal(js.name, 'JavaScript');
assert.equal(js.children.length, 2);

const react = pickSidebarTree(fullTree, ['core', 'react', 'class-hooks']);
assert.equal(react.name, 'React');
assert.equal(react.children.length, 1);

console.log('sidebar-tree unit checks passed');
