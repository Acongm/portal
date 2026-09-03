export type AssistantStatus =
  | { type: 'running' }
  | { type: 'complete'; reason?: string }
  | { type: 'incomplete'; reason?: string; error?: unknown }
  | { type: 'requires-action' }
  | undefined;

const FALLBACK_ERROR = '回复失败，请重试。';

function messageFromUnknown(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return null;
}

export function assistantErrorText(status: AssistantStatus): string | null {
  if (!status || status.type !== 'incomplete') return null;
  if (status.reason === 'cancelled') return null;
  return messageFromUnknown(status.error) ?? FALLBACK_ERROR;
}
