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
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostSchema, PostDocument } from './schemas/post.schema';
import {
  ApiUnauthorizedResponse,
  ApiOwnershipResponses,
  ApiProtectedReadResponses,
} from '../../common/decorators';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'The post has been successfully created.',
    type: PostSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid payload (e.g., invalid plantId format)' })
  @ApiNotFoundResponse({ description: 'Referenced plant not found' })
  @ApiForbiddenResponse({ description: 'Plant does not belong to the user' })
  @ApiUnauthorizedResponse()
  create(
    @Request() req: { user: { id: string } },
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all posts' })
  @ApiResponse({
    status: 200,
    description: 'A list of all posts.',
    type: [PostSchema],
  })
  @ApiUnauthorizedResponse()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiOperation({ summary: 'Retrieve a single post by ID' })
  @ApiResponse({
    status: 200,
    description: 'The post with the specified ID.',
    type: PostSchema,
  })
  @ApiProtectedReadResponses('Post')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @UseGuards(PostOwnerGuard)
  @ApiOperation({ summary: 'Update a post' })
  @ApiBadRequestResponse({ description: 'Invalid payload (e.g., invalid plantId format)' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully updated.',
    type: PostSchema,
  })
  @ApiOwnershipResponses('Post')
  update(
    @Request() req: { user: { id: string }; post: PostDocument },
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(req.post, updatePostDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @UseGuards(PostOwnerGuard)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully deleted.',
  })
  @ApiOwnershipResponses('Post')
  remove(@Request() req: { post: PostDocument }) {
    return this.postsService.remove(req.post);
  }
}
