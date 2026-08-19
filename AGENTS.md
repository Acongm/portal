# Portal — Cloud Agent Instructions

## Git workflow

- **默认合并到 `main`**：功能验证通过后，直接在 `main` 上提交并 `git push origin main`，不要长期留在 feature 分支等待人工合并。
- 仅当用户明确要求 PR 审查时，才使用 `cursor/*` 分支 + Draft PR。
- 提交前运行相关测试：`pnpm test:ai-v1`、`pnpm test:ai-path`（摘要流水线变更时）。

## Daily news (`task/daily-news/`)

- 日报正文：`content/docs/news/daily-news/YYYY-MM-DD.mdx`
- 本地入口：`bash task/daily-news/scripts/generate-daily-news.sh`
- 落盘已有草稿：`NEWS_INPUT_FILE=... node task/daily-news/scripts/apply-daily-news.mjs`

## Summaries v1（AI 阅读助手静态摘要）

- 生成：`pnpm build:ai:v1`（需 `AI_API_KEY` 或 `AI_PROVIDER=mock` 本地填充）
- 预览：`pnpm build:ai:v1:dry-run`
- 产物：`apps/web/public/summaries-v1.json`、`apps/web/public/module-index.json`
- 日报任务默认 `NEWS_RUN_SUMMARIES=1`，在 `pnpm build` 前先刷新摘要缓存。
