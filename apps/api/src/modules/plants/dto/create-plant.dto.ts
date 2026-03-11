import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlantDto {
  @ApiProperty({
    description: 'The name of the plant',
    example: 'My Monstera',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The species of the plant (must be from approved species list)',
    example: 'Monstera',
  })
  @IsString()
  @IsNotEmpty()
  species: string;

  @ApiProperty({
    description: 'URL to the plant image',
    example: '/uploads/plant-images/my-plant.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
