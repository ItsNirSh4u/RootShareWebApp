import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Like } from '../../likes/schemas/like.schema';

export type CommentDocument = Comment & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret: any) {
      ret.commentId = ret._id;
      delete ret._id;
      delete ret.id;
      delete ret.__v;
    },
  },
  toObject: { virtuals: true },
})
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  likes: Like[];
  likesCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false,
  match: { parentType: 'Comment' },
});

CommentSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'parentId',
  count: true,
  match: { parentType: 'Comment' },
});
