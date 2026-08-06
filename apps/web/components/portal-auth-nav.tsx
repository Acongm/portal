'use client';

import { AuthAccountButton } from '@acongm/auth-client';

/** Fumadocs 顶栏登录入口 */
export function PortalAuthNav() {
  return (
    <div className="portal-auth-nav">
      <AuthAccountButton variant="nav" />
    </div>
  );
}
