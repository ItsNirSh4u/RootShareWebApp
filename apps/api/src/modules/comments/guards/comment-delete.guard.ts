import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Post, PostDocument } from '../../posts/schemas/post.schema';

@Injectable()
export class CommentDeleteGuard implements CanActivate {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const commentId = request.params.id;
    const userId = request.user?.id;

    if (!userId) throw new ForbiddenException('User not authenticated');
    if (!commentId) throw new ForbiddenException('Comment ID not provided');

    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException(`Comment with ID "${commentId}" not found`);

    if (comment.userId.toString() === userId) {
      request.comment = comment;
      return true;
    }

    const post = await this.postModel.findById(comment.postId).exec();
    if (post && post.userId.toString() === userId) {
      request.comment = comment;
      return true;
    }

    throw new ForbiddenException('You do not have permission to delete this comment');
  }
}
