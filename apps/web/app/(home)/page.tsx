import Image from 'next/image';
import Link from 'next/link';
import { docModuleCategories } from '@/lib/modules.registry';

const features = [
  {
    title: '前端常用知识',
    details: 'vue react node css 等',
  },
  {
    title: '踩坑记录',
    details: '各种兼容问题',
  },
  {
    title: '软件推荐',
    details: '记录好用的软件、浏览器扩展、编辑器插件等',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-col items-center justify-center px-6 py-16 text-center md:py-24">
        <Image
          src="/logo.jpg"
          alt="acongm"
          width={120}
          height={120}
          className="mb-6 rounded-lg shadow-sm"
          priority
        />
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">acongm</h1>
        <p className="mb-8 max-w-xl text-fd-muted-foreground">
          前端常用知识、踩坑记录、软件推荐等
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/online-tools"
            className="inline-flex h-10 items-center rounded-lg bg-[#3eaf7c] px-5 text-sm font-medium text-white transition-colors hover:bg-[#359e6c]"
          >
            在线工具
          </Link>
          <Link
            href="/docs/software/cross-platform"
            className="inline-flex h-10 items-center rounded-lg border border-fd-border bg-fd-background px-5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            软件推荐
          </Link>
        </div>
      </section>

      <section className="border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-12 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-fd-border bg-fd-background p-6 text-center shadow-sm"
            >
              <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
              <p className="text-sm text-fd-muted-foreground">{feature.details}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-fd-border">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-8 text-center text-xl font-semibold">文档模块</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {docModuleCategories.map((category) => (
              <div key={category.title}>
                <h3 className="mb-3 text-sm font-medium text-fd-muted-foreground">
                  {category.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {category.modules.map((module) => (
                    <li key={module.folder}>
                      <Link
                        href={`/docs/${module.folder}`}
                        className="text-sm font-medium text-fd-foreground transition-colors hover:text-[#3eaf7c]"
                      >
                        {module.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-fd-border py-6 text-center text-sm text-fd-muted-foreground">
        <a
          href="http://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-fd-foreground"
        >
          粤ICP备16105234号-1
        </a>
        <span className="mx-2">·</span>
        <span>Copyright © 2022-present Acongm</span>
      </footer>
    </div>
  );
}
