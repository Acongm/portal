import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { HomeNavHeader } from '@/components/home-nav-header';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()} slots={{ header: HomeNavHeader }}>
      {children}
    </HomeLayout>
  );
}
