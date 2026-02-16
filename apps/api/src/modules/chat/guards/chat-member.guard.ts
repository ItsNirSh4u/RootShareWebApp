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
export class ChatMemberGuard implements CanActivate {
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

    const isMember = chat.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    request.chat = chat;
    return true;
  }
}
