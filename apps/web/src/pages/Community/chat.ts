import api from '@/lib/api';

export type ChatParticipant = {
  _id: string;
  username: string;
  profileImageUrl?: string;
};

export type IChat = {
  _id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  owner: ChatParticipant | string | null;
  admins: ChatParticipant[];
  participants: ChatParticipant[];
  lastMessage: {
    _id: string;
    content: string;
    senderId: ChatParticipant | string;
    createdAt: string;
  } | null;
  unreadCount: Record<string, number>;
  imageUrl: string | null;
  updatedAt: string;
  createdAt: string;
};

export type IMessage = {
  _id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  likes: string[];
  type?: 'system';
};

export type SocketMessage = {
  _id: unknown;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
};

export type IUser = {
  _id: string;
  username: string;
  profileImageUrl?: string;
};

function resolveParticipant(
  senderId: ChatParticipant | string,
  participants: ChatParticipant[],
): { id: string; name: string; avatar?: string } {
  if (typeof senderId === 'object') {
    return { id: senderId._id, name: senderId.username, avatar: senderId.profileImageUrl };
  }
  const p = participants.find((x) => x._id === String(senderId));
  return { id: String(senderId), name: p?.username ?? 'Unknown', avatar: p?.profileImageUrl };
}

export function mapRestMessage(raw: unknown, participants: ChatParticipant[]): IMessage {
  const r = raw as { _id: string; chatId: string; senderId: ChatParticipant | string; content: string; createdAt: string; likes?: unknown[] };
  const sender = resolveParticipant(r.senderId, participants);
  return { _id: r._id, chatId: r.chatId, senderId: sender.id, senderName: sender.name, senderAvatar: sender.avatar, content: r.content, createdAt: r.createdAt, likes: (r.likes ?? []).map(String) };
}

export function mapSocketMessage(raw: SocketMessage, participants: ChatParticipant[]): IMessage {
  const sender = resolveParticipant(raw.senderId, participants);
  return { _id: String(raw._id), chatId: raw.chatId, senderId: sender.id, senderName: sender.name, senderAvatar: sender.avatar, content: raw.content, createdAt: raw.timestamp, likes: [] };
}

export async function fetchChats(): Promise<IChat[]> {
  const res = await api.get<IChat[]>('/chats');
  return res.data;
}

export async function fetchChatWith(userId: string): Promise<IChat | null> {
  const res = await api.get<IChat | null>(`/chats/with/${userId}`);
  return res.data;
}

export async function createDirectChat(userId: string): Promise<IChat> {
  const res = await api.post<IChat>('/chats', { userId });
  return res.data;
}

export async function fetchMessages(chatId: string, page = 1): Promise<IMessage[]> {
  const res = await api.get<unknown[]>(`/chats/${chatId}/messages`, { params: { page, limit: 30 } });
  return res.data.map((m) => mapRestMessage(m, []));
}

export async function fetchMessagesWithParticipants(chatId: string, participants: ChatParticipant[], page = 1): Promise<IMessage[]> {
  const res = await api.get<unknown[]>(`/chats/${chatId}/messages`, { params: { page, limit: 30 } });
  return res.data.map((m) => mapRestMessage(m, participants)).reverse();
}

export async function markAsRead(chatId: string): Promise<void> {
  await api.post(`/chats/${chatId}/read`);
}

export async function createGroupChat(name: string, userIds: string[], description?: string): Promise<IChat> {
  const res = await api.post<IChat>('/chats/group', { name, userIds, ...(description ? { description } : {}) });
  return res.data;
}

export async function updateDescription(chatId: string, description: string | null): Promise<IChat> {
  const res = await api.patch<IChat>(`/chats/${chatId}/description`, { description: description ?? '' });
  return res.data;
}

export async function toggleMessageLike(chatId: string, messageId: string): Promise<{ _id: string; likes: string[] }> {
  const res = await api.post<{ _id: string; likes: unknown[] }>(`/chats/${chatId}/messages/${messageId}/like`);
  return { _id: res.data._id, likes: res.data.likes.map(String) };
}

export async function addMembers(chatId: string, userIds: string[]): Promise<IChat> {
  const res = await api.post<IChat>(`/chats/${chatId}/members`, { userIds });
  return res.data;
}

export async function removeMember(chatId: string, userId: string): Promise<IChat | null> {
  const res = await api.delete<IChat | null>(`/chats/${chatId}/members`, { data: { userId } });
  return res.data;
}

export async function leaveGroup(chatId: string): Promise<void> {
  await api.post(`/chats/${chatId}/leave`);
}

export async function renameGroup(chatId: string, name: string): Promise<IChat> {
  const res = await api.patch<IChat>(`/chats/${chatId}/name`, { name });
  return res.data;
}

export async function addAdmin(chatId: string, userId: string): Promise<IChat> {
  const res = await api.patch<IChat>(`/chats/${chatId}/admin`, { userId });
  return res.data;
}

export async function removeAdmin(chatId: string, userId: string): Promise<IChat> {
  const res = await api.delete<IChat>(`/chats/${chatId}/admin`, { data: { userId } });
  return res.data;
}

export async function deleteDirectChat(chatId: string): Promise<void> {
  await api.delete(`/chats/${chatId}/direct`);
}

export async function deleteGroup(chatId: string): Promise<void> {
  await api.delete(`/chats/${chatId}`);
}

export async function uploadGroupImage(chatId: string, file: File): Promise<IChat> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<IChat>(`/chats/${chatId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function searchUsers(query: string): Promise<IUser[]> {
  const res = await api.get<IUser[]>('/users/search', { params: { query } });
  return res.data;
}
