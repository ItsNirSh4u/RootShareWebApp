import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../../comments/schemas/comment.schema';

@Injectable()
export class CommentExistsGuard implements CanActivate {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const commentId = request.params.commentId;

    if (!commentId) {
      throw new NotFoundException('Comment ID not found in request params');
    }

    const comment = await this.commentModel.findById(commentId);

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return true;
  }
}
