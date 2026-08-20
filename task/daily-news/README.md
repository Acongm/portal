# task/daily-news — 每日科技资讯

基于 `task/_shared` 通用框架的定时任务，生成前端 / DevOps / AI 三类科技资讯。

## 快速开始

```bash
cd portal
cp task/daily-news/.env.example task/daily-news/.env.local

# 干跑：只生成 prompt 与来源提示
bash task/daily-news/scripts/generate-daily-news.sh

# 本地生成（不推送）
DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=0 bash task/daily-news/scripts/generate-daily-news.sh

# 正式定时（推送后由 Vercel 构建，不在 cron 里跑 build）
DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=1 bash task/daily-news/scripts/generate-daily-news.sh
```

## 标题规范

- `title` 与 H1 使用**内容精简标题**（如 `Firefox 154 原生化布局，CodeQL 覆盖 Vue`）
- 日期只写在 frontmatter `date` 字段
- 禁止使用 `每日科技动态 - 日期` 固定格式

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `DAILY_DATE` / `NEWS_DATE` | 今天 | 目标日期 `YYYY-MM-DD` |
| `DAILY_DRY_RUN` | `1` | `1` 只生成 prompt |
| `DAILY_COMMIT_PUSH` | `0` | `1` 允许 commit + push |
| `DAILY_RUN_BUILD` | `0` | 建议保持 `0`，交给 Vercel |
| `DAILY_RUN_SUMMARIES` | `0` | 建议保持 `0`，交给 Vercel |
| `DAILY_FORCE` | `0` | `1` 覆盖已存在文件 |
| `HERMES_CMD` | `hermes` | Hermes CLI |

兼容旧变量名：`NEWS_*` 仍可使用。

## 输出

- 正文：`content/docs/news/daily-news/YYYY-MM-DD.mdx`
- 草稿：`task/daily-news/tmp/YYYY-MM-DD.mdx`
- Prompt：`task/daily-news/tmp/prompt-YYYY-MM-DD.md`

## 落盘（已有草稿时）

```bash
DAILY_TASK=daily-news \
DAILY_DATE=2026-08-20 \
DAILY_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx \
node task/_shared/scripts/apply-daily-content.mjs
```

## 目录

- `task.json` — 任务配置（路径、校验、skill）
- `sources.json` — RSS / 搜索来源清单
- `prompts/daily-news-cron.md` — Hermes 主 prompt
- `scripts/generate-daily-news.sh` — 入口（调用 `task/_shared`）
