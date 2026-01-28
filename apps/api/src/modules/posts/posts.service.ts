import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto
  ): Promise<PostDocument> {
    const newPost = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
    });
    return newPost.save();
  }

  async findAll(): Promise<PostDocument[]> {
    // TODO: Add population to get user details
    return this.postModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDocument> {
    const existingPost = await this.postModel
      .findOneAndUpdate({ _id: id, userId: new Types.ObjectId(userId) }, updatePostDto, {
        new: true,
      })
      .exec();

    if (!existingPost) {
      // We check if the post exists at all to give a more specific error.
      const postExists = await this.postModel.findById(id).exec();
      if (!postExists) {
        throw new NotFoundException(`Post with ID "${id}" not found`);
      } else {
        throw new ForbiddenException(
          `You do not have permission to update this post.`
        );
      }
    }
    return existingPost;
  }

  async remove(
    id: string,
    userId: string
  ): Promise<{ deleted: boolean; id: string }> {
    const result = await this.postModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      // We check if the post exists at all to give a more specific error.
      const postExists = await this.postModel.findById(id).exec();
      if (!postExists) {
        throw new NotFoundException(`Post with ID "${id}" not found`);
      } else {
        throw new ForbiddenException(
          `You do not have permission to delete this post.`
        );
      }
    }
    return { deleted: true, id };
  }
}
