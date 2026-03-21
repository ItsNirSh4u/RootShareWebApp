import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';

@Injectable()
export class ChatAdminGuard implements CanActivate {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const chatId = request.params.chatId;
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!chatId) {
      throw new ForbiddenException('Chat ID not provided');
    }

    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID "${chatId}" not found`);
    }

    if (chat.type !== 'group') {
      throw new ForbiddenException('This action is only available for group chats');
    }

    if (!chat.admins?.some((a) => a.toString() === userId)) {
      throw new ForbiddenException('Only group admins can perform this action');
    }

    request.chat = chat;
    return true;
  }
}
