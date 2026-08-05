export type DocChatContext = {
  /** summaries / API 使用的文档路径键，如 /react/react16.md */
  pagePath: string;
  moduleKey?: string;
  title?: string;
  tags?: string[];
  /** 当前页正文（调用方可从 DOM 提取后传入） */
  content?: string;
  /** 覆盖默认流式 URL */
  streamUrl?: string;
  /** 覆盖 summaries JSON 地址 */
  summariesUrl?: string;
};
