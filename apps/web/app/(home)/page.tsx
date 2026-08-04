import Image from 'next/image';
import Link from 'next/link';
import { HomeModuleCards } from '@/components/home-module-cards';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3eaf7c]/10 via-transparent to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center md:py-24">
          <Image
            src="/logo.jpg"
            alt="acongm"
            width={96}
            height={96}
            className="mb-6 rounded-2xl shadow-md ring-1 ring-fd-border"
            priority
          />
          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">acongm</h1>
          <p className="mb-8 max-w-2xl text-base text-fd-muted-foreground md:text-lg">
            按领域阅读：前端核心、工程实践、工具、面试求职、资讯；另有瑜伽与小学教育可扩展空间。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/core"
              className="inline-flex h-10 items-center rounded-full bg-[#3eaf7c] px-6 text-sm font-medium text-white transition-colors hover:bg-[#359e6c]"
            >
              前端核心
            </Link>
            <Link
              href="/docs/engineering"
              className="inline-flex h-10 items-center rounded-full border border-fd-border bg-fd-background px-6 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              工程实践
            </Link>
            <Link
              href="/docs/career"
              className="inline-flex h-10 items-center rounded-full border border-fd-border bg-fd-background px-6 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              面试求职
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">按领域浏览</h2>
          <p className="mt-3 text-sm text-fd-muted-foreground md:text-base">
            领域之间互相隔离；进入详情后可通过侧栏下拉切换领域
          </p>
        </div>
        <HomeModuleCards />
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
