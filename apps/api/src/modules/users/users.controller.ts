import { Controller, Get, Put, Body, Param, UseGuards, Request, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { IRequest } from '@/common/interfaces/request.interface';

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
  async searchUsers(@Query('query') query: string, @Req() req: IRequest) {
    const currentUserId = req.user.id;
    return this.usersService.searchUsers(query, currentUserId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }
}
