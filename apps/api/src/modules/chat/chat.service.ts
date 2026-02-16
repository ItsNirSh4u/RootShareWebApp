import { Injectable, BadRequestException } from '@nestjs/common';
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
      // Update unread count for all participants except the sender
      for (const participant of chat.participants) {
        const pid = participant.toString();
        if (pid !== senderId) {
          const current = chat.unreadCount.get(pid) || 0;
          chat.unreadCount.set(pid, current + 1);
        }
      }

      chat.lastMessage = savedMessage._id as any;
      await chat.save();
    }

    return savedMessage.populate('senderId', 'username profileImageUrl');
  }

  // --- Direct chat methods ---

  async createChat(userId1: string, userId2: string): Promise<Chat> {
    const newChat = new this.chatModel({
      participants: [userId1, userId2],
    });

    return (await newChat.save()).populate(
      'participants',
      'username profileImageUrl',
    );
  }

  async getChatByParticipants(userId1: string, userId2: string): Promise<Chat | null> {
    return this.chatModel
      .findOne({
        participants: { $all: [userId1, userId2], $size: 2 },
      })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username profileImageUrl' },
      });
  }

  // --- Shared methods (direct + group) ---

  async getChatsForUser(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username profileImageUrl')
      .populate('admin', 'username profileImageUrl')
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

  // --- Group chat methods ---

  async createGroupChat(
    creatorId: string,
    name: string,
    userIds: string[],
  ): Promise<ChatDocument> {
    const uniqueIds = [...new Set([creatorId, ...userIds])];

    const newChat = new this.chatModel({
      type: 'group',
      name,
      admin: creatorId,
      participants: uniqueIds,
    });

    return (await newChat.save()).populate(
      'participants',
      'username profileImageUrl',
    );
  }

  async addMembers(chatId: string, userIds: string[]): Promise<ChatDocument> {
    const chat = await this.chatModel.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: { $each: userIds } } },
      { new: true },
    );

    // Initialize unread counts for new members
    for (const userId of userIds) {
      if (!chat!.unreadCount.has(userId)) {
        chat!.unreadCount.set(userId, 0);
      }
    }
    await chat!.save();

    return chat!.populate('participants', 'username profileImageUrl');
  }

  async removeMember(chat: ChatDocument, userId: string): Promise<ChatDocument | null> {
    return this._removeParticipant(chat, userId);
  }

  async leaveGroup(chat: ChatDocument, userId: string): Promise<ChatDocument | null> {
    return this._removeParticipant(chat, userId);
  }

  async renameGroup(chatId: string, name: string): Promise<ChatDocument> {
    const chat = await this.chatModel
      .findByIdAndUpdate(chatId, { name }, { new: true })
      .populate('participants', 'username profileImageUrl')
      .populate('admin', 'username profileImageUrl');

    return chat!;
  }

  async transferAdmin(chatId: string, newAdminId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);

    const isMember = chat!.participants.some(
      (p) => p.toString() === newAdminId,
    );
    if (!isMember) {
      throw new BadRequestException('The target user is not a member of this group');
    }

    chat!.admin = newAdminId as any;
    await chat!.save();

    return chat!.populate('participants', 'username profileImageUrl');
  }

  async deleteGroup(chatId: string): Promise<void> {
    await this.messageModel.deleteMany({ chatId });
    await this.chatModel.findByIdAndDelete(chatId);
  }

  // --- Private helpers ---

  private async _removeParticipant(
    chat: ChatDocument,
    userId: string,
  ): Promise<ChatDocument | null> {
    chat.participants = chat.participants.filter(
      (p) => p.toString() !== userId,
    ) as any;
    chat.unreadCount.delete(userId);

    const wasAdmin = chat.admin && chat.admin.toString() === userId;

    if (chat.participants.length === 0) {
      await this.messageModel.deleteMany({ chatId: chat._id });
      await this.chatModel.findByIdAndDelete(chat._id);
      return null;
    }

    if (wasAdmin) {
      chat.admin = chat.participants[0] as any;
    }

    await chat.save();
    return chat.populate('participants', 'username profileImageUrl');
  }
}
