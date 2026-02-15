import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IRequest } from '../../common/interfaces/request.interface';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  createOrGetChat(@Body() createChatDto: CreateChatDto, @Req() req: IRequest) {
    const { userId } = createChatDto;
    const currentUserId = req.user.id;
    return this.chatService.createOrGetChat(currentUserId, userId);
  }

  @Get()
  getChatsForUser(@Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.chatService.getChatsForUser(currentUserId);
  }

  @Get(':chatId/messages')
  getMessagesForChat(
    @Param('chatId') chatId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    return this.chatService.getMessagesForChat(chatId, getMessagesDto);
  }

  @Post(':chatId/read')
  markAsRead(@Param('chatId') chatId: string, @Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.chatService.markAsRead(chatId, currentUserId);
  }
}
