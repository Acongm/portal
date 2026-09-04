export type MentionPanelHit = {
  title: string;
  subtitle?: string;
};

export function mentionPanelMeasureKey(
  query: string,
  hits: readonly MentionPanelHit[],
): string {
  return [query, ...hits.map((hit) => `${hit.title}\0${hit.subtitle ?? ''}`)].join(
    '\n',
  );
}
