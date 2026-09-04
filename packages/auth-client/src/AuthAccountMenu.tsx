'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { getAuthBaseUrl } from './client';
import { placeFixedMenu } from './placeFixedMenu';

function avatarChar(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'U';
  const local = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  return Array.from(local)[0]?.toUpperCase() || 'U';
}

function UserAvatar({
  label,
  src,
  className,
}: {
  label: string;
  src: string | null;
  className?: string;
}) {
  const mark = avatarChar(label);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar URL
      <img
        className={className ?? 'acongm-auth-avatar'}
        src={src}
        alt=""
        width={28}
        height={28}
        referrerPolicy="no-referrer"
        decoding="async"
      />
    );
  }
  return (
    <span className={className ?? 'acongm-auth-avatar'} aria-hidden>
      {mark}
    </span>
  );
}

export type AuthAccountMenuProps = {
  label: string;
  photo: string | null;
  email: string | null;
  variant: 'nav' | 'sidebar' | 'icon' | 'avatar';
  className?: string;
  onLogout: () => void;
  /** e.g. theme toggle below menu actions */
  menuFooter?: ReactNode;
};

export function AuthAccountMenu({
  label,
  photo,
  email,
  variant,
  className,
  onLogout,
  menuFooter,
}: AuthAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const title =
    email && email !== label ? `${label} · ${email}` : label;
  const accountBase = `${getAuthBaseUrl().replace(/\/$/, '')}/account`;

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const panel = panelRef.current?.getBoundingClientRect();
    const next = placeFixedMenu({
      trigger,
      panel: {
        width: panel?.width || 192,
        height: panel?.height || 200,
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      align: variant === 'sidebar' ? 'start' : 'end',
      prefer: 'auto',
    });
    setCoords({ top: next.top, left: next.left });
    setPlaced(true);
  }, [variant]);

  useLayoutEffect(() => {
    if (!open) {
      setPlaced(false);
      return;
    }
    updatePlacement();
    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, updatePlacement, menuFooter]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerClass =
    variant === 'icon' || variant === 'avatar'
      ? className ?? 'acongm-auth-icon-btn'
      : className ?? 'acongm-auth-menu-trigger';

  return (
    <div
      ref={rootRef}
      className="acongm-auth-menu"
      data-variant={variant}
      data-open={open ? 'true' : 'false'}
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={title}
        onClick={() => setOpen((value) => !value)}
      >
        {variant === 'icon' || variant === 'avatar' ? (
          photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="acongm-auth-icon-btn__photo"
              src={photo}
              alt=""
              width={22}
              height={22}
              referrerPolicy="no-referrer"
              decoding="async"
            />
          ) : (
            <span className="acongm-auth-icon-btn__mark" aria-hidden>
              {avatarChar(label)}
            </span>
          )
        ) : (
          <>
            <UserAvatar label={label} src={photo} />
            <div className="acongm-auth-user__meta">
              <span className="acongm-auth-user__name" title={title}>
                {label}
              </span>
              {email && email !== label ? (
                <span className="acongm-auth-user__account" title={email}>
                  {email}
                </span>
              ) : null}
            </div>
            <span className="acongm-auth-menu-trigger__chevron" aria-hidden>
              ▾
            </span>
          </>
        )}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={menuId}
              role="menu"
              className="acongm-auth-menu__panel is-fixed"
              style={{
                top: coords.top,
                left: coords.left,
                visibility: placed ? 'visible' : 'hidden',
              }}
              aria-label="账号菜单"
            >
              <div className="acongm-auth-menu__header">
                <span className="acongm-auth-menu__header-name">{label}</span>
                {email ? (
                  <span className="acongm-auth-menu__header-email">{email}</span>
                ) : null}
              </div>
              <a
                role="menuitem"
                className="acongm-auth-menu__item"
                href={accountBase}
                onClick={() => setOpen(false)}
              >
                账号
              </a>
              <a
                role="menuitem"
                className="acongm-auth-menu__item"
                href={`${accountBase}#settings`}
                onClick={() => setOpen(false)}
              >
                设置
              </a>
              <button
                type="button"
                role="menuitem"
                className="acongm-auth-menu__item is-danger"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                退出登录
              </button>
              {menuFooter ? (
                <div className="acongm-auth-menu__footer">{menuFooter}</div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
