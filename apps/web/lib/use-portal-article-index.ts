'use client';

import { useEffect, useState } from 'react';
import {
  buildArticleIndex,
  type ArticleIndexEntry,
} from '@acongm/kb-catalog';
import { loadSummaryV1Snapshot } from '@acongm/agent-session-sdk';

const DEFAULT_SUMMARIES_URL =
  process.env.NEXT_PUBLIC_SUMMARIES_URL || '/summaries.v1.json';

/** portal 文档站：加载构建期 summaries 供 @/+ 知识检索 */
export function usePortalArticleIndex(summariesUrl = DEFAULT_SUMMARIES_URL) {
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadSummaryV1Snapshot(summariesUrl)
      .then((snapshot) => {
        if (cancelled) return;
        setArticles(buildArticleIndex(snapshot.files ?? {}));
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [summariesUrl]);

  return { articles, loading };
}
