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
  const ref = folderRefParts(folder)?.join('/') ?? 'domain';
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
  let bestLen = Number.POSITIVE_INFINITY;
  for (const folder of roots) {
    const ref = folderRefParts(folder);
    if (!ref || ref.length === 0) continue;
    if (ref.length > parts.length) continue;
    if (!ref.every((seg, i) => seg === parts[i])) continue;
    if (ref.length < bestLen) {
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
      name: '工程实践',
      root: true,
      $ref: { folder: 'engineering' },
      index: {
        type: 'page',
        name: '工程实践',
        url: '/docs/engineering',
      },
      children: [
        {
          type: 'folder',
          name: 'webpack',
          root: true,
          $ref: { folder: 'engineering/webpack' },
          index: {
            type: 'page',
            name: 'webpack',
            url: '/docs/engineering/webpack',
          },
          children: [
            {
              type: 'page',
              name: '知识梳理',
              url: '/docs/engineering/webpack/知识梳理',
            },
            {
              type: 'folder',
              name: 'install',
              defaultOpen: false,
              collapsible: true,
              children: [
                {
                  type: 'page',
                  name: 'pnpm',
                  url: '/docs/engineering/webpack/install/pnpm',
                },
              ],
            },
          ],
        },
        {
          type: 'folder',
          name: 'node',
          root: true,
          $ref: { folder: 'engineering/node' },
          children: [
            { type: 'page', name: 'npm', url: '/docs/engineering/node/npm' },
          ],
        },
        {
          type: 'folder',
          name: 'git',
          root: true,
          $ref: { folder: 'engineering/git' },
          children: [
            {
              type: 'page',
              name: 'command',
              url: '/docs/engineering/git/command',
            },
          ],
        },
      ],
    },
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
            {
              type: 'page',
              name: '闭包',
              url: '/docs/core/JavaScript/经典闭包处理',
            },
          ],
        },
      ],
    },
  ],
};

// 领域首页与模块深页应得到同一棵领域树
const domain = pickSidebarTree(fullTree, ['engineering']);
const deep = pickSidebarTree(fullTree, [
  'engineering',
  'webpack',
  encodeURIComponent('知识梳理'),
]);
const moduleIndex = pickSidebarTree(fullTree, ['engineering', 'webpack']);

assert.equal(domain.name, '工程实践');
assert.equal(deep.name, '工程实践');
assert.equal(moduleIndex.name, '工程实践');
assert.equal(domain.children.length, deep.children.length);
// index + webpack + node + git
assert.equal(domain.children.length, 4);
assert.equal(domain.children[0].url, '/docs/engineering');

const names = (tree) =>
  tree.children.filter((n) => n.type === 'folder').map((n) => n.name);
assert.deepEqual(names(domain), ['webpack', 'node', 'git']);
assert.deepEqual(names(deep), ['webpack', 'node', 'git']);

// 子模块 root 被剥离，避免 TreeContext 再次收窄
for (const folder of deep.children.filter((n) => n.type === 'folder')) {
  assert.equal(folder.root, false);
  assert.equal(folder.defaultOpen, true);
  assert.equal(folder.collapsible, false);
}

const webpack = deep.children.find((n) => n.name === 'webpack');
assert.ok(webpack);
const install = webpack.children.find((n) => n.name === 'install');
assert.ok(install);
assert.equal(install.root, false);
assert.equal(install.collapsible, false);

// 中文深页仍落在领域树
const jsDeep = pickSidebarTree(fullTree, [
  'core',
  'JavaScript',
  encodeURIComponent('经典闭包处理'),
]);
assert.equal(jsDeep.name, '前端核心');
assert.equal(jsDeep.children.length, 1);
assert.equal(jsDeep.children[0].name, 'JavaScript');
assert.equal(jsDeep.children[0].root, false);

console.log('sidebar-tree unit checks passed');
