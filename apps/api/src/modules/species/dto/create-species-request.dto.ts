import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeciesRequestDto {
  @ApiProperty({
    description: 'The common name of the species to be added',
    example: 'Snake Plant',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'The scientific name of the species',
    example: 'Dracaena trifasciata',
  })
  @IsOptional()
  @IsString()
  scientificName?: string;

  @ApiPropertyOptional({
    description: 'Description of the species',
    example: 'A succulent plant with tall, stiff leaves',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Reason for requesting this species to be added',
    example: 'This is a very popular houseplant that many users would benefit from having in the species list',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
