import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeciesDto {
  @ApiProperty({
    description: 'The common name of the species',
    example: 'Monstera',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'The scientific name of the species',
    example: 'Monstera deliciosa',
  })
  @IsOptional()
  @IsString()
  scientificName?: string;

  @ApiPropertyOptional({
    description: 'Description of the species',
    example: 'A tropical plant known for its large, split leaves',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
