import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { IRequest } from '@/common/interfaces/request.interface';
import { IUser } from '@rootshare/shared-types';

const getProfileImagesDir = (): string => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const dir = path.join(uploadPath, 'profile-images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const profileImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getProfileImagesDir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for users' })
  @ApiQuery({ name: 'query', description: 'Search query for username', type: String })
  @ApiResponse({ status: 200, description: 'Users found' })
  async searchUsers(@Query('query') query: string, @Req() req: IRequest): Promise<IUser[]> {
    const currentUserId = req.user.id;
    return this.usersService.searchUsers(query, currentUserId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<IUser | null> {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: IRequest, @Body() updateUserDto: UpdateUserDto): Promise<IUser> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('profile/image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: profileImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProfileImage(
    @Request() req: IRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IUser> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const localProfileImageUrl = `/uploads/profile-images/${file.filename}`;
    return this.usersService.update(req.user.id, { localProfileImageUrl });
  }
}
