# task/ — 定时收集任务

本目录存放可由 **Hermes cron** 或本地脚本触发的每日收集任务。

## 现有任务

| 任务 | 入口 | 内容目录 |
|------|------|----------|
| [daily-news](daily-news/) | `bash task/daily-news/scripts/generate-daily-news.sh` | `content/docs/news/daily-news/` |
| [daily-golang](daily-golang/) | `bash task/daily-golang/scripts/generate-daily-golang.sh` | `content/docs/news/daily-golang/` |

共享框架见 [_shared/README.md](_shared/README.md)。

## Hermes 定时示例

```text
# 每日科技资讯
cd <portal> && DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=1 bash task/daily-news/scripts/generate-daily-news.sh

# 每日 Go 学习
cd <portal> && DAILY_DRY_RUN=0 DAILY_COMMIT_PUSH=1 bash task/daily-golang/scripts/generate-daily-golang.sh
```

正式环境建议 `DAILY_RUN_BUILD=0`、`DAILY_RUN_SUMMARIES=0`，由 Vercel 构建。
