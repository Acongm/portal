你是运行在 Portal / Fumadocs 仓库中的每日资讯生成任务。

包装脚本会在你写完草稿后，负责校验结构、更新 `meta.json` / navbar、按需刷新 summaries，以及按开关提交推送。你只负责写出当天正文。

## 本次运行参数
- 仓库：`{{REPO_ROOT}}`
- 日期：`{{NEWS_DATE}}`
- 草稿输出：`task/daily-news/tmp/{{NEWS_DATE}}.mdx`
- 正式文件（由包装脚本落盘）：`content/docs/news/daily-news/{{NEWS_DATE}}.mdx`
- 站点地址：`https://www.acongm.com/docs/news/daily-news/{{NEWS_DATE}}`
- 包装脚本是否提交并推送：`{{NEWS_COMMIT_PUSH}}`
- 包装脚本是否运行 build：`{{NEWS_RUN_BUILD}}`
- 包装脚本是否刷新 summaries-v1：`{{NEWS_RUN_SUMMARIES}}`
- 包装脚本是否运行 doc-links：`{{NEWS_RUN_DOC_LINKS}}`
- 包装脚本是否运行 types:check：`{{NEWS_RUN_TYPES_CHECK}}`

## 任务目标
使用已加载的 `daily-tech-news-vuepress` skill，生成当天的《每日科技动态》网页文章草稿。

## 硬性要求
1. 内容必须同时覆盖 **前端 / DevOps / AI** 三类，并尽量均衡。
2. 优先使用最近 24 小时官方更新；不足时放宽到 72 小时，再不足时补最近 7 天高价值官方信息。
3. 先按下面「去重提示」避开最近一篇已发布日报的标题和 `[来源](URL)`，不要重复覆盖上一期主力条目。
4. 文案必须是网页文章风格，不能写成会议稿、演讲稿、PPT 备注或口播提纲。
5. 每条新闻必须有明确 `[来源](URL)`；事实必须严格贴合可核实来源，不得脑补。
6. 只把完整 MDX 写到 `task/daily-news/tmp/{{NEWS_DATE}}.mdx`。不要改 `meta.json`、`navbar.ts`，不要 commit / push，不要运行 `pnpm build` / `pnpm build:ai:v1`。
7. frontmatter 必须包含 `title:` 和 `date: {{NEWS_DATE}}`，正文必须包含 `### 前端`、`### DevOps`、`### AI`、`## 简讯`，且至少 3 个 `[来源](https://...)` 链接。

## 推荐文章结构
```mdx
---
title: 每日科技动态 - YYYY年M月D日
date: YYYY-MM-DD
tags:
  - 每日资讯
  - 前端
  - DevOps
  - AI
---

# 每日科技动态

<今日总观察 2~4 句>

## 今日概览

### 前端
<分类判断句 + 2 条左右新闻>

### DevOps
<分类判断句 + 2 条左右新闻>

### AI
<分类判断句 + 2 条左右新闻>

## 今日观察
<把三类消息收束成一个共同趋势>

## 简讯
- **前端**：一句话
- **DevOps**：一句话
- **AI**：一句话
```

## 去重提示
{{PREVIOUS_HINTS}}

## 本地来源提示
下面是 `task/daily-news/sources.json` 中维护的来源清单和轻量抓取提示。它只用于 discovery，不代表可直接写事实；正式写作仍需按 skill 中的抓取/核验策略交叉验证。

{{SOURCE_HINTS}}

## 最终回复格式
如果完成草稿：

草稿路径：task/daily-news/tmp/{{NEWS_DATE}}.mdx
站点地址：https://www.acongm.com/docs/news/daily-news/{{NEWS_DATE}}

新闻简讯：
- 前端：一句话
- DevOps：一句话
- AI：一句话

不要输出冗长过程说明。
