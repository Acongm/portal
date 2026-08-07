'use client';

import Image from 'next/image';
import { appName } from '@/lib/shared';

/**
 * 顶栏品牌：logo + 站名（登录状态统一在右上角图标区表现）。
 */
export function PortalNavBrand() {
  return (
    <span className="portal-nav-brand inline-flex items-center gap-2 font-semibold">
      <Image
        src="/logo.jpg"
        alt=""
        width={28}
        height={28}
        className="rounded-sm"
        priority
      />
      <span>{appName}</span>
    </span>
  );
}
