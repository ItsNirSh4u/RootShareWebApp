import { Injectable, NotFoundException } from '@nestjs/common';
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
    createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    const newPost = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
    });
    return newPost.save();
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postModel.find().sort({ createdAt: -1 }).populate('likesCount').exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id).populate('likesCount').exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async update(
    post: PostDocument,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    Object.assign(post, updatePostDto);
    return post.save();
  }

  async remove(post: PostDocument): Promise<{ deleted: boolean; id: string }> {
    const id = post._id.toString();
    await post.deleteOne();
    return { deleted: true, id };
  }
}
