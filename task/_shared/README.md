# task/_shared — 每日收集任务通用框架

多个 `task/<name>/` 定时任务共享此目录的脚本与约定。

## 架构

```text
task/<name>/
  task.json          # 任务配置（路径、校验、skill、prompt）
  prompts/*.md       # Hermes prompt 模板
  scripts/generate*.sh  # 薄封装，调用 _shared/scripts/run-daily-task.sh
  syllabus.json      # （可选）课次型任务的学习路线
  sources.json       # （可选）RSS 来源

task/_shared/
  lib/task-config.mjs
  scripts/
    run-daily-task.sh       # 主入口
    apply-daily-content.mjs # 校验 + 落盘 + 更新 meta.json
    collect-rss-hints.mjs   # 并行 RSS 抓取（72h 过滤）
    commit-daily-content.mjs # 精确 git add/commit/push
```

## 新增一个每日收集系列

1. 在 `content/docs/news/<series>/` 创建 `index.mdx` + `meta.json`
2. 在 `content/docs/news/meta.json` 的 `pages` 中注册
3. 在 `apps/web/config/doc-modules.json` 添加模块
4. 复制 `task/daily-golang/` 或 `task/daily-news/` 为模板，修改 `task.json` 与 prompt
5. 干跑验证：`bash task/<name>/scripts/generate*.sh`

## 环境变量（统一 `DAILY_*` 前缀）

| 变量 | 默认 | 说明 |
|------|------|------|
| `DAILY_DATE` | 今天 | `YYYY-MM-DD` |
| `DAILY_DRY_RUN` | `1` | 只生成 prompt |
| `DAILY_COMMIT_PUSH` | `0` | commit + push |
| `DAILY_RUN_BUILD` | `0` | 建议 0，交给 Vercel |
| `DAILY_RUN_SUMMARIES` | `0` | 建议 0，交给 Vercel |
| `DAILY_FORCE` | `0` | 覆盖已存在文件 |

兼容 `NEWS_*` 旧变量名（daily-news）。

## task.json 字段

| 字段 | 说明 |
|------|------|
| `filename` | `date`（按日期）或 `lesson`（按课次 lesson-01） |
| `contentDir` | MDX 输出目录 |
| `siteBaseUrl` | 站点 URL 前缀 |
| `skill` | Hermes skill（可为 null） |
| `toolsets` | Hermes 工具集 |
| `validation` | 落盘前结构校验规则 |

## Prompt 占位符

- `{{REPO_ROOT}}` `{{DAILY_DATE}}` `{{DRAFT_FILE}}`
- `{{SITE_BASE_URL}}` `{{SOURCE_HINTS}}` `{{LESSON_CONTEXT}}`
- `{{DAILY_COMMIT_PUSH}}` `{{DAILY_RUN_BUILD}}` …

## 落盘

```bash
DAILY_TASK=daily-news \
DAILY_DATE=2026-08-20 \
DAILY_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx \
node task/_shared/scripts/apply-daily-content.mjs
```
