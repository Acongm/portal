import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1 gap-4 px-4">
      <h1 className="text-3xl font-bold">acongm</h1>
      <p className="text-fd-muted-foreground max-w-lg">
        前端常用知识、踩坑记录、软件推荐等 — Platform v2 文档站（Next.js + Fumadocs）
      </p>
      <p>
        <Link href="/docs" className="font-medium underline text-fd-primary">
          进入文档
        </Link>
      </p>
    </div>
  );
}
