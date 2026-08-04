import { createMDX } from 'fumadocs-mdx/next';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const registry = require('./config/doc-modules.json');
const withMDX = createMDX();

const moduleMap = [];
for (const domain of registry.domains) {
  for (const mod of [
    ...(domain.categories ?? []).flatMap((c) => c.modules),
    ...(domain.nestedModules ?? []),
  ]) {
    moduleMap.push({ domainId: domain.id, folder: mod.folder });
  }
}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@acongm/chat-ui', '@acongm/ui-theme', '@acongm/kb-types'],
  async redirects() {
    const byFolder = moduleMap.flatMap(({ domainId, folder }) => [
      {
        source: `/docs/${folder}`,
        destination: `/docs/${domainId}/${folder}`,
        permanent: true,
      },
      {
        source: `/docs/${folder}/:path*`,
        destination: `/docs/${domainId}/${folder}/:path*`,
        permanent: true,
      },
      // 兼容短暂存在的 /docs/frontend/<module>
      {
        source: `/docs/frontend/${folder}`,
        destination: `/docs/${domainId}/${folder}`,
        permanent: true,
      },
      {
        source: `/docs/frontend/${folder}/:path*`,
        destination: `/docs/${domainId}/${folder}/:path*`,
        permanent: true,
      },
    ]);

    return [
      {
        source: '/docs',
        destination: '/',
        permanent: false,
      },
      {
        source: '/docs/frontend',
        destination: '/docs/core',
        permanent: true,
      },
      {
        source: '/docs/news/mark',
        destination: '/docs/career/mark',
        permanent: true,
      },
      {
        source: '/docs/news/mark/:path*',
        destination: '/docs/career/mark/:path*',
        permanent: true,
      },
      ...byFolder,
    ];
  },
};

export default withMDX(config);
