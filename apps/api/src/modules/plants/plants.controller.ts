import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PlantsService } from './plants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlantOwnerGuard } from './guards/plant-owner.guard';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { Plant, PlantDocument } from './schemas/plant.schema';
import { PlantStatus } from '@rootshare/shared-types';
import {
  ApiUnauthorizedResponse,
  ApiOwnershipResponses,
  ApiProtectedReadResponses,
} from '../../common/decorators';

const plantImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const dir = path.join(uploadPath, 'plant-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `plant-${uniqueSuffix}${ext}`);
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

@ApiTags('plants')
@Controller('plants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plant' })
  @ApiResponse({ status: 201, description: 'The plant has been successfully created.', type: Plant })
  @ApiResponse({ status: 400, description: 'Species not in approved list.' })
  @ApiUnauthorizedResponse()
  create(
    @Request() req: { user: { id: string } },
    @Body() createPlantDto: CreatePlantDto,
  ): Promise<PlantDocument> {
    return this.plantsService.create(req.user.id, createPlantDto);
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload a plant image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully', schema: { properties: { url: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('image', { storage: plantImageStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('Image file is required');
    return { url: `/uploads/plant-images/${file.filename}` };
  }

  @Get()
  @ApiOperation({ summary: 'Get all plants for the current user' })
  @ApiQuery({ name: 'status', required: false, enum: PlantStatus, description: 'Filter by plant status' })
  @ApiResponse({ status: 200, description: "A list of the user's plants.", type: [Plant] })
  @ApiUnauthorizedResponse()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('status') status?: PlantStatus,
  ): Promise<PlantDocument[]> {
    return this.plantsService.findAll(req.user.id, status ? { status } : undefined);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured plants from all users' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of plants to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'A list of featured plants from all users.', type: [Plant] })
  @ApiUnauthorizedResponse()
  findFeatured(@Query('limit') limit?: number): Promise<PlantDocument[]> {
    return this.plantsService.findFeatured(limit || 10);
  }

  @Get('with-stats')
  @ApiOperation({ summary: "Get user's plants with post and comment counts" })
  @ApiResponse({ status: 200, description: "User's plants enriched with postsCount and commentsCount." })
  @ApiUnauthorizedResponse()
  findAllWithStats(@Request() req: { user: { id: string } }): Promise<Record<string, unknown>[]> {
    return this.plantsService.findAllWithStats(req.user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Get a plant by ID' })
  @ApiResponse({ status: 200, description: 'The plant with the specified ID.', type: Plant })
  @ApiProtectedReadResponses('Plant')
  findOne(@Request() req: { plant: PlantDocument }): PlantDocument {
    return req.plant;
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Update a plant' })
  @ApiResponse({ status: 200, description: 'The plant has been successfully updated.', type: Plant })
  @ApiResponse({ status: 400, description: 'Species not in approved list.' })
  @ApiOwnershipResponses('Plant')
  update(
    @Request() req: { user: { id: string }; plant: PlantDocument },
    @Body() updatePlantDto: UpdatePlantDto,
  ): Promise<PlantDocument> {
    return this.plantsService.update(req.plant, updatePlantDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Delete a plant' })
  @ApiResponse({ status: 200, description: 'The plant has been successfully deleted.' })
  @ApiOwnershipResponses('Plant')
  remove(@Request() req: { plant: PlantDocument }): Promise<{ deleted: boolean; id: string }> {
    return this.plantsService.remove(req.plant);
  }
}
