# portal

acongm Platform v2 文档站 — Next.js + Fumadocs。

## 结构

```
portal/
├── apps/web/          # Next.js 应用（Fumadocs UI）
├── content/docs/      # 文档内容（MDX + meta.json）
├── packages/
│   ├── kb-types/      # @acongm/kb-types — ChatV1 / SummariesV1 契约
│   ├── ui-theme/      # @acongm/ui-theme — Codex 主题 CSS 变量
│   └── chat-ui/       # @acongm/chat-ui — ChatDrawer / ChatFullscreen
└── scripts/           # 文档迁移脚本
```

## 本地开发

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000/docs

## Chat（Phase 1）

- `@acongm/kb-types`：对齐 `/api/ai/v1/chat(/stream)` 与 `summaries-v1.json`
- `@acongm/ui-theme`：chat / dochub 可复用的 CSS token
- `@acongm/chat-ui`：`ChatDrawer` + `ChatFullscreen` + 流式对话 / 停止重试
- `apps/web`：`DocChatEmbed` 按路由绑定 `pagePath` / `moduleKey`（不跳转独立 chat）
- 同源代理：`POST /api/ai/v1/chat/stream` → `api.acongm.com`

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

## Vercel 部署（线上预览）

### 一键导入

1. 打开 [Vercel 导入 portal 仓库](https://vercel.com/new/clone?repository-url=https://github.com/Acongm/portal)
2. **Root Directory** 设为 `apps/web`（必须）
3. Framework 会自动识别为 Next.js；`apps/web/vercel.json` 已配置 monorepo 安装/构建命令
4. 点击 Deploy，完成后访问预览 URL 的 `/docs` 路径

### 已连接仓库时

推送 `main` 分支会自动触发 Preview/Production 部署（需在 Vercel 项目设置中 Root Directory = `apps/web`）。

### 本地 CLI（可选）

```bash
# 在仓库根目录执行，需先 vercel login
npx vercel link --cwd apps/web
npx vercel --cwd apps/web
```

## 相关 Issue

- [P1-02] packages/ui-theme（Codex 主题）
- [P1-03] packages/chat-ui（ChatDrawer / ChatFullscreen）
- [P1-04] packages/kb-types
- [P1-10] ChatDrawer embed 接入文档页
- [P4-04] ChatDrawer 绑定文档 context
