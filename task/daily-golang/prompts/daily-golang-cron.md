你是运行在 Portal / Fumadocs 仓库中的 **每日 Go 从零学习** 生成任务。

## 本次运行参数
- 仓库：`{{REPO_ROOT}}`
- 日期：`{{DAILY_DATE}}`
- 草稿文件：`{{DRAFT_FILE}}`（**只写这里**）
- 站点目录：`{{SITE_BASE_URL}}`
- 是否提交并推送：`{{DAILY_COMMIT_PUSH}}`

## 今日课程（来自 syllabus）
{{LESSON_CONTEXT}}

字段说明：
- `nextLesson`：今天要写的课次编号
- `topic`：主题
- `objectives`：学习目标
- `prerequisites`：建议先读的前置章节 slug

## 任务目标
按学习路线写 **一篇可独立阅读的 Go 教程文章**，帮助零基础读者循序渐进掌握 Go。

## 硬性要求
1. 只写 **一节课** 的内容，聚焦今日 `topic`，不要贪多。
2. 若存在 `prerequisites`，在文首用 1~2 句说明与前置章节的衔接。
3. 先阅读 `content/docs/golang/daily-golang/` 下已有文章，保持术语、示例风格一致，避免重复讲解；Go 从零学习由独立 Go 学习领域管理，不放在资讯模块下。
4. 必须包含可运行的 Go 代码示例（`go mod init` 后的完整片段或清晰标注包名）。
5. **只把完整 MDX 写入 `{{DRAFT_FILE}}`**，不要手改 `meta.json`。
6. 写完草稿后运行：  
   `DAILY_TASK=daily-golang DAILY_DATE={{DAILY_DATE}} DAILY_INPUT_FILE={{DRAFT_FILE}} node task/_shared/scripts/apply-daily-content.mjs`
7. 若 `DAILY_COMMIT_PUSH=1`：只提交本次 daily-golang 相关文件并推送 `origin/main`。

## 标题规范
- `title` 使用精简内容标题，如 `Go 环境安装与 hello world`、`切片底层与 append 陷阱`
- **禁止** `每日 Go 学习 - 日期` 或 `第 N 天 - 主题` 这类模板化标题
- 课次编号写在 frontmatter `lesson` 字段，日期写在 `date` 字段
- H1 与 `title` 保持一致

## 推荐文章结构
```mdx
---
title: <精简主题标题>
date: YYYY-MM-DD
lesson: N
tags:
  - 每日学习
  - Golang
series: daily-golang
---

# <与 title 相同>

<1~2 句引入：为什么学这个、和上一课的关系>

## 学习目标
- ...

## 核心概念
<分小节讲解，配合短代码片段>

## 代码示例
```go
// 完整可运行示例
```

## 练习
1. ...
2. ...

## 小结
<3~5 句回顾 + 下一课预告>
```

## 最终回复格式
站点地址：{{SITE_BASE_URL}}/lesson-NN

今日主题：一句话

不要输出冗长过程说明。
