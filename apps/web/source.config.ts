import { defineConfig } from 'fumadocs-mdx/config';

export default defineConfig({
  mdxOptions: {
    remarkImageOptions: false,
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultLanguage: 'text',
      langAlias: {
        code: 'text',
        gcode: 'text',
      },
    },
  },
});
