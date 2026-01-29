import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';

@Injectable()
export class PostOwnerGuard implements CanActivate {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = request.params.id;
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    const postUserId = post.userId.toString();
    if (postUserId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this post');
    }

    request.post = post;

    return true;
  }
}
