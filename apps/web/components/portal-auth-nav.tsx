import { AuthAccountButton } from '@acongm/auth-client';

/** Fumadocs 顶栏登录入口（图标 + 文案，与详情图标语义一致） */
export function PortalAuthNav() {
  return (
    <div className="portal-auth-nav">
      <AuthAccountButton variant="nav" />
    </div>
  );
}
