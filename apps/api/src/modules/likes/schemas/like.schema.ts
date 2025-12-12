import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  createdAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Ensure one like per user per post
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
