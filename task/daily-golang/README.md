# task/daily-golang — 每日 Go 从零学习

按 `syllabus.json` 学习路线，每天生成一篇 Go 教程文章。

## 快速开始

```bash
cd portal
cp task/daily-golang/.env.example task/daily-golang/.env.local

# 干跑
bash task/daily-golang/scripts/generate-daily-golang.sh

# 本地生成
DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=0 bash task/daily-golang/scripts/generate-daily-golang.sh

# 正式定时
DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=1 bash task/daily-golang/scripts/generate-daily-golang.sh
```

## 课次与文件命名

- 正文：`content/docs/golang/daily-golang/lesson-01.mdx`、`lesson-02.mdx` …
- 站点地址：`https://www.acongm.com/docs/golang/daily-golang/lesson-NN`
- 课次由目录中已有文件自动递增，与 `syllabus.json` 的 `lesson` 字段对齐
- frontmatter：`date`（发布日期）、`lesson`（课次）、`title`（精简主题）

## 环境变量

与 `task/daily-news` 相同，使用 `DAILY_*` 前缀。详见 `task/_shared/README.md`。

## 落盘（已有草稿）

```bash
DAILY_TASK=daily-golang \
DAILY_DATE=2026-08-20 \
DAILY_INPUT_FILE=task/daily-golang/tmp/lesson-01.mdx \
node task/_shared/scripts/apply-daily-content.mjs
```

## 目录

- `task.json` — 任务配置
- `syllabus.json` — 20 课学习路线
- `prompts/daily-golang-cron.md` — Hermes prompt
- `scripts/generate-daily-golang.sh` — 入口
