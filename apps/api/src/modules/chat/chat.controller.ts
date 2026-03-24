import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { RenameGroupDto } from './dto/rename-group.dto';
import { TransferAdminDto } from './dto/transfer-admin.dto';
import { RemoveAdminDto } from './dto/remove-admin.dto';
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ChatMemberGuard } from './guards/chat-member.guard';
import { ChatAdminGuard } from './guards/chat-admin.guard';
import { IRequest } from '@/common/interfaces/request.interface';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Message } from './schemas/message.schema';

const getGroupImagesDir = (): string => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const dir = path.join(uploadPath, 'group-images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const groupImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getGroupImagesDir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `group-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

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
    return this.chatService.createGroupChat(req.user.id, dto.name, dto.userIds, dto.description);
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

  @Post(':chatId/messages/:messageId/like')
  @UseGuards(ChatMemberGuard)
  @ApiOperation({ summary: 'Toggle like on a message' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 201, description: 'Like toggled' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async toggleMessageLike(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Req() req: IRequest,
  ): Promise<Message> {
    const message = await this.chatService.toggleMessageLike(chatId, messageId, req.user.id);
    const likes = (message.likes as unknown as { toString(): string }[]).map((id) => id.toString());
    this.chatGateway.emitToRoom(chatId, 'message_liked', { chatId, messageId, likes });
    return message;
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
    const addedUsers = (chat.participants as unknown as { _id: { toString(): string }; username: string }[])
      .filter((p) => dto.userIds.includes(p._id.toString()))
      .map((p) => ({ _id: p._id.toString(), username: p.username }));
    const payload = { chatId, addedUserIds: dto.userIds, addedUsers, addedBy: req.user.id };
    this.chatGateway.emitToRoom(chatId, 'member_added', payload);
    for (const userId of dto.userIds) {
      this.chatGateway.emitToUser(userId, 'member_added', payload);
    }
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

  @Patch(':chatId/description')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Update group description (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Description updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateDescription(
    @Param('chatId') chatId: string,
    @Body() dto: UpdateDescriptionDto,
  ): Promise<ChatDocument> {
    const description = dto.description !== undefined ? dto.description || null : null;
    const chat = await this.chatService.updateDescription(chatId, description);
    this.chatGateway.emitToRoom(chatId, 'group_updated', { chatId, description });
    return chat;
  }

  @Patch(':chatId/admin')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Add a member as group admin (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Admin added' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addAdmin(
    @Param('chatId') chatId: string,
    @Body() dto: TransferAdminDto,
  ): Promise<ChatDocument> {
    const chat = await this.chatService.addAdmin(chatId, dto.userId);
    this.chatGateway.emitToRoom(chatId, 'admin_added', {
      chatId,
      userId: dto.userId,
    });
    return chat;
  }

  @Delete(':chatId/admin')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Remove admin role from a member (admin only)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Admin role removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove last admin' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeAdmin(
    @Param('chatId') chatId: string,
    @Body() dto: RemoveAdminDto,
  ): Promise<ChatDocument> {
    const chat = await this.chatService.removeAdmin(chatId, dto.userId);
    this.chatGateway.emitToRoom(chatId, 'admin_removed', {
      chatId,
      userId: dto.userId,
    });
    return chat;
  }

  @Post(':chatId/image')
  @UseGuards(ChatAdminGuard)
  @ApiOperation({ summary: 'Upload group chat image (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Group image uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: groupImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadGroupImage(
    @Param('chatId') chatId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ChatDocument> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const imageUrl = `/uploads/group-images/${file.filename}`;
    const chat = await this.chatService.uploadGroupImage(chatId, imageUrl);
    this.chatGateway.emitToRoom(chatId, 'group_updated', { chatId, imageUrl });
    return chat;
  }

  @Delete(':chatId/direct')
  @UseGuards(ChatMemberGuard)
  @ApiOperation({ summary: 'Delete an empty direct (1:1) chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat deleted' })
  @ApiResponse({ status: 400, description: 'Not a direct chat' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteDirectChat(
    @Param('chatId') chatId: string,
    @Req() req: ChatRequest,
  ): Promise<{ message: string }> {
    if (req.chat.type !== 'direct') {
      throw new BadRequestException('This endpoint is for direct chats only');
    }
    await this.chatService.deleteGroup(chatId);
    return { message: 'Chat deleted successfully' };
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
