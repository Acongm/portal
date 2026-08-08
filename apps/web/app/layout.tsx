import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ThemeCookieBridge } from '@/components/theme-cookie-bridge';
import { ACONGM_THEME_BOOT_SCRIPT } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'acongm',
    template: '%s | acongm',
  },
  description: '前端常用知识、踩坑记录、软件推荐等',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACONGM_THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <RootProvider
          theme={{
            defaultTheme: 'system',
            enableSystem: true,
          }}
        >
          <ThemeCookieBridge />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
