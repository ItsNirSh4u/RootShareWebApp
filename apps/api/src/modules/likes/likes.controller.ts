import {
  Controller,
  UseGuards,
  Post,
  Request,
  Param,
  Get,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostExistsGuard } from './guards/post-exists.guard';
import { LikeToggleDto } from './dto/like-toggle.dto';
import { IsLikedDto } from './dto/is-liked.dto';
import { LikesCountDto } from './dto/likes-count.dto';
import { Like } from './schemas/like.schema';
import { CommentExistsGuard } from './guards/comment-exists.guard';

@ApiTags('likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // POSTS
  @Post('posts/:postId/toggle')
  @UseGuards(PostExistsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiResponse({
    status: 200,
    description: 'The like has been successfully toggled.',
    type: LikeToggleDto,
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  togglePostLike(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string
  ): Promise<LikeToggleDto> {
    return this.likesService.toggleLike('Post', postId, req.user.id);
  }

  @Get('posts/:postId')
  @UseGuards(PostExistsGuard)
  @ApiOperation({ summary: 'Get all likes for a post' })
  @ApiResponse({
    status: 200,
    description: 'A list of all likes for the post.',
    type: [Like],
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  getLikesByPostId(@Param('postId') postId: string): Promise<Like[]> {
    return this.likesService.getLikesByParentId('Post', postId);
  }

  @Get('posts/:postId/count')
  @UseGuards(PostExistsGuard)
  @ApiOperation({ summary: 'Get the total number of likes for a post' })
  @ApiResponse({
    status: 200,
    description: 'The total number of likes for the post.',
    type: LikesCountDto,
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  countPostLikes(@Param('postId') postId: string): Promise<LikesCountDto> {
    return this.likesService.countLikes('Post', postId);
  }

  @Get('posts/:postId/is-liked')
  @UseGuards(PostExistsGuard)
  @ApiOperation({ summary: 'Check if the current user liked a post' })
  @ApiResponse({
    status: 200,
    description: 'Whether the current user liked the post.',
    type: IsLikedDto,
  })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  isPostLiked(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string
  ): Promise<IsLikedDto> {
    return this.likesService.isLiked('Post', postId, req.user.id);
  }

  // COMMENTS
  @Post('comments/:commentId/toggle')
  @UseGuards(CommentExistsGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiResponse({
    status: 200,
    description: 'The like has been successfully toggled.',
    type: LikeToggleDto,
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  toggleCommentLike(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string
  ): Promise<LikeToggleDto> {
    return this.likesService.toggleLike('Comment', commentId, req.user.id);
  }

  @Get('comments/:commentId')
  @UseGuards(CommentExistsGuard)
  @ApiOperation({ summary: 'Get all likes for a comment' })
  @ApiResponse({
    status: 200,
    description: 'A list of all likes for the comment.',
    type: [Like],
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  getLikesByCommentId(@Param('commentId') commentId: string): Promise<Like[]> {
    return this.likesService.getLikesByParentId('Comment', commentId);
  }

  @Get('comments/:commentId/count')
  @UseGuards(CommentExistsGuard)
  @ApiOperation({ summary: 'Get the total number of likes for a comment' })
  @ApiResponse({
    status: 200,
    description: 'The total number of likes for the comment.',
    type: LikesCountDto,
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  countCommentLikes(
    @Param('commentId') commentId: string
  ): Promise<LikesCountDto> {
    return this.likesService.countLikes('Comment', commentId);
  }

  @Get('comments/:commentId/is-liked')
  @UseGuards(CommentExistsGuard)
  @ApiOperation({ summary: 'Check if the current user liked a comment' })
  @ApiResponse({
    status: 200,
    description: 'Whether the current user liked the comment.',
    type: IsLikedDto,
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  isCommentLiked(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string
  ): Promise<IsLikedDto> {
    return this.likesService.isLiked('Comment', commentId, req.user.id);
  }
}

