import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Message } from './schemas/message.schema';

interface ChatRequest extends IRequest {
  chat: ChatDocument;
}

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a 1:1 chat' })
  @ApiResponse({ status: 201, description: 'Chat created' })
  createChat(@Body() createChatDto: CreateChatDto, @Req() req: IRequest): Promise<Chat> {
    const { userId } = createChatDto;
    const currentUserId = req.user.id;
    return this.chatService.createChat(currentUserId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  @ApiResponse({ status: 200, description: 'List of chats' })
  getChatsForUser(@Req() req: IRequest): Promise<Chat[]> {
    const currentUserId = req.user.id;
    return this.chatService.getChatsForUser(currentUserId);
  }

  @Get('with/:userId')
  @ApiOperation({ summary: 'Get 1:1 chat with a specific user' })
  @ApiParam({ name: 'userId', description: 'The other participant user ID' })
  @ApiResponse({ status: 200, description: 'Chat found or null' })
  getChatByParticipant(@Param('userId') userId: string, @Req() req: IRequest): Promise<Chat | null> {
    const currentUserId = req.user.id;
    return this.chatService.getChatByParticipants(currentUserId, userId);
  }

  @Post('group')
  @ApiOperation({ summary: 'Create a group chat' })
  @ApiResponse({ status: 201, description: 'Group chat created' })
  createGroupChat(@Body() dto: CreateGroupChatDto, @Req() req: IRequest): Promise<ChatDocument> {
    return this.chatService.createGroupChat(req.user.id, dto.name, dto.userIds);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get paginated messages for a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of messages' })
  loadMessagesById(
    @Param('chatId') chatId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<Message[]> {
    return this.chatService.loadMessagesById(chatId, getMessagesDto);
  }

  @Post(':chatId/read')
  @ApiOperation({ summary: 'Mark chat messages as read' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Marked as read' })
  markAsRead(@Param('chatId') chatId: string, @Req() req: IRequest): Promise<void> {
    const currentUserId = req.user.id;
    return this.chatService.markAsRead(chatId, currentUserId);
  }

  @Post(':chatId/members')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Add members to a group chat (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Members added' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addMembers(
    @Param('chatId') chatId: string,
    @Body() dto: AddMembersDto,
    @Req() req: IRequest,
  ): Promise<ChatDocument> {
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
  @ApiOperation({ summary: 'Remove a member from a group chat (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(
    @Param('chatId') chatId: string,
    @Body() dto: RemoveMemberDto,
    @Req() req: ChatRequest,
  ): Promise<ChatDocument | null> {
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
  @ApiOperation({ summary: 'Leave a group chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Left group' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async leaveGroup(
    @Param('chatId') chatId: string,
    @Req() req: ChatRequest,
  ): Promise<ChatDocument | null> {
    const result = await this.chatService.leaveGroup(req.chat, req.user.id);
    this.chatGateway.emitToRoom(chatId, 'member_left', {
      chatId,
      userId: req.user.id,
    });
    return result;
  }

  @Patch(':chatId/name')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Rename a group chat (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Group renamed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async renameGroup(
    @Param('chatId') chatId: string,
    @Body() dto: RenameGroupDto,
    @Req() req: IRequest,
  ): Promise<ChatDocument> {
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
  @ApiOperation({ summary: 'Transfer admin role to another member (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Admin transferred' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async transferAdmin(
    @Param('chatId') chatId: string,
    @Body() dto: TransferAdminDto,
  ): Promise<ChatDocument> {
    const chat = await this.chatService.transferAdmin(chatId, dto.userId);
    this.chatGateway.emitToRoom(chatId, 'admin_transferred', {
      chatId,
      newAdminId: dto.userId,
    });
    return chat;
  }

  @Delete(':chatId')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Delete a group chat (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Group deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteGroup(@Param('chatId') chatId: string): Promise<{ message: string }> {
    this.chatGateway.emitToRoom(chatId, 'group_deleted', { chatId });
    await this.chatService.deleteGroup(chatId);
    return { message: 'Group deleted successfully' };
  }
}
