import { useAuthStore } from '@/stores/auth.store';

export interface IChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const streamChatMessage = async (
  message: string,
  history: IChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const { tokens } = useAuthStore.getState();

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens?.accessToken ?? ''}`,
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit exceeded. Try again later.');
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Failed to get a response.');
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
};
