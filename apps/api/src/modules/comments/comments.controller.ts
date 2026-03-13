import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  Comment as CommentSchema,
  CommentDocument,
} from './schemas/comment.schema';
import { CommentOwnerGuard } from './guards/comment-owner.guard';
import { CommentDeleteGuard } from './guards/comment-delete.guard';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created.',
    type: CommentSchema,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  create(
    @Request() req: { user: { id: string } },
    @Body() createCommentDto: CreateCommentDto
  ): Promise<CommentDocument> {
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Retrieve all comments for a post' })
  @ApiResponse({
    status: 200,
    description: 'A list of comments for the specified post.',
    type: [CommentSchema],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findAllForPost(@Param('postId') postId: string): Promise<CommentDocument[]> {
    return this.commentsService.findAllForPost(postId);
  }

  @Patch()
  @UseGuards(CommentOwnerGuard)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully updated.',
    type: CommentSchema,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  update(
    @Request() req: { user: { id: string }; comment: CommentDocument },
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentDocument> {
    return this.commentsService.update(req.comment, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(CommentDeleteGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  remove(@Request() req: { comment: CommentDocument }): Promise<{ deleted: boolean; id: string }> {
    return this.commentsService.remove(req.comment);
  }
}