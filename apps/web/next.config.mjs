import { createMDX } from 'fumadocs-mdx/next';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const registry = require('./config/doc-modules.json');
const withMDX = createMDX();

const frontend = registry.domains.find((d) => d.id === 'frontend');
const frontendFolders = [
  ...(frontend?.categories ?? []).flatMap((c) => c.modules.map((m) => m.folder)),
  ...(frontend?.nestedModules ?? []).map((m) => m.folder),
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    const legacy = frontendFolders.flatMap((folder) => [
      {
        source: `/docs/${folder}`,
        destination: `/docs/frontend/${folder}`,
        permanent: true,
      },
      {
        source: `/docs/${folder}/:path*`,
        destination: `/docs/frontend/${folder}/:path*`,
        permanent: true,
      },
    ]);

    return [
      {
        source: '/docs',
        destination: '/',
        permanent: false,
      },
      ...legacy,
    ];
  },
};

export default withMDX(config);
