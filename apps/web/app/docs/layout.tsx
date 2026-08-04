/**
 * docs 段级 layout：具体 DocsLayout 在 [[...slug]]/layout.tsx，
 * 以便根据 slug 选择模块隔离的侧栏 tree。
 */
export default function DocsSegmentLayout({
  children,
}: LayoutProps<'/docs'>) {
  return children;
}
