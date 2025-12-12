import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlantsService } from './plants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('plants')
@Controller('plants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  // TODO: Implement REST endpoints
  // GET    /plants - Get all user's plants
  // POST   /plants - Create new plant
  // GET    /plants/:id - Get specific plant
  // PUT    /plants/:id - Update plant
  // DELETE /plants/:id - Delete plant
}
