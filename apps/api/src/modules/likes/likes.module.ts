import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { Like, LikeSchema } from './schemas/like.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { PostExistsGuard } from './guards/post-exists.guard';
import { CommentExistsGuard } from './guards/comment-exists.guard';
import {
  Comment,
  CommentSchema,
} from '../comments/schemas/comment.schema';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    forwardRef(() => CommentsModule),
  ],
  controllers: [LikesController],
  providers: [LikesService, PostExistsGuard, CommentExistsGuard],
  exports: [LikesService],
})
export class LikesModule {}
