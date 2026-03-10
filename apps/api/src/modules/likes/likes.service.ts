import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private likeModel: Model<LikeDocument>) {}

  async toggleLike(
    parentType: 'Post' | 'Comment',
    parentId: string,
    userId: string
  ): Promise<{ liked: boolean }> {
    const like = await this.likeModel.findOne({
      parentType,
      parentId: new Types.ObjectId(parentId),
      userId: new Types.ObjectId(userId),
    });

    if (like) {
      await like.deleteOne();
      return { liked: false };
    } else {
      const newLike = new this.likeModel({
        parentType,
        parentId: new Types.ObjectId(parentId),
        userId: new Types.ObjectId(userId),
      });
      try {
        await newLike.save();
      } catch (e: unknown) {
        if ((e as { code?: number })?.code === 11000) return { liked: true };
        throw e;
      }
      return { liked: true };
    }
  }

  async getLikesByParentId(
    parentType: 'Post' | 'Comment',
    parentId: string
  ): Promise<LikeDocument[]> {
    return this.likeModel
      .find({ parentType, parentId: new Types.ObjectId(parentId) })
      .exec();
  }

  async isLiked(
    parentType: 'Post' | 'Comment',
    parentId: string,
    userId: string
  ): Promise<{ liked: boolean }> {
    const like = await this.likeModel.findOne({
      parentType,
      parentId: new Types.ObjectId(parentId),
      userId: new Types.ObjectId(userId),
    });

    return { liked: !!like };
  }

  async countLikes(
    parentType: 'Post' | 'Comment',
    parentId: string
  ): Promise<{ likes: number }> {
    const count = await this.likeModel.countDocuments({
      parentType,
      parentId: new Types.ObjectId(parentId),
    });
    return { likes: count };
  }
}
