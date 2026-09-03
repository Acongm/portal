'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { placeFixedMenu } from '@acongm/auth-client';
import type { KnowledgeRef } from '@acongm/kb-catalog';
import type { KnowledgeSearchHit } from '@acongm/kb-catalog';
import type { KnowledgePickerSource } from './KnowledgeUiContext';

export type KnowledgeMentionMenuProps = {
  open: boolean;
  query: string;
  source?: KnowledgePickerSource;
  hits: KnowledgeSearchHit[];
  onSelect: (ref: KnowledgeRef) => void;
  onClose: () => void;
  anchor?: { top: number; left: number } | null;
};

function titleForSource(source: KnowledgePickerSource): string {
  switch (source) {
    case 'at':
      return '引用知识';
    case 'plus':
      return '关联知识';
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function readComposerTrigger(source: KnowledgePickerSource): DOMRect | null {
  const preferred =
    source === 'plus'
      ? document.querySelector('.acongm-gpt-composer__plus')
      : document.querySelector('.acongm-gpt-composer');
  const el = preferred ?? document.querySelector('.acongm-gpt-composer');
  return el instanceof HTMLElement ? el.getBoundingClientRect() : null;
}

export function KnowledgeMentionMenu({
  open,
  query,
  source = 'at',
  hits,
  onSelect,
  onClose,
  anchor,
}: KnowledgeMentionMenuProps) {
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placed, setPlaced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => hits.slice(0, 12), [hits]);
  const title = titleForSource(source);

  const updatePlacement = useCallback(() => {
    const trigger = anchor
      ? { top: anchor.top, left: anchor.left, width: 1, height: 1 }
      : readComposerTrigger(source);
    if (!trigger) return;
    const panel = panelRef.current?.getBoundingClientRect();
    const next = placeFixedMenu({
      trigger,
      panel: {
        width: panel?.width || 360,
        height: panel?.height || 280,
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      align: 'start',
      prefer: 'above',
    });
    setCoords({ top: next.top, left: next.left });
    setPlaced(true);
  }, [anchor, source]);

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
  }, [open, updatePlacement, visible.length]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(visible.length - 1, 0)));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === 'Enter' && visible[active]) {
        event.preventDefault();
        onSelect(visible[active].ref);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, visible, active, onClose, onSelect]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className="acongm-mention-menu is-fixed"
      style={{
        top: coords.top,
        left: coords.left,
        transform: 'none',
        visibility: placed ? 'visible' : 'hidden',
      }}
      data-source={source}
      role="listbox"
      aria-label={title}
    >
      <div className="acongm-mention-menu__head">
        {title}
        {query ? ` · ${query}` : ''}
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="acongm-mention-menu__empty">无匹配</p>
      ) : (
        <ul>
          {visible.map((hit, index) => (
            <li key={hit.ref.id}>
              <button
                type="button"
                className={index === active ? 'is-active' : undefined}
                onMouseEnter={() => setActive(index)}
                onClick={() => onSelect(hit.ref)}
              >
                <span>{hit.ref.title}</span>
                <small>
                  {hit.ref.level}
                  {hit.subtitle ? ` · ${hit.subtitle}` : ''}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}
