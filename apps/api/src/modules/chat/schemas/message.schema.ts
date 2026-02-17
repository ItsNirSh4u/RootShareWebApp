import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { Chat } from './chat.schema';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  createdAt: Date;
  updatedAt: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: true })
  chatId: Chat;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: User;

  @Prop({ required: true })
  content: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
