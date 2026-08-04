'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ChatLayoutMode = 'drawer' | 'fullscreen';

type ChatUiContextValue = {
  open: boolean;
  mode: ChatLayoutMode;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setMode: (mode: ChatLayoutMode) => void;
  /** 抽屉退场动画结束后调用，用于移除 html 分栏 class */
  notifyClosed: () => void;
};

const ChatUiContext = createContext<ChatUiContextValue | null>(null);

function syncOpenClass(open: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('acongm-chat-open', open);
}

function syncOverlayLock(open: boolean, mode: ChatLayoutMode) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(
    'acongm-chat-overlay-lock',
    open && mode === 'drawer' && window.innerWidth < 1180,
  );
}

export type ChatUiProviderProps = {
  children: ReactNode;
  /** 默认 drawer；fullscreen 用于独立 chat 页 */
  defaultMode?: ChatLayoutMode;
};

export function ChatUiProvider({
  children,
  defaultMode = 'drawer',
}: ChatUiProviderProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatLayoutMode>(defaultMode);

  const openPanel = useCallback(() => {
    setOpen(true);
    syncOpenClass(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const notifyClosed = useCallback(() => {
    syncOpenClass(false);
    syncOverlayLock(false, mode);
  }, [mode]);

  const togglePanel = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) syncOpenClass(true);
      return next;
    });
  }, []);

  useEffect(() => {
    if (open) {
      syncOpenClass(true);
      syncOverlayLock(true, mode);
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && mode === 'drawer') {
        setOpen(false);
      }
    };
    const onResize = () => syncOverlayLock(open, mode);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open, mode]);

  useEffect(
    () => () => {
      syncOpenClass(false);
      document.body.classList.remove('acongm-chat-overlay-lock');
    },
    [],
  );

  const value = useMemo(
    () => ({
      open,
      mode,
      openPanel,
      closePanel,
      togglePanel,
      setMode,
      notifyClosed,
    }),
    [open, mode, openPanel, closePanel, togglePanel, notifyClosed],
  );

  return (
    <ChatUiContext.Provider value={value}>{children}</ChatUiContext.Provider>
  );
}

export function useChatUi(): ChatUiContextValue {
  const ctx = useContext(ChatUiContext);
  if (!ctx) {
    throw new Error('useChatUi must be used within ChatUiProvider');
  }
  return ctx;
}
