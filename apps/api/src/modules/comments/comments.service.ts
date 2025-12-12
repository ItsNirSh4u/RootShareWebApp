import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>) {}

  // TODO: Implement comment operations
  // - create(userId: string, commentData: ICommentCreate)
  // - findByPost(postId: string)
  // - update(id: string, userId: string, updateData: ICommentUpdate)
  // - remove(id: string, userId: string)
}
