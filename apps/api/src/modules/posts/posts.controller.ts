import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // TODO: Implement REST endpoints
  // GET    /posts - Get feed (with pagination & filters)
  // POST   /posts - Create new post
  // GET    /posts/:id - Get specific post
  // PUT    /posts/:id - Update post
  // DELETE /posts/:id - Delete post
}
