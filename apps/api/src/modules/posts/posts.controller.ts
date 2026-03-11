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
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
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

const postImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const dir = path.join(uploadPath, 'post-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `post-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.', type: PostSchema })
  @ApiBadRequestResponse({ description: 'Invalid payload (e.g., invalid plantId format)' })
  @ApiNotFoundResponse({ description: 'Referenced plant not found' })
  @ApiForbiddenResponse({ description: 'Plant does not belong to the user' })
  @ApiUnauthorizedResponse()
  create(
    @Request() req: { user: { id: string } },
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload an image for a post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', schema: { properties: { url: { type: 'string' } } } })
  @ApiBadRequestResponse({ description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('image', { storage: postImageStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('Image file is required');
    return { url: `/uploads/post-images/${file.filename}` };
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all posts' })
  @ApiQuery({ name: 'plantId', required: false, type: String, description: 'Filter posts by plant ID' })
  @ApiResponse({ status: 200, description: 'A list of all posts.', type: [PostSchema] })
  @ApiUnauthorizedResponse()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('plantId') plantId?: string,
  ): Promise<Record<string, unknown>[]> {
    return this.postsService.findAll(req.user.id, plantId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiOperation({ summary: 'Retrieve a single post by ID' })
  @ApiResponse({ status: 200, description: 'The post with the specified ID.', type: PostSchema })
  @ApiProtectedReadResponses('Post')
  findOne(@Param('id') id: string): Promise<PostDocument> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @UseGuards(PostOwnerGuard)
  @ApiOperation({ summary: 'Update a post' })
  @ApiBadRequestResponse({ description: 'Invalid payload (e.g., invalid plantId format)' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.', type: PostSchema })
  @ApiOwnershipResponses('Post')
  update(
    @Request() req: { user: { id: string }; post: PostDocument },
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    return this.postsService.update(req.post, updatePostDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @UseGuards(PostOwnerGuard)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully deleted.' })
  @ApiOwnershipResponses('Post')
  remove(@Request() req: { post: PostDocument }): Promise<{ deleted: boolean; id: string }> {
    return this.postsService.remove(req.post);
  }
}
