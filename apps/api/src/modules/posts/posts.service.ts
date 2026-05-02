import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PlantsService } from '../plants/plants.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private plantsService: PlantsService,
  ) { }

  async create(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    if (createPostDto.plantId) {
      const plant = await this.plantsService.findOne(createPostDto.plantId);
      if (plant.userId.toString() !== userId) {
        throw new ForbiddenException('Plant does not belong to the user');
      }
    }

    const newPost = new this.postModel({
      ...createPostDto,
      ...(createPostDto.plantId && { plantId: new Types.ObjectId(createPostDto.plantId) }),
      userId: new Types.ObjectId(userId),
    });
    return newPost.save();
  }

  async findAll(userId: string, plantId?: string): Promise<Record<string, unknown>[]> {
    const filter: Record<string, unknown> = {};
    if (plantId) filter.plantId = new Types.ObjectId(plantId);

    const posts = await this.postModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'username profileImageUrl')
      .populate('likesCount')
      .populate('plantId')
      .populate({ path: 'likes', match: { userId: new Types.ObjectId(userId) }, select: '_id' })
      .exec();

    return posts.map((post) => {
      const json = post.toJSON() as Record<string, unknown>;
      const likes = json['likes'] as unknown[];
      return { ...json, isLiked: Array.isArray(likes) && likes.length > 0, likes: undefined };
    });
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('userId', 'username profileImageUrl')
      .populate('likesCount')
      .populate('plantId')
      .exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async update(
    post: PostDocument,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    if (updatePostDto.plantId) {
      const plant = await this.plantsService.findOne(updatePostDto.plantId);
      if (plant.userId.toString() !== post.userId.toString()) {
        throw new ForbiddenException('Plant does not belong to the post owner');
      }
    }

    Object.assign(post, updatePostDto);
    return post.save();
  }

  async remove(post: PostDocument): Promise<{ deleted: boolean; id: string }> {
    const id = post._id.toString();
    await post.deleteOne();
    return { deleted: true, id };
  }
}
