import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SpeciesService } from './species.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { CreateSpeciesRequestDto } from './dto/create-species-request.dto';
import { ReviewSpeciesRequestDto } from './dto/review-species-request.dto';
import { Species } from './schemas/species.schema';
import { SpeciesRequest } from './schemas/species-request.schema';
import { UserRole, SpeciesRequestStatus } from '@rootshare/shared-types';
import {
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '../../common/decorators';
import { SpeciesDocument } from './schemas/species.schema';
import { SpeciesRequestDocument } from './schemas/species-request.schema';

@ApiTags('species')
@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all approved species (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all approved species',
    type: [Species],
  })
  findAllSpecies(): Promise<SpeciesDocument[]> {
    return this.speciesService.findAllSpecies();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Species ID', type: String })
  @ApiOperation({ summary: 'Get a species by ID' })
  @ApiResponse({
    status: 200,
    description: 'The species',
    type: Species,
  })
  @ApiNotFoundResponse('Species')
  findOneSpecies(@Param('id') id: string): Promise<SpeciesDocument> {
    return this.speciesService.findSpeciesById(id);
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new species request' })
  @ApiResponse({
    status: 201,
    description: 'The species request has been created',
    type: SpeciesRequest,
  })
  @ApiUnauthorizedResponse()
  createSpeciesRequest(
    @Request() req: { user: { id: string } },
    @Body() createRequestDto: CreateSpeciesRequestDto,
  ): Promise<SpeciesRequestDocument> {
    return this.speciesService.createSpeciesRequest(
      req.user.id,
      createRequestDto,
    );
  }

  @Get('requests/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my species requests' })
  @ApiResponse({
    status: 200,
    description: 'List of user species requests',
    type: [SpeciesRequest],
  })
  @ApiUnauthorizedResponse()
  findMySpeciesRequests(@Request() req: { user: { id: string } }): Promise<SpeciesRequestDocument[]> {
    return this.speciesService.findUserSpeciesRequests(req.user.id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new species (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The species has been created',
    type: Species,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  createSpecies(@Body() createSpeciesDto: CreateSpeciesDto): Promise<SpeciesDocument> {
    return this.speciesService.createSpecies(createSpeciesDto);
  }

  @Delete('admin/:id')
  @ApiParam({ name: 'id', description: 'Species ID', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a species (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The species has been deleted',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse('Species')
  deleteSpecies(@Param('id') id: string): Promise<{ deleted: boolean; id: string }> {
    return this.speciesService.deleteSpecies(id);
  }

  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all species requests (Admin only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SpeciesRequestStatus,
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all species requests',
    type: [SpeciesRequest],
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  findAllSpeciesRequests(@Query('status') status?: SpeciesRequestStatus): Promise<SpeciesRequestDocument[]> {
    return this.speciesService.findAllSpeciesRequests(status);
  }

  @Get('admin/requests/:id')
  @ApiParam({ name: 'id', description: 'Species request ID', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a species request by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The species request',
    type: SpeciesRequest,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse('Species request')
  findOneSpeciesRequest(@Param('id') id: string): Promise<SpeciesRequestDocument> {
    return this.speciesService.findSpeciesRequestById(id);
  }

  @Post('admin/requests/:id/review')
  @ApiParam({ name: 'id', description: 'Species request ID', type: String })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a species request (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The species request has been reviewed',
    type: SpeciesRequest,
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse('Species request')
  reviewSpeciesRequest(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() reviewDto: ReviewSpeciesRequestDto,
  ): Promise<SpeciesRequestDocument> {
    return this.speciesService.reviewSpeciesRequest(id, req.user.id, reviewDto);
  }
}
