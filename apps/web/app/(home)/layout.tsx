import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { HomeContainer } from '@/components/home-container';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()} slots={{ container: HomeContainer }}>
      {children}
    </HomeLayout>
  );
}
