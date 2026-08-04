import { getPageImageUrl, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { shouldSuppressLeadingH1, withSuppressLeadingH1 } from '@/lib/mdx-page';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const suppressH1 = shouldSuppressLeadingH1(params.slug);
  const mdxComponents = withSuppressLeadingH1(
    getMDXComponents({
      a: createRelativeLink(source, page),
    }),
    suppressH1,
  );

  return (
    <DocsPage
      toc={page.data.toc}
      // 默认全宽模式：正文更宽；仍保留右侧 TOC（可用 frontmatter full: false 关闭）
      full={page.data.full ?? true}
      tableOfContent={{
        enabled: true,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={mdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
