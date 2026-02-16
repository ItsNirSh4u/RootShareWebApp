import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { RenameGroupDto } from './dto/rename-group.dto';
import { TransferAdminDto } from './dto/transfer-admin.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ChatMemberGuard } from './guards/chat-member.guard';
import { ChatAdminGuard } from './guards/chat-admin.guard';
import { IRequest } from '@/common/interfaces/request.interface';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // --- Direct chat endpoints ---

  @Post()
  createChat(@Body() createChatDto: CreateChatDto, @Req() req: IRequest) {
    const { userId } = createChatDto;
    const currentUserId = req.user.id;
    return this.chatService.createChat(currentUserId, userId);
  }

  @Get()
  getChatsForUser(@Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.chatService.getChatsForUser(currentUserId);
  }

  @Get('with/:userId')
  getChatByParticipant(@Param('userId') userId: string, @Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.chatService.getChatByParticipants(currentUserId, userId);
  }

  // --- Group chat endpoints (must be before :chatId routes) ---

  @Post('group')
  createGroupChat(@Body() dto: CreateGroupChatDto, @Req() req: IRequest) {
    return this.chatService.createGroupChat(req.user.id, dto.name, dto.userIds);
  }

  // --- Parameterized :chatId endpoints ---

  @Get(':chatId/messages')
  loadMessagesById(
    @Param('chatId') chatId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    return this.chatService.loadMessagesById(chatId, getMessagesDto);
  }

  @Post(':chatId/read')
  markAsRead(@Param('chatId') chatId: string, @Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.chatService.markAsRead(chatId, currentUserId);
  }

  @Post(':chatId/members')
  @UseGuards(ChatAdminGuard)
  async addMembers(
    @Param('chatId') chatId: string,
    @Body() dto: AddMembersDto,
    @Req() req: IRequest,
  ) {
    const chat = await this.chatService.addMembers(chatId, dto.userIds);
    this.chatGateway.emitToRoom(chatId, 'member_added', {
      chatId,
      addedUserIds: dto.userIds,
      addedBy: req.user.id,
    });
    return chat;
  }

  @Delete(':chatId/members')
  @UseGuards(ChatAdminGuard)
  async removeMember(
    @Param('chatId') chatId: string,
    @Body() dto: RemoveMemberDto,
    @Req() req: any,
  ) {
    const result = await this.chatService.removeMember(req.chat, dto.userId);
    this.chatGateway.emitToRoom(chatId, 'member_removed', {
      chatId,
      removedUserId: dto.userId,
      removedBy: req.user.id,
    });
    return result;
  }

  @Post(':chatId/leave')
  @UseGuards(ChatMemberGuard)
  async leaveGroup(
    @Param('chatId') chatId: string,
    @Req() req: any,
  ) {
    const result = await this.chatService.leaveGroup(req.chat, req.user.id);
    this.chatGateway.emitToRoom(chatId, 'member_left', {
      chatId,
      userId: req.user.id,
    });
    return result;
  }

  @Patch(':chatId/name')
  @UseGuards(ChatAdminGuard)
  async renameGroup(
    @Param('chatId') chatId: string,
    @Body() dto: RenameGroupDto,
    @Req() req: IRequest,
  ) {
    const chat = await this.chatService.renameGroup(chatId, dto.name);
    this.chatGateway.emitToRoom(chatId, 'group_renamed', {
      chatId,
      name: dto.name,
      renamedBy: req.user.id,
    });
    return chat;
  }

  @Patch(':chatId/admin')
  @UseGuards(ChatAdminGuard)
  async transferAdmin(
    @Param('chatId') chatId: string,
    @Body() dto: TransferAdminDto,
  ) {
    const chat = await this.chatService.transferAdmin(chatId, dto.userId);
    this.chatGateway.emitToRoom(chatId, 'admin_transferred', {
      chatId,
      newAdminId: dto.userId,
    });
    return chat;
  }

  @Delete(':chatId')
  @UseGuards(ChatAdminGuard)
  async deleteGroup(@Param('chatId') chatId: string) {
    this.chatGateway.emitToRoom(chatId, 'group_deleted', { chatId });
    await this.chatService.deleteGroup(chatId);
    return { message: 'Group deleted successfully' };
  }
}
