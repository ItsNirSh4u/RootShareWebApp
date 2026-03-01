import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatEvent } from './enums/chat-event.enum';
import { MessageDocument } from './schemas/message.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }
      const payload = await this.jwtService.verify(token);
      client.data.userId = payload.sub;
      this.logger.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch {
      this.logger.warn(`Invalid token, disconnecting client: ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(ChatEvent.JOIN_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    this.toggleRoom(client, data.roomId, 'join');
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(ChatEvent.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    this.toggleRoom(client, data.roomId, 'leave');
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(ChatEvent.SEND_MESSAGE)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string },
  ): Promise<void> {
    const { chatId, content } = data;
    const userId = client.data.userId;

    const savedMessage: MessageDocument = await this.chatService.createMessage(
      userId,
      chatId,
      content,
    );

    const message = {
      _id: savedMessage._id,
      chatId: chatId,
      senderId: userId,
      content: savedMessage.content,
      timestamp: savedMessage.createdAt,
    };

    this.server.to(chatId).emit(ChatEvent.MESSAGE, message);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(ChatEvent.TYPING)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ): void {
    const { roomId, isTyping } = data;
    client.to(roomId).emit(ChatEvent.TYPING, {
      userId: client.data.userId,
      isTyping,
    });
  }

  emitToRoom(roomId: string, event: string, data: Record<string, unknown>): void {
    this.server.to(roomId).emit(event, data);
  }

  private toggleRoom(client: Socket, roomId: string, action: 'join' | 'leave'): void {
    if (action === 'join') {
      client.join(roomId);
      this.logger.log(`Client ${client.id} joined room ${roomId}`);
      client.to(roomId).emit(ChatEvent.USER_JOINED, {
        userId: client.data.userId,
        roomId,
      });
    } else {
      client.leave(roomId);
      this.logger.log(`Client ${client.id} left room ${roomId}`);
      client.to(roomId).emit(ChatEvent.USER_LEFT, {
        userId: client.data.userId,
        roomId,
      });
    }
  }
}
