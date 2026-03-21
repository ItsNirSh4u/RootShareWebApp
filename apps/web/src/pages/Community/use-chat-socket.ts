import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import type { SocketMessage } from './chat';

type TypingPayload = { userId: string; isTyping: boolean };
export type ChatGroupEvent = { chatId: string; [key: string]: unknown };

const GROUP_EVENTS = [
  'admin_added', 'admin_removed', 'group_renamed',
  'member_added', 'member_removed', 'member_left',
  'group_deleted', 'group_updated', 'message_liked',
] as const;

export const useChatSocket = (
  onMessage: (msg: SocketMessage) => void,
  onTyping: (data: TypingPayload) => void,
  onGroupEvent: (event: string, data: ChatGroupEvent) => void,
) => {
  const socketRef = useRef<Socket | null>(null);
  const { tokens } = useAuthStore();

  useEffect(() => {
    const socket = io({ auth: { token: tokens?.accessToken } });
    socketRef.current = socket;

    socket.on('message', onMessage);
    socket.on('typing', onTyping);

    for (const evt of GROUP_EVENTS) {
      socket.on(evt, (data: ChatGroupEvent) => onGroupEvent(evt, data));
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = (chatId: string) =>
    socketRef.current?.emit('join_room', { roomId: chatId });

  const leaveRoom = (chatId: string) =>
    socketRef.current?.emit('leave_room', { roomId: chatId });

  const sendMessage = (chatId: string, content: string) =>
    socketRef.current?.emit('send_message', { chatId, content });

  const emitTyping = (chatId: string, isTyping: boolean) =>
    socketRef.current?.emit('typing', { roomId: chatId, isTyping });

  return { joinRoom, leaveRoom, sendMessage, emitTyping };
};
