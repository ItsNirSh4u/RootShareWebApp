import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { GetMessagesDto } from './dto/get-messages.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async createMessage(
    senderId: string,
    chatId: string,
    content: string,
  ): Promise<MessageDocument> {
    const newMessage = new this.messageModel({
      senderId,
      chatId,
      content,
    });
    const savedMessage = await newMessage.save();

    const chat = await this.chatModel.findById(chatId);

    if (chat) {
      // Update the 'lastMessage' and unread count in the chat
      const recipient = chat.participants.find(p => p.toString() !== senderId);

      if (recipient) {
        const recipientId = recipient.toString();
        const newUnreadCount = (chat.unreadCount.get(recipientId) || 0) + 1;
        chat.unreadCount.set(recipientId, newUnreadCount);
      }

      chat.lastMessage = savedMessage._id as any;
      await chat.save();
    }


    return savedMessage.populate('senderId', 'username profileImageUrl');
  }

  async createOrGetChat(userId1: string, userId2: string): Promise<Chat> {
    // Find a chat that has both users as participants
    const existingChat = await this.chatModel
      .findOne({
        participants: { $all: [userId1, userId2], $size: 2 },
      })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username profileImageUrl' },
      });

    if (existingChat) {
      return existingChat;
    }

    // If no chat exists, create a new one
    const newChat = new this.chatModel({
      participants: [userId1, userId2],
    });

    return (await newChat.save()).populate(
      'participants',
      'username profileImageUrl',
    );
  }

  async getChatsForUser(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username' },
      });
  }

  async getMessagesForChat(
    chatId: string,
    getMessagesDto: GetMessagesDto,
  ): Promise<Message[]> {
    const { limit = 30, page = 1 } = getMessagesDto;
    const skip = (page - 1) * limit;

    return this.messageModel
      .find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username profileImageUrl');
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (chat) {
      chat.unreadCount.set(userId, 0);
      await chat.save();
    }
  }
}
