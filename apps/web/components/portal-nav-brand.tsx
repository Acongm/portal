'use client';

import Image from 'next/image';
import { useSession } from '@acongm/auth-client';
import { AuthAccountButton } from '@acongm/auth-client';
import { appName } from '@/lib/shared';

/**
 * 顶栏品牌：未登录显示 logo+站名；登录后 logo 位改为用户首字。
 */
export function PortalNavBrand() {
  const { session, loading, configured } = useSession();
  const loggedIn = Boolean(configured && !loading && session);

  return (
    <span className="portal-nav-brand inline-flex items-center gap-2 font-semibold">
      {loggedIn ? (
        <AuthAccountButton variant="avatar" className="portal-nav-brand__avatar" />
      ) : (
        <Image
          src="/logo.jpg"
          alt=""
          width={28}
          height={28}
          className="rounded-sm"
          priority
        />
      )}
      <span>{appName}</span>
    </span>
  );
}
