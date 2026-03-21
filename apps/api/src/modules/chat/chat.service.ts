import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  async getChatsForUser(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username profileImageUrl')
      .populate('admins', 'username profileImageUrl')
      .populate('owner', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username' },
      });
  }

  async loadMessagesById(
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

  async createGroupChat(
    creatorId: string,
    name: string,
    userIds: string[],
    description?: string,
  ): Promise<ChatDocument> {
    const uniqueIds = [...new Set([creatorId, ...userIds])];

    const newChat = new this.chatModel({
      type: 'group',
      name,
      description: description ?? null,
      owner: creatorId,
      admins: [creatorId],
      participants: uniqueIds,
    });

    const saved = await newChat.save();
    await saved.populate('participants', 'username profileImageUrl');
    await saved.populate('admins', 'username profileImageUrl');
    await saved.populate('owner', 'username profileImageUrl');
    return saved;
  }

  async addMembers(chatId: string, userIds: string[]): Promise<ChatDocument> {
    const chat = await this.chatModel.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: { $each: userIds } } },
      { new: true },
    );

    for (const userId of userIds) {
      if (!chat!.unreadCount.has(userId)) {
        chat!.unreadCount.set(userId, 0);
      }
    }
    await chat!.save();

    await chat!.populate('participants', 'username profileImageUrl');
    await chat!.populate('admins', 'username profileImageUrl');
    await chat!.populate('owner', 'username profileImageUrl');
    return chat!;
  }

  async removeMember(chat: ChatDocument, userId: string): Promise<ChatDocument | null> {
    const ownerId = chat.owner?.toString();
    if (ownerId && ownerId === userId) {
      throw new ForbiddenException('Cannot remove the group owner');
    }
    return this._removeParticipant(chat, userId);
  }

  async leaveGroup(chat: ChatDocument, userId: string): Promise<ChatDocument | null> {
    return this._removeParticipant(chat, userId);
  }

  async renameGroup(chatId: string, name: string): Promise<ChatDocument> {
    const chat = await this.chatModel
      .findByIdAndUpdate(chatId, { name }, { new: true })
      .populate('participants', 'username profileImageUrl')
      .populate('admins', 'username profileImageUrl')
      .populate('owner', 'username profileImageUrl');

    return chat!;
  }

  async updateDescription(chatId: string, description: string | null): Promise<ChatDocument> {
    const chat = await this.chatModel
      .findByIdAndUpdate(chatId, { description }, { new: true })
      .populate('participants', 'username profileImageUrl')
      .populate('admins', 'username profileImageUrl')
      .populate('owner', 'username profileImageUrl');

    return chat!;
  }

  async addAdmin(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);

    const isMember = chat!.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isMember) {
      throw new BadRequestException('The target user is not a member of this group');
    }

    const alreadyAdmin = chat!.admins?.some((a) => a.toString() === userId);
    if (!alreadyAdmin) {
      (chat!.admins as unknown as string[]).push(userId);
    }
    await chat!.save();

    await chat!.populate('participants', 'username profileImageUrl');
    await chat!.populate('admins', 'username profileImageUrl');
    await chat!.populate('owner', 'username profileImageUrl');
    return chat!;
  }

  async removeAdmin(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId);

    const isAdminMember = chat!.admins?.some((a) => a.toString() === userId);
    if (!isAdminMember) {
      throw new BadRequestException('User is not an admin of this group');
    }

    if (chat!.admins.length <= 1) {
      throw new BadRequestException('Cannot remove the last admin');
    }

    chat!.admins = chat!.admins.filter((a) => a.toString() !== userId) as any;
    await chat!.save();

    await chat!.populate('participants', 'username profileImageUrl');
    await chat!.populate('admins', 'username profileImageUrl');
    await chat!.populate('owner', 'username profileImageUrl');
    return chat!;
  }

  async uploadGroupImage(chatId: string, imageUrl: string): Promise<ChatDocument> {
    const chat = await this.chatModel
      .findByIdAndUpdate(chatId, { imageUrl }, { new: true })
      .populate('participants', 'username profileImageUrl')
      .populate('admins', 'username profileImageUrl')
      .populate('owner', 'username profileImageUrl');
    return chat!;
  }

  async deleteGroup(chatId: string): Promise<void> {
    await this.messageModel.deleteMany({ chatId });
    await this.chatModel.findByIdAndDelete(chatId);
  }

  async toggleMessageLike(chatId: string, messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findOne({ _id: messageId, chatId });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const alreadyLiked = (message.likes as unknown as string[]).some((id) => id.toString() === userId);
    if (alreadyLiked) {
      message.likes = (message.likes as unknown as string[]).filter((id) => id.toString() !== userId) as any;
    } else {
      (message.likes as unknown as string[]).push(userId);
    }

    await message.save();
    return message.populate('senderId', 'username profileImageUrl');
  }

  private async _removeParticipant(
    chat: ChatDocument,
    userId: string,
  ): Promise<ChatDocument | null> {
    chat.participants = chat.participants.filter(
      (p) => p.toString() !== userId,
    ) as any;
    chat.unreadCount.delete(userId);

    const wasAdmin = chat.admins?.some((a) => a.toString() === userId);

    if (chat.participants.length === 0) {
      await this.messageModel.deleteMany({ chatId: chat._id });
      await this.chatModel.findByIdAndDelete(chat._id);
      return null;
    }

    if (wasAdmin) {
      chat.admins = chat.admins.filter((a) => a.toString() !== userId) as any;
      if (chat.admins.length === 0) {
        chat.admins = [chat.participants[0]] as any;
      }
    }

    const wasOwner = chat.owner?.toString() === userId;
    if (wasOwner) {
      chat.owner = (chat.admins[0] ?? chat.participants[0]) as any;
    }

    await chat.save();
    await chat.populate('participants', 'username profileImageUrl');
    await chat.populate('admins', 'username profileImageUrl');
    await chat.populate('owner', 'username profileImageUrl');
    return chat;
  }
}
