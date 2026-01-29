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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('plants')
@Controller('plants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plant' })
  @ApiResponse({
    status: 201,
    description: 'The plant has been successfully created.',
    type: Plant,
  })
  @ApiResponse({
    status: 400,
    description: 'Species not in approved list.',
  })
  @ApiUnauthorizedResponse()
  create(
    @Request() req: { user: { id: string } },
    @Body() createPlantDto: CreatePlantDto,
  ) {
    return this.plantsService.create(req.user.id, createPlantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plants for the current user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PlantStatus,
    description: 'Filter by plant status',
  })
  @ApiResponse({
    status: 200,
    description: "A list of the user's plants.",
    type: [Plant],
  })
  @ApiUnauthorizedResponse()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('status') status?: PlantStatus,
  ) {
    return this.plantsService.findAll(req.user.id, status ? { status } : undefined);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Get a plant by ID' })
  @ApiResponse({
    status: 200,
    description: 'The plant with the specified ID.',
    type: Plant,
  })
  @ApiProtectedReadResponses('Plant')
  findOne(@Request() req: { plant: PlantDocument }) {
    return req.plant;
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Update a plant' })
  @ApiResponse({
    status: 200,
    description: 'The plant has been successfully updated.',
    type: Plant,
  })
  @ApiResponse({
    status: 400,
    description: 'Species not in approved list.',
  })
  @ApiOwnershipResponses('Plant')
  update(
    @Request() req: { user: { id: string }; plant: PlantDocument },
    @Body() updatePlantDto: UpdatePlantDto,
  ) {
    return this.plantsService.update(req.plant, updatePlantDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Plant ID', type: String })
  @UseGuards(PlantOwnerGuard)
  @ApiOperation({ summary: 'Delete a plant' })
  @ApiResponse({
    status: 200,
    description: 'The plant has been successfully deleted.',
  })
  @ApiOwnershipResponses('Plant')
  remove(@Request() req: { plant: PlantDocument }) {
    return this.plantsService.remove(req.plant);
  }
}
