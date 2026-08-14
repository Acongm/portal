'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AuthAccountButton, useSession } from '@acongm/auth-client';

export type ChatAuthIdentity = {
  userId: string;
  accessToken: string;
  anonymous: boolean;
};

export type ChatAuthSlotProps = {
  onIdentityChange?: (identity: ChatAuthIdentity | null) => void;
  /** Called after signOut; useSession re-bootstraps anonymous identity. */
  onSignedOut?: () => void;
  menuFooter?: ReactNode;
};

/**
 * Chat v2 identity bridge: Supabase session (including anonymous) is the only
 * principal. No legacy x-client-id / claimAnonymousThreads path.
 */
export function ChatAuthSlot({
  onIdentityChange,
  onSignedOut,
  menuFooter,
}: ChatAuthSlotProps) {
  const { status, error, retry, accessToken, userId, isAnonymous } =
    useSession({ ensureAnonymous: true });
  const onIdentityRef = useRef(onIdentityChange);
  onIdentityRef.current = onIdentityChange;

  useEffect(() => {
    if (!accessToken || !userId) {
      onIdentityRef.current?.(null);
      return;
    }

    onIdentityRef.current?.({
      userId,
      accessToken,
      anonymous: isAnonymous,
    });
  }, [accessToken, userId, isAnonymous]);

  if (status === 'error') {
    return (
      <div className="acongm-chat-auth-error">
        <p>{error || '无法准备访客会话'}</p>
        <button type="button" onClick={retry}>
          重试
        </button>
      </div>
    );
  }

  return (
    <AuthAccountButton
      variant="sidebar"
      ensureAnonymous
      menu
      menuFooter={menuFooter}
      onSignedOut={onSignedOut}
    />
  );
}
