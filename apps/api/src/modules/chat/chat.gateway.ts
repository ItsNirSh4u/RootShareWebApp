import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageDocument } from './schemas/message.schema';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your Android app
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('No token found');
      }
      const payload = await this.jwtService.verify(token);
      client.data.userId = payload.sub;
      console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch (error) {
      console.log('Invalid token, disconnecting client');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
    client.to(roomId).emit('user_joined', {
      userId: client.data.userId,
      roomId,
    });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
    client.to(roomId).emit('user_left', {
      userId: client.data.userId,
      roomId,
    });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
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

    this.server.to(chatId).emit('message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    const { roomId, isTyping } = data;
    client.to(roomId).emit('typing', {
      userId: client.data.userId,
      isTyping,
    });
  }
}
