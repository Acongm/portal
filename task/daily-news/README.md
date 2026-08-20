# task/daily-news — 每日资讯定时任务源文件

这个目录把「每日科技动态」的定时任务输入、来源清单、环境变量和本地脚本从 Hermes cron prompt 中沉淀到仓库内，方便本地复现、调试和后续迭代。

## 目录结构

- `.env.example`：本地运行参数示例。复制为 `.env.local` 后修改，不要提交真实本地配置。
- `sources.json`：前端 / DevOps / AI 三类来源清单与抓取注意事项。
- `prompts/daily-news-cron.md`：Hermes 生成日报草稿时使用的主 prompt 模板。
- `lib/`：日期、RSS/Atom、去重、落盘校验的纯函数，供脚本和测试复用。
- `scripts/collect-source-hints.mjs`：并行抓取 RSS/Atom，并生成 source hints，供 prompt 使用。
- `scripts/collect-previous-urls.mjs`：抽取最近一篇已发布日报的标题和来源，写入去重提示。
- `scripts/generate-daily-news.sh`：入口脚本；准备 prompt、必要时调用 `hermes chat`，再由脚本落盘 / 提交。
- `scripts/apply-daily-news.mjs`：把 MDX 草稿写入正式路径并更新 `meta.json` / navbar。
- `tmp/`：本地生成的 prompt/source hints/草稿目录，已加入忽略规则。

## 流水线

1. 若 `HEAD` 里已有当天 MDX，直接跳过（设 `NEWS_FORCE=1` 才重跑）。
2. 若本地已有草稿或未提交正文，跳过 Hermes，只走落盘。
3. 否则并行抓取来源、注入上一期去重提示，再调用 Hermes **只写** `task/daily-news/tmp/YYYY-MM-DD.mdx`。
4. `apply-daily-news.mjs` 校验结构，写入正式 MDX，并更新 `meta.json` / navbar。
5. 可选刷新 summaries；可选本地 `pnpm build`。
6. `NEWS_COMMIT_PUSH=1` 时由脚本只提交日报相关文件并推送，Hermes 不再自己 git。

```bash
cd /Users/acongm/code/github/portal
cp task/daily-news/.env.example task/daily-news/.env.local

# 先干跑：只生成 prompt 与来源提示，不调用模型、不改正文文件。
bash task/daily-news/scripts/generate-daily-news.sh

# 正式本地生成：调用 Hermes 写草稿，脚本落盘；默认不提交推送。
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=0 bash task/daily-news/scripts/generate-daily-news.sh

# 正式定时发布：允许提交推送。本地 build 可关，交给 Vercel。
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=1 bash task/daily-news/scripts/generate-daily-news.sh
```

## 输入参数

主要通过 `task/daily-news/.env.local` 或命令行环境变量传入：

- `NEWS_DATE`：目标日期；留空时用 `NEWS_TZ`（默认 `Asia/Shanghai`）的当天。
- `NEWS_DRY_RUN`：`1` 只生成 prompt；`0` 调用 Hermes 并落盘。
- `NEWS_COMMIT_PUSH`：`1` 由包装脚本提交并推送；`0` 只保留本地变更。
- `NEWS_FORCE`：`1` 即使当天已发布也重新生成。
- `NEWS_RUN_BUILD`：`1` 要求落盘后运行 `pnpm build`。正式定时建议 `0`，由 Vercel 构建。
- `NEWS_RUN_SUMMARIES`：`1` 要求刷新 `summaries-v1.json` / `module-index.json`（需 `AI_API_KEY`）。
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
- `task/daily-news/tmp/previous-YYYY-MM-DD.md`
- `task/daily-news/tmp/prompt-YYYY-MM-DD.md`

## 已有 MDX 草稿的落盘方式

如果日报正文已经由其它工具或人工生成，可只使用 deterministic apply 脚本：

```bash
NEWS_DATE=2026-08-20 \
NEWS_INPUT_FILE=task/daily-news/tmp/2026-08-20.mdx \
node task/daily-news/scripts/apply-daily-news.mjs
```

该脚本会做基础结构检查：frontmatter date、`### 前端` / `### DevOps` / `### AI` / `## 简讯`，以及至少 3 个 `[来源](https://...)` 链接。

## 定时任务

Hermes cron 建议只跑仓库入口，不要把来源清单和落盘步骤再写进 cron 配置：

```text
在 portal 仓库中执行：
NEWS_DRY_RUN=0 NEWS_COMMIT_PUSH=1 bash task/daily-news/scripts/generate-daily-news.sh
最终按脚本输出回复站点地址。
```

当天已发布时脚本会直接退出 0，适合 cron 重试。来源清单、输入输出约定和 prompt 模板都由仓库版本管理。

## 注意事项

- 仓库当前存在与日报无关的大小写路径/脏改动风险；提交由包装脚本只暂存日报相关文件。
- `.env.local` 不应提交，避免把本地模型、token 或实验参数带进仓库。
- OpenAI / Chrome / WebKit 等来源存在抓取不稳定；正式写作仍以 `daily-tech-news-vuepress` skill 的事实边界规则为准。
- 本地测试：`pnpm test:daily-news`。
