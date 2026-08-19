# task/daily-news — 每日资讯定时任务源文件

这个目录把「每日科技动态」的定时任务输入、来源清单、环境变量和本地脚本从 Hermes cron prompt 中沉淀到仓库内，方便本地复现、调试和后续迭代。

## 目录结构

- `.env.example`：本地运行参数示例。复制为 `.env.local` 后修改，不要提交真实本地配置。
- `sources.json`：前端 / DevOps / AI 三类来源清单与抓取注意事项。
- `prompts/daily-news-cron.md`：Hermes 生成日报时使用的主 prompt 模板。
- `scripts/collect-source-hints.mjs`：轻量抓取 RSS，并生成 source hints，供 prompt 使用。
- `scripts/generate-daily-news.sh`：入口脚本；加载 `task/daily-news/` 下环境变量，生成 prompt，必要时调用 `hermes chat`。
- `scripts/apply-daily-news.mjs`：当已有 MDX 草稿时，将草稿写入正式路径并更新 `meta.json` / navbar。
- `tmp/`：本地生成的 prompt/source hints/草稿目录，已加入忽略规则。

## 快速开始

```bash
cd /Users/acongm/code/github/portal
cp task/daily-news/.env.example task/daily-news/.env.local

# 先干跑：只生成 prompt 与来源提示，不调用模型、不改正文文件。
bash task/daily-news/scripts/generate-daily-news.sh

# 正式本地生成：调用 Hermes，生成日报文件；默认不提交推送。
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=0 bash task/daily-news/scripts/generate-daily-news.sh

# 正式定时发布模式：允许提交推送，并要求 build。
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=1 NEWS_RUN_BUILD=1 bash task/daily-news/scripts/generate-daily-news.sh
```

## 输入参数

主要通过 `task/daily-news/.env.local` 或命令行环境变量传入：

- `NEWS_DATE`：目标日期，默认 `date +%F`。
- `NEWS_DRY_RUN`：`1` 只生成 prompt；`0` 调用 Hermes。
- `NEWS_COMMIT_PUSH`：`1` 允许生成任务提交并推送；`0` 只保留本地变更。
- `NEWS_RUN_BUILD`：`1` 要求生成后运行 `pnpm build`。
- `NEWS_RUN_DOC_LINKS`：`1` 要求运行 `pnpm test:doc-links`。
- `NEWS_RUN_TYPES_CHECK`：`1` 要求运行 `pnpm types:check`。
- `HERMES_CMD`：Hermes CLI 命令，默认 `hermes`。
- `HERMES_PROVIDER` / `HERMES_MODEL`：可选模型覆盖。
- `NEWS_INPUT_FILE`：已有 MDX 草稿路径，用于 `apply-daily-news.mjs`。

## 输出文件

正式日报输出位置：

- MDX：`content/docs/news/daily-news/YYYY-MM-DD.mdx`
- 导航索引：`content/docs/news/daily-news/meta.json`
- 顶部导航：`apps/web/lib/navbar.ts`
- 站点 URL：`https://www.acongm.com/docs/news/daily-news/YYYY-MM-DD`

干跑输出：

- `task/daily-news/tmp/source-hints-YYYY-MM-DD.md`
- `task/daily-news/tmp/prompt-YYYY-MM-DD.md`

## 已有 MDX 草稿的落盘方式

如果日报正文已经由其它工具或人工生成，可只使用 deterministic apply 脚本：

```bash
NEWS_DATE=2026-08-20 \
NEWS_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx \
node task/daily-news/scripts/apply-daily-news.mjs
```

该脚本会做基础结构检查：frontmatter date、`### 前端` / `### DevOps` / `### AI` / `## 简讯`，以及至少 3 个 `[来源](https://...)` 链接。

## 定时任务迁移建议

当前 Hermes cron 仍可继续加载 `daily-tech-news-vuepress` skill。后续如果要把 cron prompt 简化，可把定时任务改成：

```text
在 /Users/acongm/code/github/portal 中执行：
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=1 NEWS_RUN_BUILD=1 bash task/daily-news/scripts/generate-daily-news.sh
最终按脚本/Hermes 输出回复站点地址与三行简讯。
```

这样每日资讯的来源清单、输入输出约定和 prompt 模板都由仓库版本管理，而不是散落在 cron 配置里。

## 注意事项

- 仓库当前存在与日报无关的大小写路径/脏改动风险；提交前必须只暂存本次相关文件。
- `.env.local` 不应提交，避免把本地模型、token 或实验参数带进仓库。
- OpenAI / Chrome / WebKit 等来源存在抓取不稳定；正式写作仍以 `daily-tech-news-vuepress` skill 的事实边界规则为准。
