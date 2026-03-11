import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PostType } from '@rootshare/shared-types';
import { Like } from '../../likes/schemas/like.schema';

export type PostDocument = Post & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Plant', default: null })
  plantId?: Types.ObjectId;

  @Prop({ type: String, enum: PostType, required: true })
  type: PostType;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: String, default: null })
  location?: string;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  likes: Like[];
  likesCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false,
  match: { parentType: 'Post' },
});

PostSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'parentId',
  count: true,
  match: { parentType: 'Post' },
});
