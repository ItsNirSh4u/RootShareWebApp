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
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment as CommentSchema } from './schemas/comment.schema';

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
  ) {
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
  findAllForPost(@Param('postId') postId: string) {
    return this.commentsService.findAllForPost(postId);
  }

  @Patch(':id')
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
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return this.commentsService.update(id, req.user.id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.commentsService.remove(id, req.user.id);
  }
}