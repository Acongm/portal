'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type DocChatConfigContextValue = {
  enableThinking: boolean;
};

const DocChatConfigContext = createContext<DocChatConfigContextValue>({
  enableThinking: false,
});

export function DocChatConfigProvider({
  enableThinking = false,
  children,
}: {
  enableThinking?: boolean;
  children: ReactNode;
}) {
  return (
    <DocChatConfigContext.Provider value={{ enableThinking }}>
      {children}
    </DocChatConfigContext.Provider>
  );
}

export function useDocChatConfig(): DocChatConfigContextValue {
  return useContext(DocChatConfigContext);
}
