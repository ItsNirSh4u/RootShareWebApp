import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { CommentOwnerGuard } from './guards/comment-owner.guard';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    forwardRef(() => LikesModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentOwnerGuard],
  exports: [CommentsService],
})
export class CommentsModule {}