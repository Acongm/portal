/**
 * docs 段级 layout：具体 DocsLayout 在 [[...slug]]/layout.tsx，
 * 以便根据 slug 选择领域级侧栏 tree（领域首页与深页一致）。
 */
export default function DocsSegmentLayout({
  children,
}: LayoutProps<'/docs'>) {
  return children;
}
