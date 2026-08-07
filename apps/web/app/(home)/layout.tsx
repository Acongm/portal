import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { HomeContainer } from '@/components/home-container';

export default function Layout({ children }: LayoutProps<'/'>) {
  const base = baseOptions();
  return (
    <HomeLayout
      {...base}
      // 保留 base.slots.themeSwitch（Chat + 登录图标），再叠加首页 container
      slots={{ ...base.slots, container: HomeContainer }}
    >
      {children}
    </HomeLayout>
  );
}
