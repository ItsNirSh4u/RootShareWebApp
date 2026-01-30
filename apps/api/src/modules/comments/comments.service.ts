import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

    // Verify the post exists
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

    // Increment the commentsCount on the post
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    return savedComment;
  }

  async findAllForPost(postId: string): Promise<CommentDocument[]> {
    // Verify the post exists
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    return this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'username profileImageUrl') // Populate user details
      .sort({ createdAt: 'asc' })
      .exec();
  }

  async update(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentDocument> {
    const existingComment = await this.commentModel
      .findOneAndUpdate(
        { _id: commentId, userId: new Types.ObjectId(userId) },
        { content: updateCommentDto.content },
        { new: true }
      )
      .exec();

    if (!existingComment) {
      const commentExists = await this.commentModel.findById(commentId).exec();
      if (!commentExists) {
        throw new NotFoundException(`Comment with ID "${commentId}" not found`);
      } else {
        throw new ForbiddenException(
          `You do not have permission to update this comment.`
        );
      }
    }
    return existingComment;
  }

  async remove(
    commentId: string,
    userId: string
  ): Promise<{ deleted: boolean; id: string }> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException(
        `You do not have permission to delete this comment.`
      );
    }

    const result = await this.commentModel.deleteOne({ _id: commentId }).exec();

    if (result.deletedCount > 0) {
      // Decrement the commentsCount on the post
      await this.postModel.findByIdAndUpdate(comment.postId, {
        $inc: { commentsCount: -1 },
      });
    }

    return { deleted: true, id: commentId };
  }
}