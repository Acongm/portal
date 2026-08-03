# portal

acongm Platform v2 文档站 — Next.js + Fumadocs。

## 结构

```
portal/
├── apps/web/          # Next.js 应用（Fumadocs UI）
├── content/docs/      # 文档内容（MDX + meta.json）
├── packages/          # 后续 chat-ui、ui-theme、kb-types
└── scripts/           # 文档迁移脚本
```

## 本地开发

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000/docs

## 文档迁移

从 `Acongm/vuepress` 的 `docs/` 复制到 `content/docs/`（不修改 vuepress 仓库）：

```bash
# 默认从 /tmp/vuepress-src/docs 读取，或指定路径
pnpm migrate:docs
# 或
node scripts/migrate-docs.mjs /path/to/vuepress/docs
```

迁移脚本会：

1. 复制 Markdown，跳过 `.vuepress`
2. `README.md` → `index.mdx`，自动补充 `title` frontmatter
3. 根据 vuepress sidebar 生成各目录 `meta.json`

更新 sidebar 映射时，先重新提取：

```bash
node scripts/extract-sidebar.mjs /path/to/vuepress/docs
```

## Vercel 部署

在 Vercel 项目设置中：

- **Root Directory**: `apps/web`
- 或使用根目录 `vercel.json`（已配置 `pnpm build`）

预览部署会在每次 PR 上自动构建。

## 相关 Issue

- [P1-01] 初始化 portal + Fumadocs 骨架
- [P4-01] 批量迁移 MD + meta.json 脚本
