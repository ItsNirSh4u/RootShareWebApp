import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface IChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface IChatDisplayMessage extends IChatMessage {
  imageUrl?: string;
}

const chatFetch = (message: string, history: IChatMessage[], signal?: AbortSignal): Promise<Response> => {
  const { tokens } = useAuthStore.getState();
  return fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens?.accessToken ?? ''}`,
    },
    body: JSON.stringify({ message, history }),
    signal,
  });
};

export const streamChatMessage = async (
  message: string,
  history: IChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> => {
  let res = await chatFetch(message, history, signal);

  if (res.status === 401) {
    await api.get('/auth/me').catch(() => null);
    res = await chatFetch(message, history, signal);
  }

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

export const identifyPlant = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.postForm<{ result: string }>('/ai/identify', form);
  return data.result;
};
