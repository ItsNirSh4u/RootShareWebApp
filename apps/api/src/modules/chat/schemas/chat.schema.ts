import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Message } from './message.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true })
export class Chat {
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  participants: User[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message' })
  lastMessage: Message;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCount: Map<string, number>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
