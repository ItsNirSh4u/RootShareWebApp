import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../../posts/schemas/post.schema';

@Injectable()
export class PostExistsGuard implements CanActivate {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = request.params.postId;

    if (!postId) {
      throw new NotFoundException('Post ID not found in request');
    }

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    return true;
  }
}
