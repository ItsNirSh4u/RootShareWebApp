import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePlantDto } from './create-plant.dto';
import { PlantStatus } from '@rootshare/shared-types';

export class UpdatePlantDto extends PartialType(CreatePlantDto) {
  @ApiPropertyOptional({
    description: 'The status of the plant',
    enum: PlantStatus,
    example: PlantStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;
}
