import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({
    type: Types.ObjectId,
    required: true,
    refPath: 'parentType',
  })
  parentId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['Post', 'Comment'],
  })
  parentType: 'Post' | 'Comment';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  createdAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Ensure one like per user per parent
LikeSchema.index({ parentId: 1, userId: 1, parentType: 1 }, { unique: true });
