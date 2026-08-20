# Portal — Cloud Agent Instructions

## 两套构建，不要混用

| 仓库 / 站点 | 部署目标 | 构建入口 | 说明 |
|-------------|----------|----------|------|
| **Acongm/vuepress**（旧） | GitHub Pages `acongm.github.io/vuepress` | 该仓库自己的 GitHub Actions | VuePress 静态站、历史 summaries 流水线、gh-pages 发布 |
| **Acongm/portal**（本仓库） | Vercel → `www.acongm.com` | `apps/web/vercel.json` 的 `buildCommand` | Next.js + Fumadocs；**不在此仓库做 GitHub Pages 发布** |

本仓库 **没有** VuePress 编译、**没有** `vuepress/` 输出目录、**不需要** gh-pages 部署 job。`scripts/vuepress-*.json` 等仅为迁移/导航映射遗留数据，不是运行时构建链。

### Portal 生产构建（Vercel）

Root Directory 必须为 `apps/web`。构建顺序（见 `apps/web/vercel.json`）：

1. `pnpm build:ai:v1` — 增量刷新 `summaries-v1.json` / `module-index.json`（从线上 fallback + 本地 cache 恢复，有 `AI_API_KEY` 时只分析新/变更文档）
2. `pnpm build` — Next.js 生产构建

在 Vercel 项目环境变量中配置（你已配置的三项即可）：

- `AI_API_KEY` — 部署时调用 OpenAI 兼容接口生成摘要
- `AI_MODEL` — 写入快照 `analysis.model`（未设时默认 `deepseek-v4-pro`）
- `AI_BASE_URL` — 兼容 API 根地址（脚本会请求 `{AI_BASE_URL}/chat/completions`）
- `SUMMARIES_FALLBACK_URL`（已在 vercel.json 默认为 `https://www.acongm.com`）

构建日志中应看到：

```text
[generate-summaries-v1] env model=... baseUrl=... apiKey=set restore=local|remote
[ai-v1-stats] {"pendingFiles":34,...}
```

有 Key 时只会对 **Mock 占位摘要** 和 **全新文档** 调用 AI，已有真实摘要会保留（`preserved-until-reanalysis`），避免 Vercel 首次部署重跑 200+ 篇。

未配置 `AI_API_KEY` 时，构建会保留仓库内已提交的 `apps/web/public/summaries-v1.json`，不会清空。

### Portal CI（GitHub Actions）

`.github/workflows/ci.yml` 仅做 **质量门禁**（typecheck、contract tests、`pnpm build` 烟雾），**不替代 Vercel 部署**。不要在 portal 上复制 vuepress 的 Pages / summaries 专用 workflow。

## Git workflow

- **默认合并到 `main`**：验证通过后直接 `git push origin main`。
- 仅当用户明确要求 PR 审查时，才使用 `cursor/*` 分支 + Draft PR。
- 摘要相关改动：跑 `pnpm test:ai-v1`、`pnpm test:ai-path`。

## Daily tasks (`task/`)

资讯领域支持多种 **每日收集** 系列，共享 `task/_shared/` 框架：

| 任务 | 正文路径 | 入口 |
|------|----------|------|
| 科技资讯 | `content/docs/news/daily-news/YYYY-MM-DD.mdx` | `bash task/daily-news/scripts/generate-daily-news.sh` |
| Go 学习 | `content/docs/news/daily-golang/lesson-NN.mdx` | `bash task/daily-golang/scripts/generate-daily-golang.sh` |

- 标题使用**内容精简标题**，日期/课次写在 frontmatter（禁止 `每日科技动态 - 日期` 模板）
- 落盘：`DAILY_TASK=... DAILY_INPUT_FILE=... node task/_shared/scripts/apply-daily-content.mjs`
- 正式定时：`DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=1`，build/summaries 交给 Vercel（`DAILY_RUN_BUILD=0`）

详见 `task/README.md`。

## Summaries v1（本地 / 日报 / Vercel）

- 生成：`pnpm build:ai:v1`
- 预览：`pnpm build:ai:v1:dry-run`
- 产物：`apps/web/public/summaries-v1.json`、`apps/web/public/module-index.json`
- 日报默认 `NEWS_RUN_SUMMARIES=1`，在 `pnpm build` 前刷新摘要（随后 push → Vercel 构建）
