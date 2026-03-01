import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>
  ) {}

  async create(
    userId: string,
    createCommentDto: CreateCommentDto
  ): Promise<CommentDocument> {
    const { postId, content } = createCommentDto;

    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    const newComment = new this.commentModel({
      content,
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });

    const savedComment = await newComment.save();

    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    return savedComment;
  }

  async findAllForPost(postId: string): Promise<CommentDocument[]> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    return this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'username profileImageUrl')
      .populate('likesCount')
      .sort({ createdAt: 'asc' })
      .exec();
  }

  async update(
    comment: CommentDocument,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentDocument> {
    Object.assign(comment, updateCommentDto);
    return comment.save();
  }

  async remove(
    comment: CommentDocument
  ): Promise<{ deleted: boolean; id: string }> {
    const id = comment._id.toString();

    await comment.deleteOne();

    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -1 },
    });

    return { deleted: true, id };
  }
}
