import type { ChatV2Message } from '@acongm/kb-types';

export function selectActiveChatBranch(
  messages: readonly ChatV2Message[],
  headMessageId?: string,
): ChatV2Message[] {
  if (messages.length === 0) return [];
  const byId = new Map(messages.map((message) => [message.id, message]));
  const head = headMessageId ? byId.get(headMessageId) : messages[messages.length - 1];
  if (!head) return [];
  const branch: ChatV2Message[] = [];
  const visited = new Set<string>();
  let current: ChatV2Message | undefined = head;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    branch.push(current);
    current = current.parentMessageId ? byId.get(current.parentMessageId) : undefined;
  }
  return branch.reverse();
}
